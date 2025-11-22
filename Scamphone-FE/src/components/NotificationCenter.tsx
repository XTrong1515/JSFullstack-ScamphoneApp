import { useState, useEffect } from "react";
import { Bell, X, Check, Package, CheckCircle, XCircle, Trash2, Gift } from "lucide-react";
import { Card } from "./ui/card";
import { Button } from "./ui/button";
import { notificationService } from "../services/notificationService";

interface Notification {
  _id: string;
  type: 'order_confirmed' | 'order_rejected' | 'order_shipped' | 'order_delivered' | 'system' | 'promotion';
  title: string;
  message: string;
  order?: string;
  isRead: boolean;
  createdAt: string;
  metadata?: any;
}

const notificationIcons = {
  order_confirmed: { icon: CheckCircle, color: "text-green-600 bg-green-100" },
  order_rejected: { icon: XCircle, color: "text-red-600 bg-red-100" },
  order_shipped: { icon: Package, color: "text-blue-600 bg-blue-100" },
  order_delivered: { icon: CheckCircle, color: "text-green-600 bg-green-100" },
  system: { icon: Bell, color: "text-gray-600 bg-gray-100" },
  promotion: { icon: Gift, color: "text-purple-600 bg-purple-100" }
};

export function NotificationCenter({ onClose }: { onClose?: () => void }) {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [unreadCount, setUnreadCount] = useState(0);

  // Inject custom scrollbar CSS
  useEffect(() => {
    const style = document.createElement('style');
    style.textContent = `
      .notification-scrollbar::-webkit-scrollbar {
        width: 8px;
      }
      .notification-scrollbar::-webkit-scrollbar-track {
        background: #f1f1f1;
        border-radius: 10px;
      }
      .notification-scrollbar::-webkit-scrollbar-thumb {
        background: #cbd5e0;
        border-radius: 10px;
      }
      .notification-scrollbar::-webkit-scrollbar-thumb:hover {
        background: #a0aec0;
      }
      .notification-scrollbar {
        scrollbar-width: thin;
        scrollbar-color: #cbd5e0 #f1f1f1;
      }
    `;
    document.head.appendChild(style);
    return () => {
      document.head.removeChild(style);
    };
  }, []);

  useEffect(() => {
    loadNotifications();
    loadUnreadCount();
  }, []);

  // Khóa cuộn body khi mở notification center
  useEffect(() => {
    // Khóa cuộn body khi mở
    document.body.style.overflow = 'hidden';
    
    // Mở lại cuộn khi đóng (cleanup function)
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, []);

  const loadNotifications = async () => {
    try {
      setLoading(true);
      const data = await notificationService.getUserNotifications();
      setNotifications(data);
    } catch (error) {
      console.error('Error loading notifications:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadUnreadCount = async () => {
    try {
      const count = await notificationService.getUnreadCount();
      setUnreadCount(count);
    } catch (error) {
      console.error('Error loading unread count:', error);
    }
  };

  const handleMarkAsRead = async (id: string) => {
    try {
      await notificationService.markAsRead(id);
      setNotifications(prev =>
        prev.map(n => n._id === id ? { ...n, isRead: true } : n)
      );
      loadUnreadCount();
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await notificationService.markAllAsRead();
      setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
      setUnreadCount(0);
    } catch (error) {
      console.error('Error marking all as read:', error);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Bạn có chắc chắn muốn xóa thông báo này?')) return;
    
    try {
      await notificationService.deleteNotification(id);
      setNotifications(prev => prev.filter(n => n._id !== id));
      loadUnreadCount();
    } catch (error) {
      console.error('Error deleting notification:', error);
    }
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Vừa xong';
    if (diffMins < 60) return `${diffMins} phút trước`;
    if (diffHours < 24) return `${diffHours} giờ trước`;
    if (diffDays < 7) return `${diffDays} ngày trước`;
    
    return date.toLocaleDateString('vi-VN');
  };

  return (
    <>
      {/* Overlay trong suốt để đóng khi click ra ngoài */}
      <div className="fixed inset-0 z-40 bg-transparent" onClick={onClose} />

      {/* Panel thông báo chính - Facebook style */}
      <Card className="fixed top-16 right-4 z-50 w-[360px] shadow-2xl border-none rounded-xl bg-white animate-in slide-in-from-top-2 duration-200 flex flex-col">
        {/* Header "Thông báo" */}
        <div className="p-3 pb-2 border-b border-gray-200 flex-shrink-0">
          <div className="flex items-center justify-between mb-1">
            <h2 className="text-lg font-bold text-gray-900">Thông báo</h2>
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              className="h-7 w-7 p-0 hover:bg-gray-100 rounded-full"
            >
              <X className="w-4 h-4 text-gray-600" />
            </Button>
          </div>
          {unreadCount > 0 && (
            <button
              onClick={handleMarkAllAsRead}
              className="text-xs text-blue-600 hover:text-blue-700 font-medium"
            >
              Đánh dấu tất cả là đã đọc
            </button>
          )}
        </div>

        {/* Notifications List - Chiều cao cố định để scroll */}
        <div className="overflow-y-auto overflow-x-hidden max-h-[400px] notification-scrollbar">
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <div className="text-center">
                <div className="w-8 h-8 border-3 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
                <p className="text-xs text-gray-600">Đang tải...</p>
              </div>
            </div>
          ) : notifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8">
              <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mb-2">
                <Bell className="w-6 h-6 text-gray-400" />
              </div>
              <p className="text-xs text-gray-600 text-center font-medium">
                Bạn chưa có thông báo nào
              </p>
            </div>
          ) : (
            <div>
              {notifications.map((notification) => {
                const config = notificationIcons[notification.type];
                const Icon = config.icon;

                return (
                  <div
                    key={notification._id}
                    className={`p-2 flex items-start gap-2 cursor-pointer transition-colors hover:bg-gray-100 ${
                      !notification.isRead ? 'bg-blue-50' : ''
                    }`}
                  >
                    {/* Avatar/Icon bên trái */}
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${config.color}`}>
                      <Icon className="w-5 h-5" />
                    </div>

                    {/* Nội dung */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-1">
                        <div className="flex-1">
                          <h3 className="text-xs font-semibold text-gray-900 mb-0.5">
                            {notification.title}
                          </h3>
                          <p className="text-xs text-gray-600 line-clamp-2 mb-0.5">
                            {notification.message}
                          </p>
                          <p className="text-[10px] text-blue-600 font-medium">
                            {formatTime(notification.createdAt)}
                          </p>
                        </div>
                        
                        {/* Chấm xanh cho thông báo chưa đọc */}
                        {!notification.isRead && (
                          <div className="w-2 h-2 bg-blue-600 rounded-full flex-shrink-0 mt-0.5"></div>
                        )}
                      </div>

                      {/* Actions */}
                      <div className="flex items-center gap-1.5 mt-1">
                        {!notification.isRead && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleMarkAsRead(notification._id);
                            }}
                            className="text-[10px] text-blue-600 hover:text-blue-700 font-medium"
                          >
                            Đánh dấu đã đọc
                          </button>
                        )}
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDelete(notification._id);
                          }}
                          className="text-[10px] text-red-600 hover:text-red-700 font-medium"
                        >
                          Xóa
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        {notifications.length > 0 && (
          <div className="p-2 border-t border-gray-200 bg-gray-50 flex-shrink-0">
            <p className="text-[10px] text-gray-500 text-center">
              {notifications.length} thông báo
            </p>
          </div>
        )}
      </Card>
    </>
  );
}

// Component for notification badge in header
export function NotificationBadge({ onClick }: { onClick: () => void }) {
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    loadUnreadCount();
    
    // Poll every 30 seconds
    const interval = setInterval(loadUnreadCount, 30000);
    return () => clearInterval(interval);
  }, []);

  const loadUnreadCount = async () => {
    try {
      const count = await notificationService.getUnreadCount();
      setUnreadCount(count);
    } catch (error) {
      // Silent fail
    }
  };

  return (
    <button
      onClick={onClick}
      className="relative p-2 hover:bg-gray-100 rounded-full transition-colors"
    >
      <Bell className="w-6 h-6 text-gray-600" />
      {unreadCount > 0 && (
        <span className="absolute top-0 right-0 w-5 h-5 bg-red-500 text-white text-xs font-bold rounded-full flex items-center justify-center">
          {unreadCount > 9 ? '9+' : unreadCount}
        </span>
      )}
    </button>
  );
}
