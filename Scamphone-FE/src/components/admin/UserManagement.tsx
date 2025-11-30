import { useState, useEffect } from "react";
import { Search, UserPlus, Edit, Lock, Unlock, Mail, Shield, Loader2, X, Save, Trash2 } from "lucide-react";
import { Card } from "../ui/card";
import { Input } from "../ui/input";
import { Button } from "../ui/button";
import { Badge } from "../ui/badge";
import { adminService } from "../../services/adminService";

interface User {
  _id: string;
  name: string;
  email: string;
  phone?: string;
  role: "admin" | "user";
  isLocked?: boolean;
  createdAt: string;
  lastLogin?: string;
}

const roleConfig = {
  admin: { label: "Quản trị viên", color: "bg-purple-100 text-purple-700" },
  user: { label: "Khách hàng", color: "bg-blue-100 text-blue-700" },
};

export function UserManagement() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [page, setPage] = useState(1);
  const [showForm, setShowForm] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    role: "user" as "user" | "admin",
  });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    loadUsers();
  }, [page, searchTerm]);

  const loadUsers = async () => {
    try {
      setLoading(true);
      const response = await adminService.getAllUsers({
        page,
        limit: 20,
        search: searchTerm || undefined,
      });
      setUsers(response.users || []);
    } catch (error) {
      console.error('Error loading users:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenForm = (user?: User) => {
    if (user) {
      setEditingUser(user);
      setFormData({
        name: user.name,
        email: user.email,
        password: "",
        role: user.role,
      });
    } else {
      setEditingUser(null);
      setFormData({ name: "", email: "", password: "", role: "user" });
    }
    setShowForm(true);
  };

  const handleCloseForm = () => {
    setShowForm(false);
    setEditingUser(null);
    setFormData({ name: "", email: "", password: "", role: "user" });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim() || !formData.email.trim()) {
      alert("Vui lòng nhập tên và email!");
      return;
    }

    if (!editingUser && !formData.password.trim()) {
      alert("Vui lòng nhập mật khẩu!");
      return;
    }

    try {
      setSubmitting(true);
      if (editingUser) {
        await adminService.updateUser(editingUser._id, {
          name: formData.name,
          email: formData.email,
          role: formData.role,
        });
        alert("Cập nhật người dùng thành công!");
      } else {
        await adminService.createUser(formData);
        alert("Thêm người dùng thành công!");
      }
      handleCloseForm();
      loadUsers();
    } catch (error: any) {
      console.error("Error saving user:", error);
      alert(error.response?.data?.message || "Có lỗi xảy ra!");
    } finally {
      setSubmitting(false);
    }
  };

  const handleToggleLock = async (user: User) => {
    const action = user.isLocked ? "mở khóa" : "khóa";
    if (!confirm(`Bạn có chắc chắn muốn ${action} người dùng "${user.name}"?`)) {
      return;
    }

    try {
      await adminService.toggleUserLock(user._id);
      alert(`Đã ${action} người dùng thành công!`);
      loadUsers();
    } catch (error: any) {
      console.error("Error toggling user lock:", error);
      alert(error.response?.data?.message || `Không thể ${action} người dùng!`);
    }
  };

  const handlePromoteToAdmin = async (userId: string) => {
    if (!confirm('Bạn có chắc chắn muốn thăng cấp người dùng này lên Admin?')) return;
    
    try {
      console.log('[PROMOTE] Promoting user:', userId);
      const result = await adminService.promoteToAdmin(userId);
      console.log('[PROMOTE] Success:', result);
      alert('Đã thăng cấp người dùng thành Admin!');
      loadUsers();
    } catch (error: any) {
      console.error('[PROMOTE] Error:', error);
      console.error('[PROMOTE] Response:', error?.response);
      alert(error?.response?.data?.message || 'Có lỗi xảy ra khi thăng cấp!');
    }
  };

  const handleDeleteUser = async (userId: string) => {
    if (!confirm('Bạn có chắc chắn muốn xóa người dùng này?')) return;
    
    try {
      await adminService.deleteUser(userId);
      alert('Đã xóa người dùng thành công!');
      loadUsers();
    } catch (error) {
      console.error('Error deleting user:', error);
      alert('Có lỗi xảy ra khi xóa người dùng!');
    }
  };

  const filteredUsers = users;

  const totalCustomers = users.filter((u) => u.role === "user").length;
  const lockedUsers = users.filter((u) => u.isLocked).length;

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-bold">Quản lý người dùng</h2>
        <Button 
          onClick={() => handleOpenForm()}
          className="bg-gradient-to-r from-blue-600 to-purple-600"
        >
          <UserPlus className="w-4 h-4 mr-2" />
          Thêm người dùng
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="p-6">
          <p className="text-sm text-gray-600">Tổng khách hàng</p>
          <p className="text-3xl font-bold mt-2">{totalCustomers}</p>
        </Card>
        <Card className="p-6">
          <p className="text-sm text-gray-600">Người dùng bị khóa</p>
          <p className="text-3xl font-bold mt-2 text-red-600">{lockedUsers}</p>
        </Card>
        <Card className="p-6">
          <p className="text-sm text-gray-600">Tổng người dùng</p>
          <p className="text-3xl font-bold mt-2">{users.length}</p>
        </Card>
      </div>

      {/* Search */}
      <Card className="p-6">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
          <Input
            placeholder="Tìm kiếm theo tên hoặc email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
      </Card>

      {/* Users Table */}
      <Card className="p-6">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b">
                <th className="text-left py-3 px-4">Người dùng</th>
                <th className="text-left py-3 px-4">Vai trò</th>
                <th className="text-left py-3 px-4">Trạng thái</th>
                <th className="text-left py-3 px-4">Ngày tạo</th>
                <th className="text-right py-3 px-4">Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {filteredUsers.map((user) => (
                <tr key={user._id} className="border-b hover:bg-gray-50">
                  <td className="py-3 px-4">
                    <div>
                      <div className="font-medium">{user.name}</div>
                      <div className="text-sm text-gray-500">{user.email}</div>
                      {user.phone && <div className="text-sm text-gray-500">{user.phone}</div>}
                    </div>
                  </td>
                  <td className="py-3 px-4">
                    <Badge className={roleConfig[user.role].color}>
                      {roleConfig[user.role].label}
                    </Badge>
                  </td>
                  <td className="py-3 px-4">
                    {user.isLocked ? (
                      <Badge className="bg-red-100 text-red-700">
                        <Lock className="w-3 h-3 mr-1" />
                        Đã khóa
                      </Badge>
                    ) : (
                      <Badge className="bg-green-100 text-green-700">
                        <Unlock className="w-3 h-3 mr-1" />
                        Hoạt động
                      </Badge>
                    )}
                  </td>
                  <td className="py-3 px-4 text-sm text-gray-500">
                    {new Date(user.createdAt).toLocaleDateString('vi-VN')}
                  </td>
                  <td className="py-3 px-4">
                    <div className="flex gap-2 justify-end">
                      <Button 
                        variant="outline" 
                        size="sm" 
                        title="Chỉnh sửa"
                        onClick={() => handleOpenForm(user)}
                        className="hover:bg-blue-50 hover:text-blue-600"
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button 
                        variant="outline" 
                        size="sm" 
                        title={user.isLocked ? "Mở khóa" : "Khóa tài khoản"}
                        onClick={() => handleToggleLock(user)}
                        className={user.isLocked ? "hover:bg-green-50 hover:text-green-600" : "hover:bg-orange-50 hover:text-orange-600"}
                      >
                        {user.isLocked ? <Unlock className="w-4 h-4" /> : <Lock className="w-4 h-4" />}
                      </Button>
                      <Button 
                        variant="outline" 
                        size="sm" 
                        title="Xóa người dùng"
                        onClick={() => handleDeleteUser(user._id)}
                        className="hover:bg-red-50 hover:text-red-600"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Form Modal */}
      {showForm && (
        <div
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
          onClick={handleCloseForm}
        >
          <div
            className="bg-white rounded-xl max-w-md w-full"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between p-6 border-b">
              <h3 className="text-xl font-bold">
                {editingUser ? "Chỉnh sửa người dùng" : "Thêm người dùng mới"}
              </h3>
              <Button
                variant="outline"
                size="sm"
                onClick={handleCloseForm}
                disabled={submitting}
              >
                <X className="w-5 h-5" />
              </Button>
            </div>

            <form onSubmit={handleSubmit} className="p-6">
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Tên <span className="text-red-500">*</span>
                  </label>
                  <Input
                    type="text"
                    value={formData.name}
                    onChange={(e) =>
                      setFormData({ ...formData, name: e.target.value })
                    }
                    placeholder="Nhập tên người dùng"
                    required
                    disabled={submitting}
                    className="w-full"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Email <span className="text-red-500">*</span>
                  </label>
                  <Input
                    type="email"
                    value={formData.email}
                    onChange={(e) =>
                      setFormData({ ...formData, email: e.target.value })
                    }
                    placeholder="Nhập email"
                    required
                    disabled={submitting}
                    className="w-full"
                  />
                </div>

                {!editingUser && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Mật khẩu <span className="text-red-500">*</span>
                    </label>
                    <Input
                      type="password"
                      value={formData.password}
                      onChange={(e) =>
                        setFormData({ ...formData, password: e.target.value })
                      }
                      placeholder="Nhập mật khẩu"
                      required
                      disabled={submitting}
                      className="w-full"
                    />
                  </div>
                )}

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Vai trò <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={formData.role}
                    onChange={(e) =>
                      setFormData({ ...formData, role: e.target.value as "user" | "admin" })
                    }
                    disabled={submitting}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="user">Khách hàng</option>
                    <option value="admin">Quản trị viên</option>
                  </select>
                </div>
              </div>

              <div className="flex gap-3 mt-6">
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleCloseForm}
                  disabled={submitting}
                  className="flex-1"
                >
                  Hủy
                </Button>
                <Button
                  type="submit"
                  disabled={submitting}
                  className="flex-1 bg-gradient-to-r from-blue-600 to-purple-600 text-white"
                >
                  {submitting ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Đang lưu...
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4 mr-2" />
                      {editingUser ? "Cập nhật" : "Thêm mới"}
                    </>
                  )}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
