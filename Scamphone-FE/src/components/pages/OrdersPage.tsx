import { useState, useEffect } from "react";
import {
  Package,
  Clock,
  Truck,
  CheckCircle,
  XCircle,
  Home,
  Search,
  Eye,
  RotateCcw,
  MessageSquare,
  MapPin,
  Phone,
  Calendar,
  Loader2
} from "lucide-react";
import { Card } from "../ui/card";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { orderService } from "../../services/orderService";

interface Order {
  _id: string;
  orderItems: Array<{
    product?: any;
    name: string;
    quantity: number;
    price: number;
    image?: string;
    sku?: string;
    variantAttributes?: { [key: string]: string };
  }>;
  shippingAddress: {
    fullName: string;
    phone: string;
    address: string;
    city?: string;
    district?: string;
  };
  totalPrice: number;
  status: "pending" | "processing" | "shipping" | "delivered" | "cancelled";
  createdAt: string;
  paymentMethod?: string;
}

const statusConfig = {
  pending: {
    label: "Chờ xử lý",
    color: "bg-yellow-50 text-yellow-700 border-yellow-200",
    icon: Clock,
    dotColor: "bg-yellow-500"
  },
  processing: {
    label: "Đang xử lý",
    color: "bg-blue-50 text-blue-700 border-blue-200",
    icon: Package,
    dotColor: "bg-blue-500"
  },
  shipping: {
    label: "Đang giao",
    color: "bg-purple-50 text-purple-700 border-purple-200",
    icon: Truck,
    dotColor: "bg-purple-500"
  },
  delivered: {
    label: "Đã giao",
    color: "bg-green-50 text-green-700 border-green-200",
    icon: CheckCircle,
    dotColor: "bg-green-500"
  },
  cancelled: {
    label: "Đã hủy",
    color: "bg-red-50 text-red-700 border-red-200",
    icon: XCircle,
    dotColor: "bg-red-500"
  },
};

export function OrdersPage({ onPageChange }: { onPageChange: (page: string) => void }) {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [cancellingId, setCancellingId] = useState<string | null>(null);

  useEffect(() => {
    loadOrders();
  }, []);

  const loadOrders = async () => {
    try {
      setLoading(true);
      const data = await orderService.getUserOrders();
      setOrders(data);
    } catch (error) {
      console.error("Error loading orders:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleCancelOrder = async (orderId: string) => {
    const confirmed = window.confirm("Bạn có chắc chắn muốn hủy đơn hàng này?");
    if (!confirmed) return;

    try {
      setCancellingId(orderId);
      await orderService.cancelOrder(orderId);
      await loadOrders();
      alert("Đơn hàng đã được hủy thành công");
    } catch (error: any) {
      console.error("Error cancelling order:", error);
      alert(error.response?.data?.message || "Không thể hủy đơn hàng lúc này");
    } finally {
      setCancellingId(null);
    }
  };

  const handleReorder = (order: Order) => {
    alert("Tính năng đặt lại đơn hàng đang được phát triển!");
  };

  const filteredOrders = orders.filter((order) => {
    const matchesSearch = order._id.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = filterStatus === "all" || order.status === filterStatus;
    return matchesSearch && matchesStatus;
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin text-blue-600 mx-auto mb-4" />
          <p className="text-gray-600">Đang tải đơn hàng...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b sticky top-0 z-10">
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
            Đơn hàng của tôi
          </h1>
          <div className="w-[120px]"></div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Filters */}
        <Card className="p-6 mb-6 bg-white">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <Input
                placeholder="Tìm kiếm theo mã đơn hàng..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <div className="flex gap-2 flex-wrap">
              <Button
                variant={filterStatus === "all" ? "default" : "outline"}
                onClick={() => setFilterStatus("all")}
                size="sm"
              >
                Tất cả
              </Button>
              {Object.entries(statusConfig).map(([status, config]) => {
                const Icon = config.icon;
                return (
                  <Button
                    key={status}
                    variant={filterStatus === status ? "default" : "outline"}
                    onClick={() => setFilterStatus(status)}
                    size="sm"
                    className="flex items-center gap-1"
                  >
                    <Icon className="w-4 h-4" />
                    {config.label}
                  </Button>
                );
              })}
            </div>
          </div>
        </Card>

        {/* Orders List */}
        {filteredOrders.length === 0 ? (
          <Card className="p-12 text-center bg-white">
            <Package className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-600 mb-2">
              {searchTerm || filterStatus !== "all" ? "Không tìm thấy đơn hàng" : "Chưa có đơn hàng nào"}
            </h3>
            <p className="text-gray-500 mb-6">
              {searchTerm || filterStatus !== "all" ? "Thử thay đổi bộ lọc tìm kiếm" : "Bạn chưa có đơn hàng nào. Hãy mua sắm ngay!"}
            </p>
            {!searchTerm && filterStatus === "all" && (
              <Button
                onClick={() => onPageChange('home')}
                className="bg-gradient-to-r from-blue-600 to-purple-600 text-white"
              >
                Khám phá sản phẩm
              </Button>
            )}
          </Card>
        ) : (
          <div className="space-y-4">
            {filteredOrders.map((order) => {
              const StatusIcon = statusConfig[order.status].icon;
              return (
                <Card key={order._id} className="overflow-hidden bg-white hover:shadow-lg transition-shadow">
                  {/* Order Header */}
                  <div className="bg-gradient-to-r from-gray-50 to-gray-100 p-4 border-b">
                    <div className="flex items-center justify-between flex-wrap gap-2">
                      <div className="flex items-center gap-3">
                        <div className="flex items-center gap-2">
                          <Package className="w-5 h-5 text-gray-600" />
                          <span className="font-medium text-gray-900">
                            Đơn hàng #{order._id.slice(-8).toUpperCase()}
                          </span>
                        </div>
                        <div className="h-5 w-px bg-gray-300"></div>
                        <div className="flex items-center gap-1 text-sm text-gray-600">
                          <Calendar className="w-4 h-4" />
                          {new Date(order.createdAt).toLocaleDateString('vi-VN', {
                            day: '2-digit',
                            month: '2-digit',
                            year: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </div>
                      </div>
                      <div className={`flex items-center gap-2 px-4 py-2 rounded-full border ${statusConfig[order.status].color}`}>
                        <div className={`w-2 h-2 rounded-full ${statusConfig[order.status].dotColor} animate-pulse`}></div>
                        <StatusIcon className="w-4 h-4" />
                        <span className="font-medium text-sm">{statusConfig[order.status].label}</span>
                      </div>
                    </div>
                  </div>

                  <div className="p-6">
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                      {/* Products */}
                      <div className="lg:col-span-2">
                        <h4 className="font-semibold mb-3 text-gray-900">Sản phẩm</h4>
                        <div className="space-y-3">
                          {order.orderItems.map((item, index) => (
                            <div key={index} className="flex gap-4 p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                              {item.image && (
                                <img
                                  src={item.image}
                                  alt={item.name}
                                  className="w-20 h-20 object-cover rounded-lg border"
                                />
                              )}
                              <div className="flex-1 min-w-0">
                                <p className="font-medium text-gray-900 truncate">{item.name}</p>
                                {item.variantAttributes && Object.keys(item.variantAttributes).length > 0 && (
                                  <p className="text-xs text-gray-600 mt-1">
                                    📦 {Object.entries(item.variantAttributes).map(([key, value]) => value).join(', ')}
                                  </p>
                                )}
                                <p className="text-sm text-gray-600 mt-1">Số lượng: x{item.quantity}</p>
                                <p className="text-sm font-medium text-blue-600 mt-1">
                                  ₫{item.price.toLocaleString()} / sản phẩm
                                </p>
                              </div>
                              <div className="text-right">
                                <p className="font-bold text-gray-900">
                                  ₫{(item.price * item.quantity).toLocaleString()}
                                </p>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Order Info */}
                      <div className="space-y-4">
                        {/* Shipping Address */}
                        <div className="bg-blue-50 p-4 rounded-lg border border-blue-100">
                          <h4 className="font-semibold mb-3 flex items-center gap-2 text-blue-900">
                            <MapPin className="w-4 h-4" />
                            Địa chỉ giao hàng
                          </h4>
                          <div className="space-y-1 text-sm text-blue-800">
                            <p className="font-medium">{order.shippingAddress.fullName}</p>
                            <p className="flex items-center gap-1">
                              <Phone className="w-3 h-3" />
                              {order.shippingAddress.phone}
                            </p>
                            <p>{order.shippingAddress.address}</p>
                            {order.shippingAddress.district && <p>{order.shippingAddress.district}</p>}
                            {order.shippingAddress.city && <p>{order.shippingAddress.city}</p>}
                          </div>
                        </div>

                        {/* Total */}
                        <div className="bg-gradient-to-r from-blue-50 to-purple-50 p-4 rounded-lg border border-blue-200">
                          <div className="flex justify-between items-center mb-2">
                            <span className="text-gray-600">Tạm tính:</span>
                            <span className="font-medium">₫{order.totalPrice.toLocaleString()}</span>
                          </div>
                          <div className="flex justify-between items-center mb-2">
                            <span className="text-gray-600">Phí vận chuyển:</span>
                            <span className="font-medium text-green-600">Miễn phí</span>
                          </div>
                          <div className="border-t pt-2 mt-2">
                            <div className="flex justify-between items-center">
                              <span className="font-semibold text-gray-900">Tổng cộng:</span>
                              <span className="text-xl font-bold text-blue-600">
                                ₫{order.totalPrice.toLocaleString()}
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* Actions */}
                        <div className="flex flex-col gap-2">
                          <Button
                            variant="outline"
                            className="w-full"
                            onClick={() => setSelectedOrder(order)}
                          >
                            <Eye className="w-4 h-4 mr-2" />
                            Xem chi tiết
                          </Button>
                          {["pending", "processing"].includes(order.status) && (
                            <Button
                              variant="outline"
                              className="w-full text-red-600 hover:text-red-700 hover:bg-red-50"
                              onClick={() => handleCancelOrder(order._id)}
                              disabled={cancellingId === order._id}
                            >
                              <XCircle className="w-4 h-4 mr-2" />
                              {cancellingId === order._id ? "Đang hủy..." : "Hủy đơn hàng"}
                            </Button>
                          )}
                          {order.status === "delivered" && (
                            <>
                              <Button
                                variant="outline"
                                className="w-full"
                                onClick={() => handleReorder(order)}
                              >
                                <RotateCcw className="w-4 h-4 mr-2" />
                                Mua lại
                              </Button>
                              <Button
                                className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white"
                              >
                                <MessageSquare className="w-4 h-4 mr-2" />
                                Đánh giá
                              </Button>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>
        )}
      </div>

      {/* Order Detail Modal */}
      {selectedOrder && (
        <div
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
          onClick={() => setSelectedOrder(null)}
        >
          <div
            className="bg-white rounded-xl max-w-3xl w-full max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="sticky top-0 bg-gradient-to-r from-blue-600 to-purple-600 text-white p-6 rounded-t-xl">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-2xl font-bold mb-1">Chi tiết đơn hàng</h3>
                  <p className="text-white/80">#{selectedOrder._id.slice(-8).toUpperCase()}</p>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setSelectedOrder(null)}
                  className="text-white border-white/30 hover:bg-white/10"
                >
                  <XCircle className="w-5 h-5" />
                </Button>
              </div>
            </div>

            <div className="p-6 space-y-6">
              {/* Status Timeline */}
              <div className="bg-gray-50 p-4 rounded-lg">
                <h4 className="font-semibold mb-3">Trạng thái đơn hàng</h4>
                <div className="flex items-center justify-between">
                  {Object.entries(statusConfig).filter(([key]) => key !== 'cancelled').map(([key, config], index, arr) => {
                    const Icon = config.icon;
                    const isActive = ['pending', 'processing', 'shipping', 'delivered'].indexOf(selectedOrder.status) >= index;
                    return (
                      <div key={key} className="flex items-center flex-1">
                        <div className="flex flex-col items-center">
                          <div className={`w-10 h-10 rounded-full flex items-center justify-center ${isActive ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-400'}`}>
                            <Icon className="w-5 h-5" />
                          </div>
                          <p className={`text-xs mt-2 ${isActive ? 'font-medium text-blue-600' : 'text-gray-400'}`}>
                            {config.label}
                          </p>
                        </div>
                        {index < arr.length - 1 && (
                          <div className={`flex-1 h-1 mx-2 ${isActive ? 'bg-blue-600' : 'bg-gray-200'}`}></div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Products */}
              <div>
                <h4 className="font-semibold mb-3">Sản phẩm</h4>
                <div className="space-y-3">
                  {selectedOrder.orderItems.map((item, index) => (
                    <div key={index} className="flex gap-4 p-3 bg-gray-50 rounded-lg">
                      {item.image && (
                        <img src={item.image} alt={item.name} className="w-20 h-20 object-cover rounded" />
                      )}
                      <div className="flex-1">
                        <p className="font-medium">{item.name}</p>
                        {item.variantAttributes && Object.keys(item.variantAttributes).length > 0 && (
                          <p className="text-xs text-gray-600 mt-1">
                            📦 Phân loại: {Object.entries(item.variantAttributes).map(([key, value]) => value).join(', ')}
                          </p>
                        )}
                        <p className="text-sm text-gray-600">Số lượng: x{item.quantity}</p>
                        <p className="text-sm text-blue-600 font-medium">₫{item.price.toLocaleString()}</p>
                      </div>
                      <p className="font-bold">₫{(item.price * item.quantity).toLocaleString()}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Summary */}
              <div className="border-t pt-4">
                <div className="flex justify-between mb-2">
                  <span className="text-gray-600">Tạm tính:</span>
                  <span>₫{selectedOrder.totalPrice.toLocaleString()}</span>
                </div>
                <div className="flex justify-between mb-2">
                  <span className="text-gray-600">Phí vận chuyển:</span>
                  <span className="text-green-600">Miễn phí</span>
                </div>
                <div className="flex justify-between text-xl font-bold border-t pt-2">
                  <span>Tổng cộng:</span>
                  <span className="text-blue-600">₫{selectedOrder.totalPrice.toLocaleString()}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
