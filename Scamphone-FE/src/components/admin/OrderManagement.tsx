import { useState, useEffect } from "react";
import { Search, Filter, Eye, Printer, Loader2, CheckCircle, XCircle, Package } from "lucide-react";
import { Card } from "../ui/card";
import { Input } from "../ui/input";
import { Button } from "../ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select";
import { orderService } from "../../services/orderService";

interface Order {
  _id: string;
  user: {
    _id: string;
    name: string;
    email: string;
  };
  orderItems: Array<{
    product: any;
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
  paymentMethod: string;
  totalPrice: number;
  status: "pending" | "processing" | "shipping" | "delivered" | "cancelled";
  rejectionReason?: string;
  createdAt: string;
}

const statusConfig = {
  pending: { label: "Chờ xử lý", color: "bg-yellow-100 text-yellow-700" },
  processing: { label: "Đang xử lý", color: "bg-blue-100 text-blue-700" },
  shipping: { label: "Đang giao", color: "bg-purple-100 text-purple-700" },
  delivered: { label: "Đã giao", color: "bg-green-100 text-green-700" },
  cancelled: { label: "Đã hủy", color: "bg-red-100 text-red-700" },
};

export function OrderManagement() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [rejectionReason, setRejectionReason] = useState("");
  const [processingOrderId, setProcessingOrderId] = useState<string | null>(null);

  useEffect(() => {
    loadOrders();
  }, [filterStatus]);

  const loadOrders = async () => {
    try {
      setLoading(true);
      const data = await orderService.getAllOrders();
      // Transform data to match local Order interface
      const transformedOrders = data.map((order: any) => ({
        ...order,
        user: order.user || { _id: '', name: 'Unknown', email: 'N/A' }
      }));
      setOrders(transformedOrders);
    } catch (error) {
      console.error('Error loading orders:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleConfirmOrder = async (orderId: string) => {
    if (!confirm('Xác nhận đơn hàng này? Hàng sẽ được trừ khỏi kho.')) return;
    
    try {
      setProcessingOrderId(orderId);
      await orderService.confirmOrder(orderId);
      alert('Đã xác nhận đơn hàng thành công! Số lượng hàng đã được trừ khỏi kho.');
      loadOrders();
    } catch (error: any) {
      console.error('Error confirming order:', error);
      alert(error?.response?.data?.message || 'Có lỗi xảy ra khi xác nhận đơn hàng!');
    } finally {
      setProcessingOrderId(null);
    }
  };

  const handleRejectOrder = async (orderId: string) => {
    setProcessingOrderId(orderId);
    setShowRejectModal(true);
  };

  const submitRejectOrder = async () => {
    if (!rejectionReason.trim()) {
      alert('Vui lòng nhập lý do từ chối!');
      return;
    }

    if (!processingOrderId) return;

    try {
      await orderService.rejectOrder(processingOrderId, rejectionReason);
      alert('Đã từ chối đơn hàng và gửi thông báo đến khách hàng.');
      setShowRejectModal(false);
      setRejectionReason('');
      setProcessingOrderId(null);
      loadOrders();
    } catch (error: any) {
      console.error('Error rejecting order:', error);
      alert(error?.response?.data?.message || 'Có lỗi xảy ra khi từ chối đơn hàng!');
    }
  };

  const handleUpdateStatus = async (orderId: string, newStatus: string) => {
    if (!confirm(`Bạn có chắc chắn muốn cập nhật trạng thái đơn hàng thành "${statusConfig[newStatus as keyof typeof statusConfig]?.label}"?`)) return;
    
    try {
      await orderService.updateOrderStatus(orderId, newStatus as any);
      alert('Đã cập nhật trạng thái đơn hàng thành công!');
      loadOrders();
    } catch (error) {
      console.error('Error updating order status:', error);
      alert('Có lỗi xảy ra khi cập nhật trạng thái!');
    }
  };

  const filteredOrders = orders.filter((order) => {
    const matchesSearch =
      order._id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.user.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = filterStatus === "all" || order.status === filterStatus;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-bold">Quản lý đơn hàng</h2>
      </div>

      {/* Filters */}
      <Card className="p-6">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <Input
              placeholder="Tìm kiếm theo mã đơn hoặc tên khách hàng..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          <Select value={filterStatus} onValueChange={setFilterStatus}>
            <SelectTrigger className="w-full md:w-[200px]">
              <Filter className="w-4 h-4 mr-2" />
              <SelectValue placeholder="Lọc theo trạng thái" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tất cả</SelectItem>
              <SelectItem value="pending">Chờ xử lý</SelectItem>
              <SelectItem value="processing">Đang xử lý</SelectItem>
              <SelectItem value="shipping">Đang giao</SelectItem>
              <SelectItem value="delivered">Đã giao</SelectItem>
              <SelectItem value="cancelled">Đã hủy</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </Card>

      {/* Orders Table */}
      <Card className="p-6">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b">
                <th className="text-left py-3 px-4">Mã đơn</th>
                <th className="text-left py-3 px-4">Khách hàng</th>
                <th className="text-left py-3 px-4">Ngày đặt</th>
                <th className="text-left py-3 px-4">Tổng tiền</th>
                <th className="text-left py-3 px-4">Thanh toán</th>
                <th className="text-left py-3 px-4">Trạng thái</th>
                <th className="text-left py-3 px-4">Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center">
                    <Loader2 className="w-6 h-6 animate-spin mx-auto text-blue-600" />
                  </td>
                </tr>
              ) : filteredOrders.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-gray-500">
                    Không có đơn hàng nào
                  </td>
                </tr>
              ) : (
                filteredOrders.map((order) => (
                  <tr key={order._id} className="border-b hover:bg-gray-50">
                    <td className="py-3 px-4 font-medium">#{order._id.slice(-8)}</td>
                    <td className="py-3 px-4">
                      <div>
                        <div className="font-medium">{order.user.name}</div>
                        <div className="text-sm text-gray-500">{order.user.email}</div>
                      </div>
                    </td>
                    <td className="py-3 px-4">{new Date(order.createdAt).toLocaleDateString('vi-VN')}</td>
                    <td className="py-3 px-4 font-medium">
                      ₫{order.totalPrice.toLocaleString()}
                    </td>
                    <td className="py-3 px-4">
                      <span className={`px-2 py-1 rounded text-xs font-medium ${
                        order.paymentMethod === 'COD' 
                          ? 'bg-orange-100 text-orange-700'
                          : 'bg-green-100 text-green-700'
                      }`}>
                        {order.paymentMethod === 'COD' ? '💵 COD' : '💳 VNPay'}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <span
                        className={`px-3 py-1 rounded-full text-sm ${
                          statusConfig[order.status].color
                        }`}
                      >
                        {statusConfig[order.status].label}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setSelectedOrder(order)}
                        >
                          <Eye className="w-4 h-4" />
                        </Button>
                        {order.status === 'pending' && (
                          <>
                            <Button
                              size="sm"
                              variant="outline"
                              className="text-green-600 border-green-300 hover:bg-green-50 flex items-center gap-1"
                              onClick={() => handleConfirmOrder(order._id)}
                              disabled={processingOrderId === order._id}
                            >
                              {processingOrderId === order._id ? (
                                <>
                                  <Loader2 className="w-4 h-4 animate-spin" />
                                  <span>Đang xử lý...</span>
                                </>
                              ) : (
                                <>
                                  <CheckCircle className="w-4 h-4" />
                                  <span>Xác nhận</span>
                                </>
                              )}
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              className="text-red-600 border-red-300 hover:bg-red-50 flex items-center gap-1"
                              onClick={() => handleRejectOrder(order._id)}
                            >
                              <XCircle className="w-4 h-4" />
                              <span>Từ chối</span>
                            </Button>
                          </>
                        )}
                        {order.status !== 'pending' && order.status !== 'cancelled' && (
                          <Select
                            value={order.status}
                            onValueChange={(value: string) => handleUpdateStatus(order._id, value)}
                          >
                            <SelectTrigger className="w-[140px] h-8">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="processing">Đang xử lý</SelectItem>
                              <SelectItem value="shipping">Đang giao</SelectItem>
                              <SelectItem value="delivered">Đã giao</SelectItem>
                            </SelectContent>
                          </Select>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Order Detail Modal */}
      {selectedOrder && (
        <div
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
          onClick={() => setSelectedOrder(null)}
        >
          <div
            className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-6 border-b">
              <h3 className="text-2xl font-bold">Chi tiết đơn hàng #{selectedOrder._id.slice(-8)}</h3>
            </div>
            <div className="p-6 space-y-6">
              {/* Customer Info */}
              <div>
                <h4 className="font-bold mb-2">Thông tin khách hàng</h4>
                <div className="space-y-1 text-sm">
                  <p>Họ tên: {selectedOrder.shippingAddress.fullName}</p>
                  <p>Email: {selectedOrder.user.email}</p>
                  <p>Số điện thoại: {selectedOrder.shippingAddress.phone}</p>
                  <p>Địa chỉ: {selectedOrder.shippingAddress.address}</p>
                  {selectedOrder.shippingAddress.district && (
                    <p>Quận/Huyện: {selectedOrder.shippingAddress.district}</p>
                  )}
                  {selectedOrder.shippingAddress.city && (
                    <p>Thành phố: {selectedOrder.shippingAddress.city}</p>
                  )}
                </div>
              </div>

              {/* Payment Method */}
              <div>
                <h4 className="font-bold mb-2">Phương thức thanh toán</h4>
                <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                  <p className="text-sm font-medium text-blue-800">
                    {selectedOrder.paymentMethod === 'COD' ? (
                      <>
                        <Package className="w-4 h-4 inline mr-2" />
                        Thanh toán khi nhận hàng (COD)
                      </>
                    ) : selectedOrder.paymentMethod === 'VNPay' ? (
                      <>
                        💳 Thanh toán qua VNPay QR
                      </>
                    ) : (
                      selectedOrder.paymentMethod
                    )}
                  </p>
                </div>
              </div>

              {/* Products */}
              <div>
                <h4 className="font-bold mb-2">Sản phẩm</h4>
                <div className="space-y-2">
                  {selectedOrder.orderItems.map((item, index) => (
                    <div
                      key={index}
                      className="flex justify-between items-center p-3 bg-gray-50 rounded-lg"
                    >
                      <div>
                        <p className="font-medium">{item.name}</p>
                        {item.variantAttributes && Object.keys(item.variantAttributes).length > 0 && (
                          <p className="text-xs text-gray-600 mt-1">
                            📦 Phân loại: {Object.entries(item.variantAttributes).map(([key, value]) => value).join(', ')}
                          </p>
                        )}
                        <p className="text-sm text-gray-500">
                          Số lượng: {item.quantity} x ₫{item.price.toLocaleString()}
                        </p>
                      </div>
                      <p className="font-medium">
                        ₫{(item.price * item.quantity).toLocaleString()}
                      </p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Total */}
              <div className="border-t pt-4">
                <div className="flex justify-between items-center">
                  <span className="font-bold">Tổng cộng:</span>
                  <span className="text-2xl font-bold text-blue-600">
                    ₫{selectedOrder.totalPrice.toLocaleString()}
                  </span>
                </div>
              </div>

              {/* Status Update */}
              <div>
                <h4 className="font-bold mb-2">Cập nhật trạng thái</h4>
                {selectedOrder.status === 'pending' ? (
                  <div className="flex gap-3">
                    <Button
                      variant="outline"
                      className="flex-1 text-green-600 border-green-300 hover:bg-green-50"
                      onClick={() => {
                        handleConfirmOrder(selectedOrder._id);
                        setSelectedOrder(null);
                      }}
                    >
                      <CheckCircle className="w-4 h-4 mr-2" />
                      Xác nhận đơn hàng
                    </Button>
                    <Button
                      variant="outline"
                      className="flex-1 text-red-600 border-red-300 hover:bg-red-50"
                      onClick={() => {
                        handleRejectOrder(selectedOrder._id);
                        setSelectedOrder(null);
                      }}
                    >
                      <XCircle className="w-4 h-4 mr-2" />
                      Từ chối đơn hàng
                    </Button>
                  </div>
                ) : selectedOrder.status === 'cancelled' ? (
                  <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                    <p className="text-sm text-red-800">
                      <strong>Đơn hàng đã bị hủy</strong>
                      {selectedOrder.rejectionReason && (
                        <>
                          <br />
                          Lý do: {selectedOrder.rejectionReason}
                        </>
                      )}
                    </p>
                  </div>
                ) : (
                  <Select 
                    defaultValue={selectedOrder.status}
                    onValueChange={(value: string) => {
                      handleUpdateStatus(selectedOrder._id, value);
                      setSelectedOrder(null);
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="processing">Đang xử lý</SelectItem>
                      <SelectItem value="shipping">Đang giao</SelectItem>
                      <SelectItem value="delivered">Đã giao</SelectItem>
                    </SelectContent>
                  </Select>
                )}
              </div>
            </div>
            <div className="p-6 border-t flex gap-3 justify-end">
              <Button variant="outline" onClick={() => setSelectedOrder(null)}>
                Đóng
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Reject Order Modal */}
      {showRejectModal && (
        <div
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-[100] p-4"
          onClick={() => {
            setShowRejectModal(false);
            setRejectionReason('');
            setProcessingOrderId(null);
          }}
        >
          <div
            className="bg-white rounded-lg max-w-md w-full"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-6 border-b">
              <h3 className="text-xl font-bold text-red-600 flex items-center gap-2">
                <XCircle className="w-6 h-6" />
                Từ chối đơn hàng
              </h3>
            </div>
            <div className="p-6">
              <p className="text-gray-700 mb-4">
                Vui lòng nhập lý do từ chối đơn hàng. Thông tin này sẽ được gửi đến khách hàng.
              </p>
              <textarea
                className="w-full border border-gray-300 rounded-lg p-3 min-h-[120px] focus:ring-2 focus:ring-red-500 focus:border-red-500"
                placeholder="VD: Sản phẩm tạm thời hết hàng, dự kiến nhập hàng sau 3-5 ngày..."
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
              />
            </div>
            <div className="p-6 border-t flex gap-3 justify-end">
              <Button
                variant="outline"
                onClick={() => {
                  setShowRejectModal(false);
                  setRejectionReason('');
                  setProcessingOrderId(null);
                }}
              >
                Hủy
              </Button>
              <Button
                variant="outline"
                className="text-red-600 border-red-300 hover:bg-red-50"
                onClick={submitRejectOrder}
              >
                Xác nhận từ chối
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
