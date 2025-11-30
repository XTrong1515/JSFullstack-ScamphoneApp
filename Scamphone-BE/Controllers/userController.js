import asyncHandler from 'express-async-handler';
import User from '../Models/UserModel.js';
import jwt from 'jsonwebtoken';

// Hàm tạo token
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: '30d',
  });
};

// @desc    Register a new user
// @route   POST /api/v1/users/register
// @access  Public
const registerUser = asyncHandler(async (req, res) => {
  const { name, email, password } = req.body;
  const userExists = await User.findOne({ email });

  if (userExists) {
    res.status(400);
    throw new Error('User already exists');
  }

  const user = await User.create({ name, email, password });

  if (user) {
    res.status(201).json({
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      token: generateToken(user._id),
    });
  } else {
    res.status(400);
    throw new Error('Invalid user data');
  }
});

// @desc    Auth user & get token
// @route   POST /api/v1/users/login
// @access  Public
const authUser = asyncHandler(async (req, res) => {
  const { email, password } = req.body;
  const emailLower = String(email || '').trim().toLowerCase();
  console.log('[LOGIN] Email:', emailLower, '| Password length:', password?.length);
  const user = await User.findOne({ email: emailLower });
  console.log('[LOGIN] User found:', !!user);

  if (user) {
    // Kiểm tra tài khoản có bị khóa không
    if (user.isLocked) {
      res.status(403);
      throw new Error('Tài khoản của bạn đã bị khóa');
    }

    console.log('[LOGIN] User email from DB:', user.email);
    const match = await user.comparePassword(password);
    console.log('[LOGIN] Password match:', match);
    if (match) {
      res.json({
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        token: generateToken(user._id),
      });
    } else {
      res.status(401);
      throw new Error('Invalid email or password');
    }
  } else {
    res.status(401);
    throw new Error('Invalid email or password');
  }
});

// @desc    Get user profile
// @route   GET /api/v1/users/profile
// @access  Private
const getUserProfile = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id);
  if (user) {
    res.json({
      _id: user._id,
      name: user.name,
      email: user.email,
      phone: user.phone,
      address: user.address,
      role: user.role,
      createdAt: user.createdAt,
    });
  } else {
    res.status(404);
    throw new Error('User not found');
  }
});

// @desc    Update user profile
// @route   PUT /api/v1/users/profile
// @access  Private
const updateUserProfile = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id);

  if (user) {
    user.name = req.body.name || user.name;
    user.phone = req.body.phone !== undefined ? req.body.phone : user.phone;
    user.address = req.body.address !== undefined ? req.body.address : user.address;

    const updatedUser = await user.save();

    res.json({
      _id: updatedUser._id,
      name: updatedUser.name,
      email: updatedUser.email,
      phone: updatedUser.phone,
      address: updatedUser.address,
      role: updatedUser.role,
      createdAt: updatedUser.createdAt,
    });
  } else {
    res.status(404);
    throw new Error('User not found');
  }
});

// @desc    Get user stats (orders, points, notifications)
// @route   GET /api/v1/users/stats
// @access  Private
const getUserStats = asyncHandler(async (req, res) => {
  // Import Order model dynamically to avoid circular dependencies
  const Order = (await import('../Models/OrderModel.js')).default;
  
  // Count user's orders
  const ordersCount = await Order.countDocuments({ user: req.user._id });
  
  // Get user for points (if you add points field to User model later)
  const user = await User.findById(req.user._id);
  const points = user.loyaltyPoints || 0;
  
  // Count unread notifications (placeholder - implement when you add notifications)
  const notificationsCount = 0;
  
  res.json({
    ordersCount,
    points,
    notificationsCount
  });
});

export { registerUser, authUser, getUserProfile, updateUserProfile, getUserStats };