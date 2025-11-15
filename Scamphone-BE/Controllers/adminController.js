import asyncHandler from 'express-async-handler';
import User from '../Models/UserModel.js';
import Product from '../Models/ProductModel.js';
import Order from '../Models/OrderModel.js';
import slugify from 'slugify';

// ------- Users -------
// @desc    Get all users (admin)
// @route   GET /api/v1/admin/users
// @access  Private/Admin
const getUsers = asyncHandler(async (req, res) => {
  const pageSize = Number(req.query.limit) || 20;
  const page = Number(req.query.page) || 1;
  const keyword = req.query.keyword
    ? {
        $or: [
          { name: { $regex: req.query.keyword, $options: 'i' } },
          { email: { $regex: req.query.keyword, $options: 'i' } },
        ],
      }
    : {};

  const count = await User.countDocuments({ ...keyword });
  const users = await User.find({ ...keyword })
    .select('-password')
    .skip(pageSize * (page - 1))
    .limit(pageSize)
    .sort({ createdAt: -1 });

  res.json({ users, page, pages: Math.ceil(count / pageSize), total: count });
});

// @desc    Get user by id (admin)
// @route   GET /api/v1/admin/users/:id
// @access  Private/Admin
const getUserByIdAdmin = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id).select('-password');
  if (user) {
    res.json(user);
  } else {
    res.status(404);
    throw new Error('User not found');
  }
});

// @desc    Update user (admin)
// @route   PUT /api/v1/admin/users/:id
// @access  Private/Admin
const updateUser = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id);
  if (!user) {
    res.status(404);
    throw new Error('User not found');
  }

  const { name, email, role, phone, address } = req.body;

  // Prevent changing to an email that's already used by someone else
  if (email && email !== user.email) {
    const emailTaken = await User.findOne({ email });
    if (emailTaken && emailTaken._id.toString() !== user._id.toString()) {
      res.status(400);
      throw new Error('Email already in use by another user');
    }
  }

  user.name = name ?? user.name;
  user.email = email ?? user.email;
  user.role = role ?? user.role;
  user.phone = phone ?? user.phone;
  user.address = address ?? user.address;

  const updated = await user.save();
  res.json({ _id: updated._id, name: updated.name, email: updated.email, role: updated.role });
});

// @desc    Promote user to admin
// @route   PUT /api/v1/admin/users/:id/promote
// @access  Private/Admin
const promoteToAdmin = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id);
  if (!user) {
    res.status(404);
    throw new Error('User not found');
  }

  if (user.role === 'admin') {
    res.status(400);
    throw new Error('User is already an admin');
  }

  user.role = 'admin';
  const updated = await user.save();
  
  res.json({
    message: `${updated.name} has been promoted to admin`,
    user: {
      _id: updated._id,
      name: updated.name,
      email: updated.email,
      role: updated.role
    }
  });
});

// @desc    Delete user (admin)
// @route   DELETE /api/v1/admin/users/:id
// @access  Private/Admin
const deleteUser = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id);
  if (!user) {
    res.status(404);
    throw new Error('User not found');
  }

  await user.remove();
  res.json({ message: 'User removed' });
});

// ------- Products -------
// @desc    Get products for admin (with pagination + search)
// @route   GET /api/v1/admin/products
// @access  Private/Admin
const getProductsAdmin = asyncHandler(async (req, res) => {
  const pageSize = Number(req.query.limit) || 20;
  const page = Number(req.query.page) || 1;
  const keyword = req.query.keyword
    ? { name: { $regex: req.query.keyword, $options: 'i' } }
    : {};

  const count = await Product.countDocuments({ ...keyword });
  const products = await Product.find({ ...keyword })
    .populate('category', 'name')
    .skip(pageSize * (page - 1))
    .limit(pageSize)
    .sort({ createdAt: -1 });

  res.json({ products, page, pages: Math.ceil(count / pageSize), total: count });
});

// @desc    Update product (admin)
// @route   PUT /api/v1/admin/products/:id
// @access  Private/Admin
const updateProductAdmin = asyncHandler(async (req, res) => {
  const product = await Product.findById(req.params.id);
  if (!product) {
    res.status(404);
    throw new Error('Product not found');
  }

  const { name, price, description, category, stock_quantity, slug } = req.body;

  if (name) {
    product.name = name;
    // update slug if name changed and no explicit slug provided
    product.slug = slug ?? slugify(name, { lower: true });
  }
  if (price !== undefined) product.price = price;
  if (description !== undefined) product.description = description;
  if (category !== undefined) product.category = category;
  if (stock_quantity !== undefined) product.stock_quantity = stock_quantity;
  if (slug) product.slug = slug;

  const updated = await product.save();
  res.json(updated);
});

// @desc    Delete product (admin)
// @route   DELETE /api/v1/admin/products/:id
// @access  Private/Admin
const deleteProductAdmin = asyncHandler(async (req, res) => {
  const product = await Product.findById(req.params.id);
  if (!product) {
    res.status(404);
    throw new Error('Product not found');
  }

  await product.remove();
  res.json({ message: 'Product removed' });
});

// ------- Orders -------
// @desc    Get all orders (admin)
// @route   GET /api/v1/admin/orders
// @access  Private/Admin
const getOrdersAdmin = asyncHandler(async (req, res) => {
  const pageSize = Number(req.query.limit) || 20;
  const page = Number(req.query.page) || 1;

  const count = await Order.countDocuments({});
  const orders = await Order.find({})
    .populate('user', 'name email')
    .populate('orderItems.product', 'name price')
    .skip(pageSize * (page - 1))
    .limit(pageSize)
    .sort({ createdAt: -1 });

  res.json({ orders, page, pages: Math.ceil(count / pageSize), total: count });
});

// @desc    Get single order (admin)
// @route   GET /api/v1/admin/orders/:id
// @access  Private/Admin
const getOrderByIdAdmin = asyncHandler(async (req, res) => {
  const order = await Order.findById(req.params.id)
    .populate('user', 'name email')
    .populate('orderItems.product', 'name price');

  if (!order) {
    res.status(404);
    throw new Error('Order not found');
  }

  res.json(order);
});

// @desc    Update order status (admin)
// @route   PUT /api/v1/admin/orders/:id
// @access  Private/Admin
const updateOrderStatusAdmin = asyncHandler(async (req, res) => {
  const { status } = req.body;
  const order = await Order.findById(req.params.id);
  if (!order) {
    res.status(404);
    throw new Error('Order not found');
  }

  // Basic validation of status
  const allowed = [
    'pending',
    'confirmed',
    'shipping',
    'completed',
    'cancelled',
    'refunded',
  ];
  if (!allowed.includes(status)) {
    res.status(400);
    throw new Error('Invalid status');
  }

  // If cancelling or refunding, restock items
  if ((status === 'cancelled' || status === 'refunded') && order.status !== status) {
    for (const item of order.items) {
      const product = await Product.findById(item.product);
      if (product) {
        product.stock_quantity += item.quantity;
        await product.save();
      }
    }
  }

  order.status = status;
  const updated = await order.save();
  res.json(updated);
});

// @desc    Delete order (admin)
// @route   DELETE /api/v1/admin/orders/:id
// @access  Private/Admin
const deleteOrderAdmin = asyncHandler(async (req, res) => {
  const order = await Order.findById(req.params.id);
  if (!order) {
    res.status(404);
    throw new Error('Order not found');
  }

  // When deleting an order that isn't cancelled/refunded, restock items
  if (!['cancelled', 'refunded'].includes(order.status)) {
    for (const item of order.items) {
      const product = await Product.findById(item.product);
      if (product) {
        product.stock_quantity += item.quantity;
        await product.save();
      }
    }
  }

  await order.remove();
  res.json({ message: 'Order removed' });
});

// ------- Dashboard Stats -------
// @desc    Get dashboard statistics (admin)
// @route   GET /api/v1/admin/stats
// @access  Private/Admin
const getDashboardStats = asyncHandler(async (req, res) => {
  // 1. Tổng doanh thu từ các đơn hàng đã delivered
  const revenueResult = await Order.aggregate([
    { $match: { status: 'delivered' } },
    { $group: { _id: null, total: { $sum: '$totalPrice' } } }
  ]);
  const totalRevenue = revenueResult.length > 0 ? revenueResult[0].total : 0;

  // 2. Tổng số đơn hàng
  const totalOrders = await Order.countDocuments({});

  // 3. Tổng số sản phẩm
  const totalProducts = await Product.countDocuments({});

  // 4. Tổng số người dùng
  const totalUsers = await User.countDocuments({});

  // 5. Doanh thu theo 6 tháng gần nhất
  const sixMonthsAgo = new Date();
  sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

  const monthlyRevenueData = await Order.aggregate([
    {
      $match: {
        status: 'delivered',
        deliveredAt: { $gte: sixMonthsAgo }
      }
    },
    {
      $group: {
        _id: {
          year: { $year: '$deliveredAt' },
          month: { $month: '$deliveredAt' }
        },
        revenue: { $sum: '$totalPrice' }
      }
    },
    { $sort: { '_id.year': 1, '_id.month': 1 } }
  ]);

  // Format dữ liệu doanh thu theo tháng
  const monthlyRevenue = monthlyRevenueData.map(item => ({
    month: `T${item._id.month}/${item._id.year}`,
    revenue: item.revenue
  }));

  // 6. Thống kê theo trạng thái đơn hàng
  const ordersByStatus = await Order.aggregate([
    {
      $group: {
        _id: '$status',
        count: { $sum: 1 }
      }
    }
  ]);

  // 7. Top 5 sản phẩm bán chạy
  const topProducts = await Order.aggregate([
    { $match: { status: { $in: ['processing', 'shipping', 'delivered'] } } },
    { $unwind: '$orderItems' },
    {
      $group: {
        _id: '$orderItems.product',
        totalSold: { $sum: '$orderItems.quantity' },
        revenue: { $sum: { $multiply: ['$orderItems.quantity', '$orderItems.price'] } }
      }
    },
    { $sort: { totalSold: -1 } },
    { $limit: 5 },
    {
      $lookup: {
        from: 'products',
        localField: '_id',
        foreignField: '_id',
        as: 'productInfo'
      }
    },
    { $unwind: '$productInfo' },
    {
      $project: {
        name: '$productInfo.name',
        totalSold: 1,
        revenue: 1,
        image: '$productInfo.image'
      }
    }
  ]);

  res.json({
    totalRevenue,
    totalOrders,
    totalProducts,
    totalUsers,
    monthlyRevenue,
    ordersByStatus,
    topProducts
  });
});

export {
  getUsers,
  getUserByIdAdmin,
  updateUser,
  promoteToAdmin,
  deleteUser,
  getProductsAdmin,
  updateProductAdmin,
  deleteProductAdmin,
  getOrdersAdmin,
  getOrderByIdAdmin,
  updateOrderStatusAdmin,
  deleteOrderAdmin,
  getDashboardStats,
};
