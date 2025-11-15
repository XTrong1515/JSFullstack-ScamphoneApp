import { useState, useEffect } from "react";
import { User, Mail, Phone, MapPin, Edit2, Save, X, Home, ShoppingBag, Award, Calendar, Shield } from "lucide-react";
import { Card } from "../ui/card";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { userService } from "../../services/userService";

interface UserProfile {
  _id: string;
  name: string;
  email: string;
  phone?: string;
  address?: string;
  role: string;
  createdAt: string;
}

interface UserStats {
  ordersCount: number;
  points: number;
  notificationsCount: number;
}

export function ProfilePage({ onPageChange }: { onPageChange: (page: string) => void }) {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [stats, setStats] = useState<UserStats>({ ordersCount: 0, points: 0, notificationsCount: 0 });
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    phone: "",
    address: "",
  });

  useEffect(() => {
    loadProfile();
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      const data = await userService.getUserStats();
      setStats(data);
    } catch (error) {
      console.error("Error loading stats:", error);
    }
  };

  const loadProfile = async () => {
    try {
      setLoading(true);
      const data = await userService.getCurrentUser();
      setProfile(data);
      setFormData({
        name: data.name,
        phone: (data as any).phone || "",
        address: (data as any).address || "",
      });
    } catch (error) {
      console.error("Error loading profile:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      await userService.updateProfile({
        name: formData.name,
        phone: formData.phone,
        address: formData.address,
      });
      alert("Cập nhật thông tin thành công!");
      setIsEditing(false);
      loadProfile();
    } catch (error) {
      console.error("Error updating profile:", error);
      alert("Có lỗi xảy ra khi cập nhật thông tin!");
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Đang tải thông tin...</p>
        </div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-gray-600">Không tìm thấy thông tin người dùng</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50">
      {/* Header with Back Button */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <Button
            variant="outline"
            onClick={() => onPageChange('home')}
            className="flex items-center gap-2"
          >
            <Home className="w-4 h-4" />
            Về trang chủ
          </Button>
          <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            Tài khoản của tôi
          </h1>
          <div className="w-[120px]"></div> {/* Spacer for centering */}
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Profile Header Card */}
        <Card className="p-8 mb-6 bg-gradient-to-r from-blue-600 to-purple-600 text-white relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -mr-32 -mt-32"></div>
          <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/10 rounded-full -ml-24 -mb-24"></div>
          
          <div className="relative flex items-center gap-6">
            <div className="relative">
              <div className="w-32 h-32 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center border-4 border-white/30">
                <User className="w-16 h-16 text-white" />
              </div>
              {profile?.role === 'admin' && (
                <div className="absolute -bottom-2 -right-2 bg-yellow-400 rounded-full p-2">
                  <Shield className="w-5 h-5 text-yellow-900" />
                </div>
              )}
            </div>
            
            <div className="flex-1">
              <h2 className="text-3xl font-bold mb-2">{profile?.name}</h2>
              <p className="text-white/90 mb-3 flex items-center gap-2">
                <Mail className="w-4 h-4" />
                {profile?.email}
              </p>
              <div className="flex items-center gap-4">
                <span className="px-4 py-1.5 bg-white/20 backdrop-blur-sm rounded-full text-sm font-medium">
                  {profile?.role === 'admin' ? '👑 Quản trị viên' : '👤 Khách hàng'}
                </span>
                <span className="flex items-center gap-1 text-sm text-white/90">
                  <Calendar className="w-4 h-4" />
                  Tham gia: {new Date(profile?.createdAt || '').toLocaleDateString('vi-VN')}
                </span>
              </div>
            </div>

            {!isEditing && (
              <Button
                variant="outline"
                className="bg-white/10 backdrop-blur-sm text-white border-white/30 hover:bg-white/20"
                onClick={() => setIsEditing(true)}
              >
                <Edit2 className="w-4 h-4 mr-2" />
                Chỉnh sửa
              </Button>
            )}
          </div>
        </Card>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
          <Card className="p-6 hover:shadow-lg transition-shadow cursor-pointer" onClick={() => onPageChange('orders')}>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Đơn hàng</p>
                <p className="text-3xl font-bold text-blue-600">{stats.ordersCount}</p>
              </div>
              <div className="w-14 h-14 bg-blue-100 rounded-full flex items-center justify-center">
                <ShoppingBag className="w-7 h-7 text-blue-600" />
              </div>
            </div>
            <p className="text-xs text-gray-500 mt-2">Nhấn để xem chi tiết</p>
          </Card>

          <Card className="p-6 hover:shadow-lg transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Điểm tích lũy</p>
                <p className="text-3xl font-bold text-purple-600">{stats.points}</p>
              </div>
              <div className="w-14 h-14 bg-purple-100 rounded-full flex items-center justify-center">
                <Award className="w-7 h-7 text-purple-600" />
              </div>
            </div>
            <p className="text-xs text-gray-500 mt-2">Đổi quà tặng</p>
          </Card>

          <Card className="p-6 hover:shadow-lg transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Thành viên</p>
                <p className="text-2xl font-bold text-green-600">
                  {profile?.role === 'admin' ? 'VIP' : 'Bạc'}
                </p>
              </div>
              <div className="w-14 h-14 bg-green-100 rounded-full flex items-center justify-center">
                <User className="w-7 h-7 text-green-600" />
              </div>
            </div>
            <p className="text-xs text-gray-500 mt-2">Nâng cấp hạng</p>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Personal Information */}
          <Card className="p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold">Thông tin cá nhân</h3>
              {isEditing && (
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setIsEditing(false);
                      setFormData({
                        name: profile?.name || "",
                        phone: (profile as any)?.phone || "",
                        address: (profile as any)?.address || "",
                      });
                    }}
                  >
                    <X className="w-4 h-4 mr-2" />
                    Hủy
                  </Button>
                  <Button
                    size="sm"
                    className="bg-gradient-to-r from-blue-600 to-purple-600 text-white"
                    onClick={handleSave}
                  >
                    <Save className="w-4 h-4 mr-2" />
                    Lưu
                  </Button>
                </div>
              )}
            </div>

            <div className="space-y-5">
              {/* Name */}
              <div className="group">
                <label className="flex items-center text-sm font-medium text-gray-700 mb-2">
                  <User className="w-4 h-4 mr-2 text-gray-500" />
                  Họ và tên
                </label>
                {isEditing ? (
                  <Input
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="Nhập họ và tên"
                    className="border-2 focus:border-blue-500"
                  />
                ) : (
                  <p className="text-gray-900 font-medium pl-6">{profile?.name}</p>
                )}
              </div>

              {/* Email */}
              <div className="group">
                <label className="flex items-center text-sm font-medium text-gray-700 mb-2">
                  <Mail className="w-4 h-4 mr-2 text-gray-500" />
                  Email
                </label>
                <p className="text-gray-900 font-medium pl-6">{profile?.email}</p>
                <p className="text-xs text-gray-500 mt-1 pl-6">📧 Email không thể thay đổi</p>
              </div>

              {/* Phone */}
              <div className="group">
                <label className="flex items-center text-sm font-medium text-gray-700 mb-2">
                  <Phone className="w-4 h-4 mr-2 text-gray-500" />
                  Số điện thoại
                </label>
                {isEditing ? (
                  <Input
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    placeholder="Nhập số điện thoại"
                    className="border-2 focus:border-blue-500"
                  />
                ) : (
                  <p className="text-gray-900 font-medium pl-6">
                    {(profile as any)?.phone || "📱 Chưa cập nhật"}
                  </p>
                )}
              </div>

              {/* Address */}
              <div className="group">
                <label className="flex items-center text-sm font-medium text-gray-700 mb-2">
                  <MapPin className="w-4 h-4 mr-2 text-gray-500" />
                  Địa chỉ
                </label>
                {isEditing ? (
                  <Input
                    value={formData.address}
                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                    placeholder="Nhập địa chỉ"
                    className="border-2 focus:border-blue-500"
                  />
                ) : (
                  <p className="text-gray-900 font-medium pl-6">
                    {(profile as any)?.address || "📍 Chưa cập nhật"}
                  </p>
                )}
              </div>
            </div>
          </Card>

          {/* Security Settings */}
          <Card className="p-6">
            <h3 className="text-xl font-bold mb-6">Bảo mật & Cài đặt</h3>
            
            <div className="space-y-4">
              {/* Change Password */}
              <div className="p-4 bg-gradient-to-r from-orange-50 to-red-50 rounded-lg border border-orange-200">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h4 className="font-semibold text-gray-900 mb-1">Đổi mật khẩu</h4>
                    <p className="text-sm text-gray-600">
                      Cập nhật mật khẩu định kỳ để bảo vệ tài khoản
                    </p>
                  </div>
                </div>
                <Button 
                  variant="outline" 
                  className="w-full bg-white hover:bg-orange-50 border-orange-300"
                >
                  🔒 Đổi mật khẩu
                </Button>
              </div>

              {/* Notification Settings */}
              <div className="p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg border border-blue-200">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h4 className="font-semibold text-gray-900 mb-1">Thông báo</h4>
                    <p className="text-sm text-gray-600">
                      Nhận thông báo về đơn hàng và khuyến mãi
                    </p>
                  </div>
                </div>
                <Button 
                  variant="outline"
                  className="w-full bg-white hover:bg-blue-50 border-blue-300"
                >
                  🔔 Cài đặt thông báo
                </Button>
              </div>

              {/* Privacy */}
              <div className="p-4 bg-gradient-to-r from-purple-50 to-pink-50 rounded-lg border border-purple-200">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h4 className="font-semibold text-gray-900 mb-1">Quyền riêng tư</h4>
                    <p className="text-sm text-gray-600">
                      Quản lý dữ liệu cá nhân và quyền riêng tư
                    </p>
                  </div>
                </div>
                <Button 
                  variant="outline"
                  className="w-full bg-white hover:bg-purple-50 border-purple-300"
                >
                  🛡️ Cài đặt riêng tư
                </Button>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
