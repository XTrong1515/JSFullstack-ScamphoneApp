import { useState, useEffect } from "react";
import { Card } from "../ui/card";
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { TrendingUp, Loader2 } from "lucide-react";
import { adminService, AdminDashboardStats } from "../../services/adminService";

export function SalesReports() {
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
      console.error('Error loading sales reports:', error);
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
    return new Intl.NumberFormat('vi-VN').format(value);
  };

  // Transform monthly revenue data for chart
  const monthlyRevenueData = stats.monthlyRevenue.map(item => ({
    month: item.month,
    revenue: item.revenue / 1000000, // Convert to millions for better display
    orders: item.orderCount
  }));

  const totalRevenue = stats.monthlyRevenue.reduce((sum, item) => sum + item.revenue, 0);
  const totalOrders = stats.monthlyRevenue.reduce((sum, item) => sum + item.orderCount, 0);

  return (
    <div className="space-y-6">
      <h2 className="text-3xl font-bold">Báo cáo bán hàng</h2>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="p-6">
          <p className="text-sm text-gray-600">Tổng doanh thu (6 tháng gần nhất)</p>
          <p className="text-3xl font-bold mt-2">₫{formatCurrency(totalRevenue)}</p>
          <p className="text-sm text-green-600 mt-1 flex items-center gap-1">
            <TrendingUp className="w-4 h-4" />
            {monthlyRevenueData.length} tháng
          </p>
        </Card>
        <Card className="p-6">
          <p className="text-sm text-gray-600">Tổng đơn hàng</p>
          <p className="text-3xl font-bold mt-2">{formatCurrency(totalOrders)}</p>
          <p className="text-sm text-green-600 mt-1 flex items-center gap-1">
            <TrendingUp className="w-4 h-4" />
            Đơn đã giao
          </p>
        </Card>
      </div>

      {/* Revenue & Orders Chart */}
      <Card className="p-6">
        <h3 className="text-xl font-bold mb-4">Doanh thu & Đơn hàng theo tháng</h3>
        <ResponsiveContainer width="100%" height={350}>
          <BarChart data={monthlyRevenueData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="month" />
            <YAxis yAxisId="left" tickFormatter={(value) => `${value}M`} />
            <YAxis yAxisId="right" orientation="right" />
            <Tooltip 
              formatter={(value: number, name: string) => {
                if (name === "Doanh thu (triệu)") {
                  return [`${value.toFixed(1)}M`, name];
                }
                return [value, name];
              }}
            />
            <Legend />
            <Bar yAxisId="left" dataKey="revenue" fill="#3b82f6" name="Doanh thu (triệu)" />
            <Bar yAxisId="right" dataKey="orders" fill="#8b5cf6" name="Đơn hàng" />
          </BarChart>
        </ResponsiveContainer>
      </Card>

      {/* Revenue Trend */}
      <Card className="p-6">
        <h3 className="text-xl font-bold mb-4">Xu hướng doanh thu</h3>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={monthlyRevenueData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="month" />
            <YAxis tickFormatter={(value) => `${value}M`} />
            <Tooltip 
              formatter={(value: number) => [`${value.toFixed(1)}M`, "Doanh thu"]}
            />
            <Line
              type="monotone"
              dataKey="revenue"
              stroke="#10b981"
              strokeWidth={2}
              name="Doanh thu (triệu)"
            />
          </LineChart>
        </ResponsiveContainer>
      </Card>

      {/* Top Products */}
      <Card className="p-6">
        <h3 className="text-xl font-bold mb-4">Top 5 sản phẩm bán chạy</h3>
        <div className="space-y-4">
          {stats.topProducts && stats.topProducts.length > 0 ? (
            stats.topProducts.map((product, index) => (
              <div
                key={product._id}
                className="flex items-center justify-between p-4 bg-gray-50 rounded-lg"
              >
                <div className="flex items-center gap-4">
                  <div className="w-8 h-8 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-full flex items-center justify-center font-bold">
                    {index + 1}
                  </div>
                  <div className="flex items-center gap-3">
                    {product.image && (
                      <img 
                        src={product.image} 
                        alt={product.name}
                        className="w-12 h-12 object-cover rounded"
                      />
                    )}
                    <div>
                      <p className="font-medium">{product.name}</p>
                      <p className="text-sm text-gray-500">
                        Đã bán: {product.totalSold} sản phẩm
                      </p>
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-bold">₫{formatCurrency(product.revenue)}</p>
                  <p className="text-sm text-gray-500">
                    {formatCurrency(product.totalSold)} đơn
                  </p>
                </div>
              </div>
            ))
          ) : (
            <p className="text-gray-500 text-center py-4">Chưa có dữ liệu sản phẩm</p>
          )}
        </div>
      </Card>
    </div>
  );
}
