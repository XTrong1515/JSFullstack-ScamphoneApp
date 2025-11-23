import { useState, useEffect } from "react";
import { Search, UserPlus, Edit, Lock, Mail, Shield, Loader2 } from "lucide-react";
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
  status?: "active" | "inactive" | "blocked";
  createdAt: string;
  lastLogin?: string;
}

const roleConfig = {
  admin: { label: "Quản trị viên", color: "bg-purple-100 text-purple-700" },
  user: { label: "Khách hàng", color: "bg-blue-100 text-blue-700" },
};

const statusConfig = {
  active: { label: "Hoạt động", color: "bg-green-100 text-green-700" },
  inactive: { label: "Không hoạt động", color: "bg-gray-100 text-gray-700" },
  blocked: { label: "Bị khóa", color: "bg-red-100 text-red-700" },
};

export function UserManagement() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [page, setPage] = useState(1);

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
  const activeUsers = users.filter((u) => u.status === "active").length;

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
        <Button className="bg-gradient-to-r from-blue-600 to-purple-600">
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
          <p className="text-sm text-gray-600">Người dùng hoạt động</p>
          <p className="text-3xl font-bold mt-2">{activeUsers}</p>
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
                <th className="text-left py-3 px-4">Thao tác</th>
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
                    <Badge className={statusConfig[user.status || 'active'].color}>
                      {statusConfig[user.status || 'active'].label}
                    </Badge>
                  </td>
                  <td className="py-3 px-4 text-sm text-gray-500">
                    {new Date(user.createdAt).toLocaleDateString('vi-VN')}
                  </td>
                  <td className="py-3 px-4">
                    <div className="flex gap-2">
                      {user.role === 'user' && (
                        <Button 
                          variant="outline" 
                          size="sm" 
                          title="Thăng cấp lên Admin"
                          onClick={() => handlePromoteToAdmin(user._id)}
                        >
                          <Shield className="w-4 h-4 text-purple-600" />
                        </Button>
                      )}
                      <Button variant="outline" size="sm" title="Chỉnh sửa">
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button 
                        variant="outline" 
                        size="sm" 
                        title="Xóa người dùng"
                        onClick={() => handleDeleteUser(user._id)}
                      >
                        <Lock className="w-4 h-4 text-red-600" />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
