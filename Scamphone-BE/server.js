import express from 'express';
import dotenv from 'dotenv';
import mongoose from 'mongoose';
import cors from 'cors';
import bcrypt from 'bcryptjs';
import http from 'http';
import { Server } from 'socket.io';
import User from './Models/UserModel.js';
import userRoutes from './Routes/userRoutes.js';
import productRoutes from './Routes/productRoutes.js';
import categoryRoutes from './Routes/categoryRoutes.js';
import orderRoutes from './Routes/orderRoutes.js';
import adminRoutes from './Routes/adminRoutes.js';
import passwordResetRoutes from './Routes/passwordResetRoutes.js';
import discountRoutes from './Routes/discountRoutes.js';
import notificationRoutes from './Routes/notificationRoutes.js';
import reviewRoutes from './Routes/reviewRoutes.js';
import { notFound, errorHandler } from './Middleware/errorMiddleware.js';

dotenv.config();

const app = express();
const httpServer = http.createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: process.env.CLIENT_URL || 'http://localhost:5173',
    methods: ['GET', 'POST'],
    credentials: true
  }
});

// Store connected users: { userId: socketId }
export const connectedUsers = new Map();

// Socket.io connection handling
io.on('connection', (socket) => {
  console.log(`[SOCKET] User connected: ${socket.id}`);

  // When user logs in, they send their userId
  socket.on('user_connected', (userId) => {
    if (userId) {
      connectedUsers.set(userId, socket.id);
      console.log(`[SOCKET] User ${userId} mapped to socket ${socket.id}`);
    }
  });

  socket.on('disconnect', () => {
    // Remove user from connected users
    for (const [userId, socketId] of connectedUsers.entries()) {
      if (socketId === socket.id) {
        connectedUsers.delete(userId);
        console.log(`[SOCKET] User ${userId} disconnected`);
        break;
      }
    }
  });
});

// Export io for use in controllers
export { io };

// Middleware
app.use(cors());
app.use(express.json()); // Cho phép server nhận dữ liệu JSON

// Kết nối MongoDB
mongoose.connect(process.env.MONGO_URI)
    .then(() => console.log('MongoDB Connected'))
    .catch(err => console.error(err));

// Định nghĩa các Routes chính
app.get('/', (req, res) => {
  res.send('API is running...');
});

// Direct password set endpoint
app.post('/api/v1/dev/set-password', async (req, res) => {
  try {
    const { email, newPassword } = req.body;
    const emailLower = String(email || '').trim().toLowerCase();
    const pass = String(newPassword || '').trim();
    
    if (!emailLower || pass.length < 6) {
      return res.status(400).json({ error: 'Invalid email or password length' });
    }
    
    const user = await User.findOne({ email: emailLower });
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(pass, salt);
    await user.save();
    
    res.json({ success: true, message: 'Password updated', email: user.email });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Debug middleware - Log all requests
app.use((req, res, next) => {
  console.log(`[REQUEST] ${req.method} ${req.path}`);
  next();
});

app.use('/api/v1/users', userRoutes);
app.use('/api/v1/products', productRoutes);
app.use('/api/v1/categories', categoryRoutes);
app.use('/api/v1/orders', orderRoutes);
app.use('/api/v1/admin', adminRoutes);
app.use('/api/v1/password', passwordResetRoutes);
app.use('/api/v1/discounts', discountRoutes);
app.use('/api/v1/notifications', notificationRoutes);
app.use('/api/v1/reviews', reviewRoutes);

// Middleware xử lý lỗi
app.use(notFound);
app.use(errorHandler);

const PORT = process.env.PORT || 5000;
httpServer.listen(PORT, () => console.log(`Server running in ${process.env.NODE_ENV} mode on port ${PORT}`));