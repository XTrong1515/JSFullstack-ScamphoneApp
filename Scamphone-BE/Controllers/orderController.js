import asyncHandler from 'express-async-handler';
import Order from '../Models/OrderModel.js';
import Product from '../Models/ProductModel.js';
import { createNotification } from './notificationController.js';

// @desc    Create new order
// @route   POST /api/v1/orders
// @access  Private
const addOrderItems = asyncHandler(async (req, res) => {
  const { orderItems, shippingAddress, paymentMethod, totalPrice } = req.body;

  if (!orderItems || orderItems.length === 0) {
    res.status(400);
    throw new Error('Không có sản phẩm trong đơn hàng');
  }

  if (!shippingAddress || !shippingAddress.fullName || !shippingAddress.phone || !shippingAddress.address) {
    res.status(400);
    throw new Error('Thông tin địa chỉ giao hàng không đầy đủ');
  }

  const order = new Order({
    user: req.user._id,
    orderItems,
    shippingAddress,
    paymentMethod: paymentMethod || 'COD',
    totalPrice,
    status: 'pending'
  });

  const createdOrder = await order.save();
  
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
  const { status } = req.body;
  const order = await Order.findById(req.params.id);

  if (!order) {
    res.status(404);
    throw new Error('Không tìm thấy đơn hàng');
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
    if (item.variantAttributes && Object.keys(item.variantAttributes).length > 0) {
      const variantStr = Object.values(item.variantAttributes).join(', ');
      detail += ` (${variantStr})`;
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
    notificationMessage = `Đơn hàng #${order._id.toString().slice(-8)} đang trên đường giao đến bạn. Sản phẩm: ${productDetails}.`;
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

  if (!order) {
    res.status(404);
    throw new Error('Không tìm thấy đơn hàng');
  }

  if (order.status !== 'pending') {
    res.status(400);
    throw new Error('Đơn hàng đã được xử lý');
  }

  // Kiểm tra tồn kho
  for (const item of order.orderItems) {
    const product = await Product.findById(item.product);
    if (!product) {
      res.status(404);
      throw new Error(`Không tìm thấy sản phẩm: ${item.name}`);
    }

    // Nếu có thông tin variant (sku hoặc variantAttributes), kiểm tra stock của variant
    if (item.sku || item.variantAttributes) {
      let variant;
      
      // Tìm variant theo SKU (ưu tiên)
      if (item.sku) {
        variant = product.variants.find(v => v.sku === item.sku);
      } 
      // Hoặc tìm theo variantAttributes
      else if (item.variantAttributes) {
        variant = product.variants.find(v => {
          if (!v.attributes) return false;
          const variantAttrsObj = v.attributes.toObject ? v.attributes.toObject() : v.attributes;
          const itemAttrsObj = item.variantAttributes.toObject ? item.variantAttributes.toObject() : item.variantAttributes;
          
          return Object.keys(itemAttrsObj).every(key => 
            variantAttrsObj[key] === itemAttrsObj[key]
          );
        });
      }

      if (!variant) {
        res.status(404);
        throw new Error(`Không tìm thấy biến thể của sản phẩm: ${item.name}`);
      }

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
          product.variants[variantIndex].stock -= item.quantity;
          
          // Tính lại tổng stock_quantity từ tất cả variants
          product.stock_quantity = product.variants.reduce((total, v) => total + (v.stock || 0), 0);
        }
      } 
      // Nếu không có variant, trừ stock_quantity của sản phẩm cha
      else {
        product.stock_quantity -= item.quantity;
      }
      
      await product.save();
    }
  }

  order.status = 'processing';
  const updatedOrder = await order.save();

  // Tạo thông tin sản phẩm cho notification
  const productDetails = order.orderItems.map(item => {
    let detail = item.name;
    if (item.variantAttributes && Object.keys(item.variantAttributes).length > 0) {
      const variantStr = Object.values(item.variantAttributes).join(', ');
      detail += ` (${variantStr})`;
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

  // Tạo thông tin sản phẩm cho notification
  const productDetails = order.orderItems.map(item => {
    let detail = item.name;
    if (item.variantAttributes && Object.keys(item.variantAttributes).length > 0) {
      const variantStr = Object.values(item.variantAttributes).join(', ');
      detail += ` (${variantStr})`;
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
const cancelOrder = asyncHandler(async (req, res) => {
  const { reason } = req.body || {};
  const order = await Order.findById(req.params.id);

  if (!order) {
    res.status(404);
    throw new Error('Không tìm thấy đơn hàng');
  }

  const isOwner = order.user.toString() === req.user._id.toString();

  if (!isOwner && req.user.role !== 'admin') {
    res.status(403);
    throw new Error('Bạn không có quyền hủy đơn hàng này');
  }

  if (!['pending', 'processing'].includes(order.status)) {
    res.status(400);
    throw new Error('Chỉ có thể hủy đơn hàng đang chờ xử lý hoặc đang chuẩn bị');
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

  await createNotification(order.user, {
    type: 'order_cancelled',
    title: 'Đơn hàng đã được hủy',
    message: `Đơn hàng #${order._id.toString().slice(-8)} đã được hủy. ${order.cancelReason}`,
    order: order._id,
    metadata: { cancelReason: order.cancelReason }
  });

  res.json(updatedOrder);
});

export { 
  addOrderItems, 
  getOrderById, 
  getMyOrders, 
  getAllOrders,
  updateOrderStatus,
  confirmOrder,
  rejectOrder,
  cancelOrder
};
