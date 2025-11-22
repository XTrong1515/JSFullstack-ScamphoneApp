import { useState } from "react";
import {
  CreditCard,
  Truck,
  QrCode,
  CheckCircle,
  Home,
  ChevronRight,
  Loader2,
  ShoppingBag,
  MapPin,
  Package,
  AlertCircle
} from "lucide-react";
import { Card } from "../ui/card";
import { Button } from "../ui/button";
import { orderService } from "../../services/orderService";
import { paymentService } from "../../services/paymentService";

interface PaymentPageProps {
  onPageChange: (page: string, data?: any) => void;
  checkoutData?: {
    cartItems: any[];
    shippingInfo: any;
    totalPrice: number;
  };
}

export function PaymentPage({ onPageChange, checkoutData }: PaymentPageProps) {
  const [selectedMethod, setSelectedMethod] = useState<'COD' | 'VNPay'>('COD');
  const [loading, setLoading] = useState(false);
  const [showQR, setShowQR] = useState(false);

  if (!checkoutData) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 flex items-center justify-center">
        <Card className="p-12 text-center bg-white max-w-md">
          <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-gray-600 mb-2">
            Không có thông tin đơn hàng
          </h3>
          <p className="text-gray-500 mb-6">
            Vui lòng quay lại giỏ hàng và thử lại
          </p>
          <Button
            onClick={() => onPageChange('cart')}
            className="bg-gradient-to-r from-blue-600 to-purple-600 text-white"
          >
            Quay lại giỏ hàng
          </Button>
        </Card>
      </div>
    );
  }

  const { cartItems, shippingInfo, totalPrice } = checkoutData;

  const handlePlaceOrder = async () => {
    try {
      setLoading(true);

      if (selectedMethod === 'VNPay') {
        // Create order first
        const order = await createOrder();
        
        // Create VNPay payment URL
        try {
          const paymentData = await paymentService.createVNPayPayment({
            orderId: order._id,
            amount: totalPrice,
            orderInfo: `Thanh toan don hang ${order._id}`,
            ipAddr: '127.0.0.1' // In production, get real IP
          });

          // Redirect to VNPay payment gateway
          window.location.href = paymentData.paymentUrl;
        } catch (paymentError) {
          console.error('VNPay payment error:', paymentError);
          // If payment URL creation fails, show error but order is still created
          alert('Không thể tạo link thanh toán VNPay. Vui lòng chọn phương thức khác.');
          setLoading(false);
        }
      } else {
        // COD - Create order immediately
        await createOrder();
        
        // Clear cart and redirect
        localStorage.removeItem('cart');
        localStorage.removeItem('shippingInfo');
        setLoading(false);
        onPageChange('order-success', { orderId: 'success' });
      }
    } catch (error: any) {
      console.error('Error placing order:', error);
      alert(error?.response?.data?.message || 'Có lỗi xảy ra khi đặt hàng!');
      setLoading(false);
    }
  };

  const createOrder = async () => {
    const orderData = {
      orderItems: cartItems.map(item => ({
        // ensure we send a valid Mongo _id for backend stock deduction
        product: item.id || item._id,
        name: item.name,
        quantity: item.quantity,
        price: item.price,
        image: item.image,
        // Include variant information if product has selected variant
        ...(item.selectedVariant && {
          variantAttributes: item.selectedVariant.attributes,
          sku: item.selectedVariant.sku
        })
      })),
      shippingAddress: shippingInfo,
      paymentMethod: selectedMethod,
      totalPrice: totalPrice
    };

    const order = await orderService.createOrder(orderData);
    return order;
  };

  if (showQR) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 flex items-center justify-center p-4">
        <Card className="p-8 bg-white max-w-md w-full text-center">
          <div className="mb-6">
            <div className="w-16 h-16 bg-gradient-to-r from-blue-600 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-4">
              <QrCode className="w-8 h-8 text-white" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              Quét mã QR để thanh toán
            </h2>
            <p className="text-gray-600">
              Sử dụng ứng dụng VNPay để quét mã
            </p>
          </div>

          {/* QR Code Placeholder */}
          <div className="bg-white border-4 border-blue-600 rounded-xl p-4 mb-6">
            <div className="bg-gradient-to-br from-blue-100 to-purple-100 aspect-square rounded-lg flex items-center justify-center">
              <div className="text-center">
                <QrCode className="w-32 h-32 text-blue-600 mx-auto mb-2" />
                <p className="text-sm text-gray-600">Mã QR VNPay</p>
                <p className="text-lg font-bold text-gray-900 mt-2">
                  ₫{totalPrice.toLocaleString()}
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-center gap-2 text-blue-600 mb-4">
            <Loader2 className="w-5 h-5 animate-spin" />
            <span>Đang chờ thanh toán...</span>
          </div>

          <Button
            variant="outline"
            onClick={() => {
              setShowQR(false);
              setLoading(false);
            }}
            className="w-full"
          >
            Hủy thanh toán
          </Button>

          <p className="text-xs text-gray-500 mt-4">
            💡 Demo: Thanh toán sẽ tự động hoàn tất sau 3 giây
          </p>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between mb-2">
            <Button
              variant="outline"
              onClick={() => onPageChange('checkout')}
              className="flex items-center gap-2"
            >
              <Home className="w-4 h-4" />
              Quay lại
            </Button>
            <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              Thanh toán
            </h1>
            <div className="w-[100px]"></div>
          </div>

          {/* Progress indicator */}
          <div className="flex items-center justify-center gap-2 text-sm">
            <div className="flex items-center gap-2 text-gray-400">
              <ShoppingBag className="w-4 h-4" />
              <span>Giỏ hàng</span>
            </div>
            <ChevronRight className="w-4 h-4 text-gray-400" />
            <div className="flex items-center gap-2 text-gray-400">
              <MapPin className="w-4 h-4" />
              <span>Xác nhận</span>
            </div>
            <ChevronRight className="w-4 h-4 text-gray-400" />
            <div className="flex items-center gap-2 text-blue-600 font-medium">
              <Package className="w-4 h-4" />
              <span>Thanh toán</span>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Payment Methods */}
          <div className="lg:col-span-2 space-y-4">
            <h2 className="text-xl font-bold text-gray-900 mb-4">
              Chọn phương thức thanh toán
            </h2>

            {/* COD Option */}
            <Card
              className={`p-6 cursor-pointer transition-all ${
                selectedMethod === 'COD'
                  ? 'border-2 border-blue-600 bg-blue-50'
                  : 'border hover:border-gray-300'
              }`}
              onClick={() => setSelectedMethod('COD')}
            >
              <div className="flex items-start gap-4">
                <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center mt-1 ${
                  selectedMethod === 'COD' ? 'border-blue-600 bg-blue-600' : 'border-gray-300'
                }`}>
                  {selectedMethod === 'COD' && <CheckCircle className="w-4 h-4 text-white" />}
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="w-10 h-10 bg-orange-100 rounded-full flex items-center justify-center">
                      <Truck className="w-5 h-5 text-orange-600" />
                    </div>
                    <div>
                      <h3 className="font-bold text-gray-900">Thanh toán khi nhận hàng (COD)</h3>
                      <p className="text-sm text-gray-600">Thanh toán bằng tiền mặt khi nhận hàng</p>
                    </div>
                  </div>
                  {selectedMethod === 'COD' && (
                    <div className="mt-3 p-3 bg-white rounded-lg border border-orange-200">
                      <p className="text-sm text-gray-700">
                        ✓ Bạn sẽ thanh toán trực tiếp cho shipper khi nhận hàng
                      </p>
                      <p className="text-sm text-gray-700 mt-1">
                        ✓ Vui lòng chuẩn bị số tiền: <span className="font-bold text-orange-600">₫{totalPrice.toLocaleString()}</span>
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </Card>

            {/* VNPay Option */}
            <Card
              className={`p-6 cursor-pointer transition-all ${
                selectedMethod === 'VNPay'
                  ? 'border-2 border-blue-600 bg-blue-50'
                  : 'border hover:border-gray-300'
              }`}
              onClick={() => setSelectedMethod('VNPay')}
            >
              <div className="flex items-start gap-4">
                <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center mt-1 ${
                  selectedMethod === 'VNPay' ? 'border-blue-600 bg-blue-600' : 'border-gray-300'
                }`}>
                  {selectedMethod === 'VNPay' && <CheckCircle className="w-4 h-4 text-white" />}
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                      <QrCode className="w-5 h-5 text-blue-600" />
                    </div>
                    <div>
                      <h3 className="font-bold text-gray-900">Quét mã VNPay QR</h3>
                      <p className="text-sm text-gray-600">Thanh toán nhanh qua ứng dụng VNPay</p>
                    </div>
                  </div>
                  {selectedMethod === 'VNPay' && (
                    <div className="mt-3 p-3 bg-white rounded-lg border border-blue-200">
                      <p className="text-sm text-gray-700">
                        ✓ Quét mã QR bằng ứng dụng VNPay
                      </p>
                      <p className="text-sm text-gray-700 mt-1">
                        ✓ Thanh toán an toàn và nhanh chóng
                      </p>
                      <p className="text-sm text-gray-700 mt-1">
                        ✓ Nhận ưu đãi từ VNPay
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </Card>
          </div>

          {/* Order Summary */}
          <div className="lg:col-span-1">
            <Card className="p-6 bg-white sticky top-24">
              <h3 className="font-bold text-gray-900 mb-4">Thông tin đơn hàng</h3>

              <div className="space-y-3 mb-4 text-sm">
                <div className="pb-3 border-b">
                  <p className="text-gray-600 mb-1">Giao đến:</p>
                  <p className="font-medium text-gray-900">{shippingInfo.fullName}</p>
                  <p className="text-gray-600">{shippingInfo.phone}</p>
                  <p className="text-gray-600">{shippingInfo.address}</p>
                  {shippingInfo.district && <p className="text-gray-600">{shippingInfo.district}</p>}
                  {shippingInfo.city && <p className="text-gray-600">{shippingInfo.city}</p>}
                </div>

                <div className="flex justify-between">
                  <span className="text-gray-600">Số lượng sản phẩm:</span>
                  <span className="font-medium">{cartItems.length}</span>
                </div>

                <div className="flex justify-between">
                  <span className="text-gray-600">Tạm tính:</span>
                  <span className="font-medium">₫{totalPrice.toLocaleString()}</span>
                </div>

                <div className="flex justify-between">
                  <span className="text-gray-600">Phí vận chuyển:</span>
                  <span className="font-medium text-green-600">Miễn phí</span>
                </div>

                <div className="border-t pt-3">
                  <div className="flex justify-between items-center">
                    <span className="font-semibold text-gray-900">Tổng cộng:</span>
                    <span className="text-xl font-bold text-blue-600">
                      ₫{totalPrice.toLocaleString()}
                    </span>
                  </div>
                </div>
              </div>

              <Button
                onClick={handlePlaceOrder}
                disabled={loading}
                className="w-full h-12 bg-gradient-to-r from-blue-600 to-purple-600 text-white font-medium"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                    Đang xử lý...
                  </>
                ) : (
                  <>
                    <CreditCard className="w-5 h-5 mr-2" />
                    Đặt hàng
                  </>
                )}
              </Button>

              <div className="mt-4 p-3 bg-green-50 rounded-lg">
                <p className="text-xs text-green-800 text-center">
                  🔒 Giao dịch được mã hóa và bảo mật
                </p>
              </div>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
