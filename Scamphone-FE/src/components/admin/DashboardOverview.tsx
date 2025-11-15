import { useState, useEffect } from "react";
import { Card } from "../ui/card";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { TrendingUp, Package, Users, ShoppingCart, Loader2 } from "lucide-react";
import { adminService, AdminDashboardStats } from "../../services/adminService";

export function DashboardOverview() {
  const [stats, setStats] = useState<AdminDashboardStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      setLoading(true);
      const data = await adminService.getDashboardStats();
      setStats(data);
    } catch (error) {
      console.error('Error loading dashboard stats:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading || !stats) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND'
    }).format(value);
  };

  // Transform data for chart
  const chartData = stats.monthlyRevenue.map(item => ({
    month: item.month,
    revenue: item.revenue / 1000000 // Convert to millions
  }));

  return (
    <div className="space-y-6">
      <h2 className="text-3xl font-bold">Tổng quan Dashboard</h2>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Doanh thu</p>
              <p className="text-2xl font-bold mt-1">{formatCurrency(stats.totalRevenue)}</p>
              <p className="text-sm text-green-600 mt-2 flex items-center gap-1">
                <TrendingUp className="w-4 h-4" />
                Tổng doanh thu
              </p>
            </div>
            <div className="p-3 bg-blue-100 rounded-full">
              <TrendingUp className="w-8 h-8 text-blue-600" />
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Đơn hàng</p>
              <p className="text-2xl font-bold mt-1">{stats.totalOrders}</p>
              <p className="text-sm text-green-600 mt-2 flex items-center gap-1">
                <TrendingUp className="w-4 h-4" />
                Tổng đơn hàng
              </p>
            </div>
            <div className="p-3 bg-purple-100 rounded-full">
              <ShoppingCart className="w-8 h-8 text-purple-600" />
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Sản phẩm</p>
              <p className="text-2xl font-bold mt-1">{stats.totalProducts}</p>
              <p className="text-sm text-gray-600 mt-2 flex items-center gap-1">
                <Package className="w-4 h-4" />
                Tổng sản phẩm
              </p>
            </div>
            <div className="p-3 bg-green-100 rounded-full">
              <Package className="w-8 h-8 text-green-600" />
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Khách hàng</p>
              <p className="text-2xl font-bold mt-1">{stats.totalUsers}</p>
              <p className="text-sm text-gray-600 mt-2 flex items-center gap-1">
                <Users className="w-4 h-4" />
                Tổng người dùng
              </p>
            </div>
            <div className="p-3 bg-orange-100 rounded-full">
              <Users className="w-8 h-8 text-orange-600" />
            </div>
          </div>
        </Card>
      </div>

      {/* Revenue Chart */}
      <Card className="p-6">
        <h3 className="text-xl font-bold mb-4">Doanh thu 6 tháng gần nhất</h3>
        <ResponsiveContainer width="100%" height={350}>
          <BarChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="month" />
            <YAxis 
              tickFormatter={(value) => `${value}M`}
            />
            <Tooltip
              formatter={(value: number) => [`${value.toFixed(1)}M VNĐ`, 'Doanh thu']}
            />
            <Bar dataKey="revenue" fill="url(#colorRevenue)" />
            <defs>
              <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#3b82f6" />
                <stop offset="100%" stopColor="#8b5cf6" />
              </linearGradient>
            </defs>
          </BarChart>
        </ResponsiveContainer>
      </Card>

      {/* Top Products */}
      <Card className="p-6">
        <h3 className="text-xl font-bold mb-4">Top 5 sản phẩm bán chạy</h3>
        <div className="space-y-4">
          {stats.topProducts && stats.topProducts.length > 0 ? (
            stats.topProducts.map((product, index) => (
              <div key={product._id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-purple-600 rounded-full flex items-center justify-center text-white font-bold">
                    {index + 1}
                  </div>
                  {product.image && (
                    <img src={product.image} alt={product.name} className="w-12 h-12 object-cover rounded" />
                  )}
                  <div>
                    <p className="font-medium">{product.name}</p>
                    <p className="text-sm text-gray-600">Đã bán: {product.totalSold} sản phẩm</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-bold text-blue-600">{formatCurrency(product.revenue)}</p>
                </div>
              </div>
            ))
          ) : (
            <p className="text-center text-gray-500 py-8">Chưa có dữ liệu sản phẩm</p>
          )}
        </div>
      </Card>
    </div>
  );
}
