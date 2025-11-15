import Notification from '../Models/NotificationModel.js';
import { io, connectedUsers } from '../server.js';

// Get user notifications
const getUserNotifications = async (req, res) => {
  try {
    const notifications = await Notification.find({ user: req.user._id })
      .populate('order', 'orderNumber totalPrice status')
      .sort({ createdAt: -1 })
      .limit(50);

    res.json(notifications);
  } catch (error) {
    console.error('Error fetching notifications:', error);
    res.status(500).json({ message: 'Lỗi khi tải thông báo', error: error.message });
  }
};

// Get unread count
const getUnreadCount = async (req, res) => {
  try {
    const count = await Notification.countDocuments({
      user: req.user._id,
      isRead: false
    });

    res.json({ count });
  } catch (error) {
    console.error('Error counting unread notifications:', error);
    res.status(500).json({ message: 'Lỗi khi đếm thông báo', error: error.message });
  }
};

// Mark notification as read
const markAsRead = async (req, res) => {
  try {
    const { id } = req.params;

    const notification = await Notification.findOneAndUpdate(
      { _id: id, user: req.user._id },
      { isRead: true },
      { new: true }
    );

    if (!notification) {
      return res.status(404).json({ message: 'Không tìm thấy thông báo' });
    }

    res.json(notification);
  } catch (error) {
    console.error('Error marking notification as read:', error);
    res.status(500).json({ message: 'Lỗi khi cập nhật thông báo', error: error.message });
  }
};

// Mark all as read
const markAllAsRead = async (req, res) => {
  try {
    await Notification.updateMany(
      { user: req.user._id, isRead: false },
      { isRead: true }
    );

    res.json({ message: 'Đã đánh dấu tất cả thông báo là đã đọc' });
  } catch (error) {
    console.error('Error marking all notifications as read:', error);
    res.status(500).json({ message: 'Lỗi khi cập nhật thông báo', error: error.message });
  }
};

// Delete notification
const deleteNotification = async (req, res) => {
  try {
    const { id } = req.params;

    const notification = await Notification.findOneAndDelete({
      _id: id,
      user: req.user._id
    });

    if (!notification) {
      return res.status(404).json({ message: 'Không tìm thấy thông báo' });
    }

    res.json({ message: 'Đã xóa thông báo' });
  } catch (error) {
    console.error('Error deleting notification:', error);
    res.status(500).json({ message: 'Lỗi khi xóa thông báo', error: error.message });
  }
};

// Create notification (internal use)
const createNotification = async (userId, data) => {
  try {
    const notification = await Notification.create({
      user: userId,
      ...data
    });

    // Emit real-time notification via Socket.io
    const socketId = connectedUsers.get(userId.toString());
    if (socketId) {
      io.to(socketId).emit('new_notification', {
        _id: notification._id,
        type: notification.type,
        title: notification.title,
        message: notification.message,
        order: notification.order,
        isRead: notification.isRead,
        createdAt: notification.createdAt
      });
      console.log(`[SOCKET] Sent notification to user ${userId}`);
    }

    return notification;
  } catch (error) {
    console.error('Error creating notification:', error);
    throw error;
  }
};

export {
  getUserNotifications,
  getUnreadCount,
  markAsRead,
  markAllAsRead,
  deleteNotification,
  createNotification
};
