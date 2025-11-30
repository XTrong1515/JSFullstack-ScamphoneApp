import asyncHandler from 'express-async-handler';
import Order from '../Models/OrderModel.js';
import Product from '../Models/ProductModel.js';
import Discount from '../Models/DiscountModel.js';
import { createNotification } from './notificationController.js';

// @desc    Create new order
// @route   POST /api/v1/orders
// @access  Private
const addOrderItems = asyncHandler(async (req, res) => {
  const { orderItems, shippingAddress, paymentMethod, totalPrice, discountCode } = req.body;

  if (!orderItems || orderItems.length === 0) {
    res.status(400);
    throw new Error('Không có sản phẩm trong đơn hàng');
  }

  if (!shippingAddress || !shippingAddress.fullName || !shippingAddress.phone || !shippingAddress.address) {
    res.status(400);
    throw new Error('Thông tin địa chỉ giao hàng không đầy đủ');
  }

  let discountInfo = null;
  let discountDoc = null;

  // BƯỚC 1: Validate mã giảm giá (nếu có)
  if (discountCode) {
    console.log('[DISCOUNT] Validating discount code:', discountCode);
    discountDoc = await Discount.findOne({ code: discountCode.toUpperCase() });
    
    if (!discountDoc) {
      console.log('[DISCOUNT] ❌ Discount code not found:', discountCode);
      res.status(400);
      throw new Error('Mã giảm giá không tồn tại');
    }
    
    console.log('[DISCOUNT] Found discount:', {
      id: discountDoc._id,
      code: discountDoc.code,
      usedCount: discountDoc.usedCount,
      maxUses: discountDoc.maxUses,
      maxUsesPerUser: discountDoc.maxUsesPerUser
    });

    // Kiểm tra maxUses
    if (discountDoc.maxUses && discountDoc.usedCount >= discountDoc.maxUses) {
      res.status(400);
      throw new Error('Mã giảm giá đã hết lượt sử dụng');
    }

    // QUAN TRỌNG: Kiểm tra maxUsesPerUser
    const userUsageCount = discountDoc.usedBy.filter(
      usage => usage.user.toString() === req.user._id.toString()
    ).length;
    
    if (userUsageCount >= discountDoc.maxUsesPerUser) {
      res.status(400);
      throw new Error('Bạn đã hết lượt sử dụng mã này');
    }

    // Validate bằng method canUse
    const validation = discountDoc.canUse(req.user._id, totalPrice);
    if (!validation.valid) {
      res.status(400);
      throw new Error(validation.message);
    }

    // Tính số tiền giảm
    const discountAmount = discountDoc.calculateDiscount(totalPrice);
    
    discountInfo = {
      code: discountDoc.code,
      discountId: discountDoc._id,
      amount: discountAmount,
      type: discountDoc.type
    };
  }

  // BƯỚC 1.5: Kiểm tra stock trước khi tạo đơn hàng
  console.log('[ORDER] Checking stock for', orderItems.length, 'items before creating order');
  for (const item of orderItems) {
    console.log('[ORDER] Checking stock for item:', item.name, 'quantity:', item.quantity);
    const product = await Product.findById(item.product);
    
    if (!product) {
      console.log('[ORDER] ❌ Product not found:', item.product);
      res.status(404);
      throw new Error(`Sản phẩm ${item.name} không tồn tại`);
    }

    console.log('[ORDER] Product found:', product.name, 'stock_quantity:', product.stock_quantity, 'has variants:', product.variants?.length > 0);

    // Check variant stock
    if (item.variantAttributes) {
      console.log('[ORDER] Item has variant attributes:', item.variantAttributes);
      const variant = product.variants.find(v => {
        const vAttrs = v.attributes instanceof Map ? Object.fromEntries(v.attributes) : v.attributes;
        return JSON.stringify(vAttrs) === JSON.stringify(item.variantAttributes);
      });

      if (!variant) {
        console.log('[ORDER] ❌ Variant not found for attributes:', item.variantAttributes);
        res.status(400);
        throw new Error(`Phiên bản sản phẩm ${item.name} không tồn tại`);
      }

      console.log('[ORDER] Variant found, stock:', variant.stock, 'needed:', item.quantity);
      if (variant.stock < item.quantity) {
        console.log('[ORDER] ❌ Insufficient stock for variant');
        res.status(400);
        throw new Error(`Sản phẩm "${item.name}" không đủ số lượng. Còn lại: ${variant.stock}, yêu cầu: ${item.quantity}`);
      }
    } else {
      // Check main product stock
      console.log('[ORDER] Checking main product stock:', product.stock_quantity, 'vs needed:', item.quantity);
      if (product.stock_quantity < item.quantity) {
        console.log('[ORDER] ❌ Insufficient stock for main product');
        res.status(400);
        throw new Error(`Sản phẩm "${item.name}" không đủ số lượng. Còn lại: ${product.stock_quantity}, yêu cầu: ${item.quantity}`);
      }
    }
  }
  console.log('[ORDER] ✅ All stock checks passed');

  // Tạo đơn hàng
  const order = new Order({
    user: req.user._id,
    orderItems,
    shippingAddress,
    paymentMethod: paymentMethod || 'COD',
    discount: discountInfo,
    totalPrice,
    status: 'pending'
  });

  const createdOrder = await order.save();
  console.log('[ORDER] Created order:', createdOrder._id, 'with discount:', discountInfo?.code || 'none');

  // BƯỚC 2: Consumption - Cập nhật discount (Atomic Update)
  if (discountDoc) {
    console.log('[DISCOUNT] Starting consumption process for:', discountCode);
    try {
      const updatedDiscount = await Discount.findOneAndUpdate(
        { _id: discountDoc._id },
        {
          $inc: { usedCount: 1 },
          $push: { 
            usedBy: { 
              user: req.user._id, 
              orderId: createdOrder._id,
              orderValue: totalPrice,
              usedAt: new Date() 
            } 
          }
        },
        { new: true }
      );
      
      if (!updatedDiscount) {
        console.error('[DISCOUNT] ERROR: Discount not found for update:', discountDoc._id);
      } else {
        console.log(`[DISCOUNT] ✅ Code ${discountCode} consumed by user ${req.user._id}`);
        console.log(`[DISCOUNT] UsedCount: ${updatedDiscount.usedCount}/${updatedDiscount.maxUses || 'unlimited'}`);
        console.log(`[DISCOUNT] User usage: ${updatedDiscount.usedBy.filter(u => u.user.toString() === req.user._id.toString()).length}/${discountDoc.maxUsesPerUser}`);
      }
    } catch (error) {
      console.error('[DISCOUNT] ❌ Failed to update discount usage:', error);
      console.error('[DISCOUNT] Error details:', error.message);
      // CRITICAL: Nếu không update được discount, nên rollback order hoặc thông báo
      // Tuy nhiên, để tránh mất đơn hàng, ta log error và để admin xử lý thủ công
    }
  }
  
  res.status(201).json(createdOrder);
});


// @desc    Get order by ID
// @route   GET /api/v1/orders/:id
// @access  Private
const getOrderById = asyncHandler(async (req, res) => {
    const order = await Order.findById(req.params.id)
      .populate('user', 'name email')
      .populate('orderItems.product');

    if (order && (req.user.role === 'admin' || order.user._id.equals(req.user._id))) {
        res.json(order);
    } else {
        res.status(404);
        throw new Error('Không tìm thấy đơn hàng');
    }
});


// @desc    Get logged in user orders
// @route   GET /api/v1/orders/myorders
// @access  Private
const getMyOrders = asyncHandler(async (req, res) => {
  const orders = await Order.find({ user: req.user._id })
    .populate('orderItems.product')
    .sort({ createdAt: -1 });
  res.json(orders);
});

// @desc    Get all orders (Admin)
// @route   GET /api/v1/orders
// @access  Private/Admin
const getAllOrders = asyncHandler(async (req, res) => {
  const filter = {};
  if (req.query.includeCancelled !== 'true') {
    filter.status = { $ne: 'cancelled' };
  }
  const orders = await Order.find(filter)
    .populate('user', 'name email')
    .populate('orderItems.product')
    .sort({ createdAt: -1 });
  res.json(orders);
});

// @desc    Update order status (Admin)
// @route   PUT /api/v1/orders/:id/status
// @access  Private/Admin
const updateOrderStatus = asyncHandler(async (req, res) => {
  const { status, driverName, driverPhone, vehicleNumber } = req.body;
  const order = await Order.findById(req.params.id);

  if (!order) {
    res.status(404);
    throw new Error('Không tìm thấy đơn hàng');
  }

  // Nếu có thông tin tài xế được gửi kèm, lưu vào shippingDetails
  if (status === 'shipping' && driverName && driverPhone) {
    // Lưu thông tin vào shippingDetails (theo yêu cầu prompt)
    order.shippingDetails = {
      driverName: driverName.trim(),
      driverPhone: driverPhone.trim(),
      vehicleNumber: vehicleNumber?.trim() || '',
      shippedAt: new Date()
    };

    // Đồng thời cập nhật deliveryPerson để tương thích với code cũ
    order.deliveryPerson = {
      name: driverName.trim(),
      phone: driverPhone.trim(),
      vehicleNumber: vehicleNumber?.trim() || '',
      assignedAt: new Date()
    };
  }

  order.status = status;

  if (status === 'delivered') {
    order.isDelivered = true;
    order.deliveredAt = Date.now();
  }

  const updatedOrder = await order.save();
  
  // Tạo thông tin sản phẩm cho notification
  const productDetails = order.orderItems.map(item => {
    let detail = item.name;
    if (item.variantAttributes) {
      try {
        // Handle both Map and plain object
        const attrs = item.variantAttributes instanceof Map 
          ? Object.fromEntries(item.variantAttributes) 
          : item.variantAttributes;
        
        if (attrs && typeof attrs === 'object' && Object.keys(attrs).length > 0) {
          const variantStr = Object.values(attrs).filter(v => v).join(', ');
          if (variantStr) detail += ` (${variantStr})`;
        }
      } catch (err) {
        console.log('Error formatting variant:', err);
      }
    }
    return `${detail} x${item.quantity}`;
  }).join(', ');
  
  // Tạo thông báo cho user
  let notificationTitle = 'Cập nhật đơn hàng';
  let notificationMessage = `Đơn hàng #${order._id.toString().slice(-8)} của bạn đã được cập nhật trạng thái: ${status}`;
  
  if (status === 'delivered') {
    notificationTitle = 'Đơn hàng đã giao thành công';
    notificationMessage = `Đơn hàng #${order._id.toString().slice(-8)} đã được giao thành công. Sản phẩm: ${productDetails}. Cảm ơn bạn đã mua hàng!`;
  } else if (status === 'shipping') {
    notificationTitle = 'Đơn hàng đang được giao';
    // Thêm thông tin tài xế vào notification nếu có
    if (driverName && driverPhone) {
      notificationMessage = `Đơn hàng #${order._id.toString().slice(-8)} đang được giao bởi tài xế ${driverName} - ${driverPhone}. Vui lòng chú ý điện thoại. Sản phẩm: ${productDetails}.`;
    } else {
      notificationMessage = `Đơn hàng #${order._id.toString().slice(-8)} đang trên đường giao đến bạn. Sản phẩm: ${productDetails}.`;
    }
  }

  await createNotification(order.user, {
    type: status === 'delivered' ? 'order_delivered' : 'order_shipped',
    title: notificationTitle,
    message: notificationMessage,
    order: order._id
  });

  res.json(updatedOrder);
});

// @desc    Confirm order (Admin) - Deduct stock
// @route   PUT /api/v1/orders/:id/confirm
// @access  Private/Admin
const confirmOrder = asyncHandler(async (req, res) => {
  console.log('[CONFIRM ORDER] Order ID:', req.params.id);
  const order = await Order.findById(req.params.id).populate('orderItems.product');

  console.log('[CONFIRM ORDER] Order found:', !!order);
  if (!order) {
    console.log('[CONFIRM ORDER] ERROR: Order not found');
    res.status(404);
    throw new Error('Không tìm thấy đơn hàng');
  }

  console.log('[CONFIRM ORDER] Order status:', order.status);
  if (order.status !== 'pending') {
    console.log('[CONFIRM ORDER] ERROR: Order already processed');
    res.status(400);
    throw new Error('Đơn hàng đã được xử lý');
  }
  
  console.log('[CONFIRM ORDER] Starting stock check for', order.orderItems.length, 'items');

  // Kiểm tra tồn kho
  for (const item of order.orderItems) {
    console.log('[CONFIRM ORDER] Checking item:', item.name, 'SKU:', item.sku, 'Has variants:', !!item.variantAttributes);
    
    const product = await Product.findById(item.product);
    if (!product) {
      console.log('[CONFIRM ORDER] ERROR: Product not found:', item.product);
      res.status(404);
      throw new Error(`Không tìm thấy sản phẩm: ${item.name}`);
    }

    // Nếu có thông tin variant (sku hoặc variantAttributes), kiểm tra stock của variant
    if (item.sku || item.variantAttributes) {
      console.log('[CONFIRM ORDER] Item has variant, searching...');
      let variant;
      
      // Tìm variant theo SKU (ưu tiên)
      if (item.sku) {
        console.log('[CONFIRM ORDER] Searching by SKU:', item.sku);
        variant = product.variants.find(v => v.sku === item.sku);
      } 
      // Hoặc tìm theo variantAttributes
      else if (item.variantAttributes) {
        console.log('[CONFIRM ORDER] Searching by attributes:', item.variantAttributes);
        
        // Convert both to plain objects for comparison
        const getPlainObject = (obj) => {
          if (!obj) return {};
          if (obj instanceof Map) return Object.fromEntries(obj);
          if (obj.toObject) return obj.toObject();
          return obj;
        };
        
        const itemAttrsObj = getPlainObject(item.variantAttributes);
        console.log('[CONFIRM ORDER] Item attrs as plain object:', itemAttrsObj);
        
        variant = product.variants.find(v => {
          if (!v.attributes) return false;
          const variantAttrsObj = getPlainObject(v.attributes);
          
          console.log('[CONFIRM ORDER] Comparing variant attrs:', variantAttrsObj, 'with item attrs:', itemAttrsObj);
          
          // Check if all keys match
          const itemKeys = Object.keys(itemAttrsObj);
          const variantKeys = Object.keys(variantAttrsObj);
          
          if (itemKeys.length !== variantKeys.length) return false;
          
          return itemKeys.every(key => 
            variantAttrsObj[key] === itemAttrsObj[key]
          );
        });
      }

      if (!variant) {
        console.log('[CONFIRM ORDER] ERROR: Variant not found for product:', item.name);
        console.log('[CONFIRM ORDER] Available variants:', product.variants);
        res.status(404);
        throw new Error(`Không tìm thấy biến thể của sản phẩm: ${item.name}`);
      }
      
      console.log('[CONFIRM ORDER] Variant found, stock:', variant.stock, 'needed:', item.quantity);
      if (variant.stock < item.quantity) {
        res.status(400);
        const attrsStr = item.variantAttributes 
          ? Object.entries(item.variantAttributes.toObject ? item.variantAttributes.toObject() : item.variantAttributes)
              .map(([k, v]) => `${k}: ${v}`).join(', ')
          : item.sku;
        throw new Error(`Sản phẩm ${item.name} (${attrsStr}) không đủ hàng trong kho (Còn: ${variant.stock}, Cần: ${item.quantity})`);
      }
    } 
    // Nếu không có variant, kiểm tra stock_quantity của sản phẩm cha
    else {
      if (product.stock_quantity < item.quantity) {
        res.status(400);
        throw new Error(`Sản phẩm ${item.name} không đủ hàng trong kho (Còn: ${product.stock_quantity}, Cần: ${item.quantity})`);
      }
    }
  }

  // Trừ số lượng tồn kho
  for (const item of order.orderItems) {
    const product = await Product.findById(item.product);
    if (product) {
      // Nếu có variant, trừ stock của variant
      if (item.sku || item.variantAttributes) {
        let variantIndex = -1;
        
        // Helper function giống phần validation
        const getPlainObject = (obj) => {
          if (!obj) return {};
          if (obj instanceof Map) return Object.fromEntries(obj);
          if (obj.toObject) return obj.toObject();
          return obj;
        };
        
        // Tìm variant theo SKU
        if (item.sku) {
          variantIndex = product.variants.findIndex(v => v.sku === item.sku);
        } 
        // Hoặc tìm theo variantAttributes
        else if (item.variantAttributes) {
          const itemAttrsObj = getPlainObject(item.variantAttributes);
          
          console.log('[DEDUCT STOCK] Looking for variant with attrs:', itemAttrsObj);
          
          variantIndex = product.variants.findIndex(v => {
            if (!v.attributes) return false;
            const variantAttrsObj = getPlainObject(v.attributes);
            
            // CRITICAL: Check length first to avoid partial matches
            const itemKeys = Object.keys(itemAttrsObj);
            const variantKeys = Object.keys(variantAttrsObj);
            
            if (itemKeys.length !== variantKeys.length) {
              console.log('[DEDUCT STOCK] Length mismatch:', itemKeys.length, 'vs', variantKeys.length);
              return false;
            }
            
            const match = itemKeys.every(key => 
              variantAttrsObj[key] === itemAttrsObj[key]
            );
            
            console.log('[DEDUCT STOCK] Comparing', variantAttrsObj, 'vs', itemAttrsObj, '→', match);
            
            return match;
          });
          
          console.log('[DEDUCT STOCK] Variant index found:', variantIndex);
        }

        if (variantIndex >= 0) {
          const newStock = product.variants[variantIndex].stock - item.quantity;
          
          // Đảm bảo stock không âm
          if (newStock < 0) {
            res.status(400);
            throw new Error(`Lỗi xử lý đơn hàng: Stock của variant không thể âm (Stock hiện tại: ${product.variants[variantIndex].stock}, Yêu cầu: ${item.quantity})`);
          }
          
          product.variants[variantIndex].stock = newStock;
          
          // Tính lại tổng stock_quantity từ tất cả variants
          product.stock_quantity = product.variants.reduce((total, v) => total + (v.stock || 0), 0);
        }
      } 
      // Nếu không có variant, trừ stock_quantity của sản phẩm cha
      else {
        const newStock = product.stock_quantity - item.quantity;
        
        // Đảm bảo stock không âm
        if (newStock < 0) {
          res.status(400);
          throw new Error(`Lỗi xử lý đơn hàng: Stock sản phẩm không thể âm (Stock hiện tại: ${product.stock_quantity}, Yêu cầu: ${item.quantity})`);
        }
        
        product.stock_quantity = newStock;
      }
      
      await product.save();
    }
  }

  order.status = 'processing';
  const updatedOrder = await order.save();

  // Tạo thông tin sản phẩm cho notification
  const productDetails = order.orderItems.map(item => {
    let detail = item.name;
    if (item.variantAttributes) {
      try {
        const attrs = item.variantAttributes instanceof Map 
          ? Object.fromEntries(item.variantAttributes) 
          : item.variantAttributes;
        
        if (attrs && typeof attrs === 'object' && Object.keys(attrs).length > 0) {
          const variantStr = Object.values(attrs).filter(v => v).join(', ');
          if (variantStr) detail += ` (${variantStr})`;
        }
      } catch (err) {
        console.log('Error formatting variant:', err);
      }
    }
    return `${detail} x${item.quantity}`;
  }).join(', ');

  // Tạo thông báo cho user
  await createNotification(order.user, {
    type: 'order_confirmed',
    title: 'Đơn hàng đã được xác nhận',
    message: `Đơn hàng #${order._id.toString().slice(-8)} của bạn đã được xác nhận và đang được chuẩn bị. Sản phẩm: ${productDetails}. Tổng tiền: ${order.totalPrice.toLocaleString()}₫`,
    order: order._id
  });

  res.json(updatedOrder);
});

// @desc    Reject order (Admin) with reason
// @route   PUT /api/v1/orders/:id/reject
// @access  Private/Admin
const rejectOrder = asyncHandler(async (req, res) => {
  const { reason } = req.body;
  const order = await Order.findById(req.params.id);

  if (!order) {
    res.status(404);
    throw new Error('Không tìm thấy đơn hàng');
  }

  if (order.status !== 'pending') {
    res.status(400);
    throw new Error('Chỉ có thể từ chối đơn hàng đang chờ xử lý');
  }

  if (!reason || reason.trim() === '') {
    res.status(400);
    throw new Error('Vui lòng nhập lý do từ chối');
  }

  order.status = 'cancelled';
  order.rejectionReason = reason;
  const updatedOrder = await order.save();

  // ROLLBACK: Hoàn lại lượt sử dụng mã giảm giá
  if (order.discount && order.discount.discountId) {
    try {
      await Discount.findOneAndUpdate(
        { _id: order.discount.discountId },
        {
          $inc: { usedCount: -1 },
          $pull: { usedBy: { orderId: order._id } }
        }
      );
      console.log(`[DISCOUNT ROLLBACK] Refunded discount usage for rejected order ${order._id}`);
    } catch (error) {
      console.error('[DISCOUNT ROLLBACK] Failed:', error);
    }
  }

  // Tạo thông tin sản phẩm cho notification
  const productDetails = order.orderItems.map(item => {
    let detail = item.name;
    if (item.variantAttributes) {
      try {
        const attrs = item.variantAttributes instanceof Map 
          ? Object.fromEntries(item.variantAttributes) 
          : item.variantAttributes;
        
        if (attrs && typeof attrs === 'object' && Object.keys(attrs).length > 0) {
          const variantStr = Object.values(attrs).filter(v => v).join(', ');
          if (variantStr) detail += ` (${variantStr})`;
        }
      } catch (err) {
        console.log('Error formatting variant:', err);
      }
    }
    return `${detail} x${item.quantity}`;
  }).join(', ');

  // Tạo thông báo cho user
  await createNotification(order.user, {
    type: 'order_rejected',
    title: 'Đơn hàng đã bị từ chối',
    message: `Đơn hàng #${order._id.toString().slice(-8)} của bạn đã bị từ chối. Sản phẩm: ${productDetails}. Lý do: ${reason}`,
    order: order._id,
    metadata: { rejectionReason: reason }
  });

  res.json(updatedOrder);
});

// @desc    Allow user to cancel own order
// @route   PUT /api/v1/orders/:id/cancel
// @access  Private (Owner)
// @desc    Cancel order (User/Admin)
// @route   PUT /api/v1/orders/:id/cancel
// @access  Private (Owner or Admin)
const cancelOrder = asyncHandler(async (req, res) => {
  const { reason } = req.body || {};
  const order = await Order.findById(req.params.id);

  // GUARD CLAUSE: Kiểm tra tồn tại đơn hàng
  if (!order) {
    res.status(404);
    throw new Error('Không tìm thấy đơn hàng');
  }

  // GUARD CLAUSE: Kiểm tra quyền sở hữu
  const isOwner = order.user.toString() === req.user._id.toString();
  if (!isOwner && req.user.role !== 'admin') {
    res.status(403);
    throw new Error('Bạn không có quyền hủy đơn hàng này');
  }

  // GUARD CLAUSE (LOGIC NGƯỢC): Chỉ cho phép hủy khi đang ở pending hoặc processing
  const allowedStatuses = ['pending', 'processing'];
  if (!allowedStatuses.includes(order.status)) {
    res.status(400);
    throw new Error(`Không thể hủy đơn hàng ở trạng thái "${order.status}". Chỉ có thể hủy khi đơn hàng đang "Chờ xử lý" hoặc "Đang chuẩn bị".`);
  }

  const previousStatus = order.status;
  order.status = 'cancelled';
  order.cancelledBy = isOwner ? 'user' : 'admin';
  order.cancelReason = reason || (isOwner ? 'Khách hàng đã hủy đơn hàng' : 'Hệ thống đã hủy đơn hàng');
  order.cancelledAt = new Date();
  order.rejectionReason = undefined;

  // Hoàn trả stock nếu đơn hàng đã được xác nhận (processing)
  if (previousStatus === 'processing') {
    for (const item of order.orderItems) {
      if (!item.product) continue;
      const product = await Product.findById(item.product);
      if (product) {
        // Nếu có variant, hoàn trả stock của variant
        if (item.sku || item.variantAttributes) {
          let variantIndex = -1;
          
          // Tìm variant theo SKU
          if (item.sku) {
            variantIndex = product.variants.findIndex(v => v.sku === item.sku);
          } 
          // Hoặc tìm theo variantAttributes
          else if (item.variantAttributes) {
            variantIndex = product.variants.findIndex(v => {
              if (!v.attributes) return false;
              const variantAttrsObj = v.attributes.toObject ? v.attributes.toObject() : v.attributes;
              const itemAttrsObj = item.variantAttributes.toObject ? item.variantAttributes.toObject() : item.variantAttributes;
              
              return Object.keys(itemAttrsObj).every(key => 
                variantAttrsObj[key] === itemAttrsObj[key]
              );
            });
          }

          if (variantIndex >= 0) {
            product.variants[variantIndex].stock += item.quantity;
            
            // Tính lại tổng stock_quantity từ tất cả variants
            product.stock_quantity = product.variants.reduce((total, v) => total + (v.stock || 0), 0);
          }
        } 
        // Nếu không có variant, hoàn trả stock_quantity của sản phẩm cha
        else {
          product.stock_quantity += item.quantity;
        }
        
        await product.save();
      }
    }
  }

  const updatedOrder = await order.save();

  // ROLLBACK: Hoàn lại lượt sử dụng mã giảm giá
  if (order.discount && order.discount.discountId) {
    try {
      await Discount.findOneAndUpdate(
        { _id: order.discount.discountId },
        {
          $inc: { usedCount: -1 },
          $pull: { usedBy: { orderId: order._id } }
        }
      );
      console.log(`[DISCOUNT ROLLBACK] Refunded discount usage for order ${order._id}`);
    } catch (error) {
      console.error('[DISCOUNT ROLLBACK] Failed:', error);
    }
  }

  await createNotification(order.user, {
    type: 'order_cancelled',
    title: 'Đơn hàng đã được hủy',
    message: `Đơn hàng #${order._id.toString().slice(-8)} đã được hủy. ${order.cancelReason}`,
    order: order._id,
    metadata: { cancelReason: order.cancelReason }
  });

  res.json(updatedOrder);
});

// @desc    Assign delivery person to order (Admin)
// @route   PUT /api/v1/orders/:id/assign-delivery
// @access  Private/Admin
const assignDeliveryPerson = asyncHandler(async (req, res) => {
  const { name, phone, vehicleNumber } = req.body;
  const order = await Order.findById(req.params.id);

  if (!order) {
    res.status(404);
    throw new Error('Không tìm thấy đơn hàng');
  }

  if (order.status !== 'processing' && order.status !== 'shipping' && order.status !== 'delivered') {
    res.status(400);
    throw new Error('Chỉ có thể phân công người giao hàng cho đơn đã xác nhận, đang giao hoặc đã giao');
  }

  if (!name || !phone) {
    res.status(400);
    throw new Error('Vui lòng nhập tên và số điện thoại người giao hàng');
  }

  order.deliveryPerson = {
    name: name.trim(),
    phone: phone.trim(),
    vehicleNumber: vehicleNumber?.trim() || '',
    assignedAt: new Date()
  };

  // Tự động chuyển sang trạng thái shipping nếu đang processing
  // Nếu đang delivered thì giữ nguyên delivered
  if (order.status === 'processing') {
    order.status = 'shipping';
  } else if (order.status === 'delivered') {
    // Đánh dấu đơn hàng đã được giao
    order.isDelivered = true;
    order.deliveredAt = order.deliveredAt || new Date();
  }

  const updatedOrder = await order.save();

  // Tạo thông báo cho user
  const productDetails = order.orderItems.map(item => {
    let detail = item.name;
    if (item.variantAttributes) {
      try {
        const attrs = item.variantAttributes instanceof Map 
          ? Object.fromEntries(item.variantAttributes) 
          : item.variantAttributes;
        if (attrs && typeof attrs === 'object' && Object.keys(attrs).length > 0) {
          const variantStr = Object.values(attrs).filter(v => v).join(', ');
          if (variantStr) detail += ` (${variantStr})`;
        }
      } catch (err) {
        console.log('Error formatting variant:', err);
      }
    }
    return `${detail} x${item.quantity}`;
  }).join(', ');

  await createNotification(order.user, {
    type: 'order_shipped',
    title: 'Đơn hàng đang được giao',
    message: `Đơn hàng #${order._id.toString().slice(-8)} đang được giao bởi ${name} - SĐT: ${phone}. Sản phẩm: ${productDetails}`,
    order: order._id
  });

  res.json(updatedOrder);
});

// @desc    Request refund for cancelled/paid order
// @route   PUT /api/v1/orders/:id/refund
// @access  Private (Owner)
const requestRefund = asyncHandler(async (req, res) => {
  const { bankName, accountNumber, accountName } = req.body;
  const order = await Order.findById(req.params.id);

  if (!order) {
    res.status(404);
    throw new Error('Không tìm thấy đơn hàng');
  }

  // Check if user owns this order
  if (order.user.toString() !== req.user._id.toString()) {
    res.status(403);
    throw new Error('Bạn không có quyền yêu cầu hoàn tiền cho đơn hàng này');
  }

  // Check if order is paid
  if (!order.isPaid) {
    res.status(400);
    throw new Error('Đơn hàng chưa thanh toán, không thể yêu cầu hoàn tiền');
  }

  // Check if order is in valid status for refund
  if (!['processing', 'cancelled'].includes(order.status)) {
    res.status(400);
    throw new Error('Chỉ có thể yêu cầu hoàn tiền cho đơn hàng đang xử lý hoặc đã hủy');
  }

  // Validate refund info
  if (!bankName || !accountNumber || !accountName) {
    res.status(400);
    throw new Error('Vui lòng cung cấp đầy đủ thông tin tài khoản nhận hoàn tiền');
  }

  // Set refund info and update status
  order.refundInfo = {
    bankName,
    accountNumber,
    accountName,
    requestedAt: new Date(),
    status: 'pending'
  };

  // If order was processing, change to refund_pending and cancelled
  if (order.status === 'processing') {
    order.status = 'cancelled';
    order.cancelledBy = 'user';
    order.cancelReason = 'Khách hàng yêu cầu hủy và hoàn tiền';
    order.cancelledAt = new Date();

    // Restore stock
    for (const item of order.orderItems) {
      if (!item.product) continue;
      const product = await Product.findById(item.product);
      if (product) {
        // Restore variant stock
        if (item.sku || item.variantAttributes) {
          let variantIndex = -1;
          
          if (item.sku) {
            variantIndex = product.variants.findIndex(v => v.sku === item.sku);
          } else if (item.variantAttributes) {
            variantIndex = product.variants.findIndex(v => {
              if (!v.attributes) return false;
              const vAttrs = v.attributes instanceof Map ? Object.fromEntries(v.attributes) : v.attributes;
              const itemAttrs = item.variantAttributes instanceof Map ? Object.fromEntries(item.variantAttributes) : item.variantAttributes;
              return JSON.stringify(vAttrs) === JSON.stringify(itemAttrs);
            });
          }

          if (variantIndex >= 0) {
            product.variants[variantIndex].stock += item.quantity;
            await product.save();
            console.log(`[REFUND] Restored ${item.quantity} to variant stock:`, product.variants[variantIndex].sku);
          }
        } else {
          // Restore main product stock
          product.stock_quantity += item.quantity;
          await product.save();
          console.log(`[REFUND] Restored ${item.quantity} to product stock:`, product.name);
        }
      }
    }
  }

  const updatedOrder = await order.save();

  // Create notification for admin
  await createNotification({
    user: req.user._id,
    type: 'refund_request',
    title: 'Yêu cầu hoàn tiền',
    message: `Đơn hàng ${updatedOrder.formattedOrderNumber || '#' + updatedOrder._id.slice(-8)} yêu cầu hoàn tiền`,
    order: updatedOrder._id
  });

  res.json({
    success: true,
    message: 'Đã gửi yêu cầu hoàn tiền. Chúng tôi sẽ xử lý trong vòng 24-48 giờ.',
    order: updatedOrder
  });
});

export { 
  addOrderItems, 
  getOrderById, 
  getMyOrders, 
  getAllOrders,
  updateOrderStatus,
  confirmOrder,
  rejectOrder,
  cancelOrder,
  assignDeliveryPerson,
  requestRefund
};
