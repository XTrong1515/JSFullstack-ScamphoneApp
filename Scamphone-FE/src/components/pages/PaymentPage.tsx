import { useState } from "react";
import axios from "axios";
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
  AlertCircle,
  Check
} from "lucide-react";
import { Card } from "../ui/card";
import { Button } from "../ui/button";
import { orderService } from "../../services/orderService";
import { useCartStore } from "../../stores/useCartStore";
import { VIETQR_CONFIG } from "../../config/vietqr";

interface PaymentPageProps {
  onPageChange: (page: string, data?: any) => void;
  checkoutData?: {
    cartItems: any[];
    shippingInfo: any;
    totalPrice: number;
  };
}

export function PaymentPage({ onPageChange, checkoutData }: PaymentPageProps) {
  const { appliedDiscount, clearCart } = useCartStore();
  const [selectedMethod, setSelectedMethod] = useState<'COD' | 'BANK_TRANSFER'>('COD');
  const [loading, setLoading] = useState(false);
  const [showQR, setShowQR] = useState(false);
  const [qrCodeImage, setQrCodeImage] = useState<string>('');
  const [currentOrderId, setCurrentOrderId] = useState<string>('');

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

  const generateVietQR = async (amount: number, orderInfo: string) => {
    try {
      console.log('[VietQR] Generating QR code via API for amount:', amount);
      const response = await axios.post(
        VIETQR_CONFIG.endpoint,
        {
          accountNo: VIETQR_CONFIG.bankAccount.accountNo,
          accountName: VIETQR_CONFIG.bankAccount.accountName,
          acqId: VIETQR_CONFIG.bankAccount.acqId,
          amount: amount,
          addInfo: orderInfo,
          format: "text",
          template: "compact"
        },
        { headers: VIETQR_CONFIG.headers }
      );

      if (response.data?.data?.qrDataURL) {
        const qrDataURL = response.data.data.qrDataURL;
        setQrCodeImage(qrDataURL);
        return qrDataURL;
      } else {
        throw new Error('Invalid response from VietQR API');
      }
    } catch (error: any) {
      console.error('[VietQR] API Error:', error.message, '. Falling back to static QR link.');
      const fallbackOrderInfo = encodeURIComponent(orderInfo);
      const fallbackAccountName = encodeURIComponent(VIETQR_CONFIG.bankAccount.accountName);
      const fallbackUrl = `https://img.vietqr.io/image/${VIETQR_CONFIG.bankAccount.acqId}-${VIETQR_CONFIG.bankAccount.accountNo}-compact.png?amount=${amount}&addInfo=${fallbackOrderInfo}&accountName=${fallbackAccountName}`;
      setQrCodeImage(fallbackUrl);
      return fallbackUrl;
    }
  };

  const handleConfirmPayment = async () => {
    if (!currentOrderId) {
      alert('Không tìm thấy mã đơn hàng!');
      return;
    }

    try {
      setLoading(true);
      
      // Update order status to 'processing'. Backend handles stock deduction.
      await orderService.updateOrderStatus(currentOrderId, 'processing');
      
      // Clear cart and redirect to success page
      clearCart();
      localStorage.removeItem('cart');
      localStorage.removeItem('shippingInfo');
      
      onPageChange('order-success', { orderId: currentOrderId });
    } catch (error: any) {
      console.error('Error confirming payment:', error);
      alert(error?.response?.data?.message || 'Có lỗi xảy ra khi xác nhận thanh toán!');
    } finally {
      setLoading(false);
    }
  };

  const handlePlaceOrder = async () => {
    setLoading(true);
    try {
      // Create order first regardless of payment method
      const order = await createOrder();
      setCurrentOrderId(order._id);

      if (selectedMethod === 'BANK_TRANSFER') {
        const orderInfo = `THANHTOAN ${order._id.slice(-8).toUpperCase()}`;
        await generateVietQR(totalPrice, orderInfo);
        setShowQR(true);
        // User will be shown the QR code and a confirmation button
      } else { // COD
        // For COD, we can redirect immediately after order creation
        clearCart();
        localStorage.removeItem('cart');
        localStorage.removeItem('shippingInfo');
        onPageChange('order-success', { orderId: order._id });
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
        product: item.id || item._id,
        name: item.name,
        quantity: item.quantity,
        price: item.price,
        image: item.image,
        ...(item.selectedVariant && {
          variantAttributes: item.selectedVariant.attributes,
          sku: item.selectedVariant.sku
        })
      })),
      shippingAddress: shippingInfo,
      paymentMethod: selectedMethod,
      totalPrice: totalPrice,
      ...(appliedDiscount && { discountCode: appliedDiscount.code })
    };
    const order = await orderService.createOrder(orderData);
    return order;
  };

  if (showQR) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 flex items-center justify-center p-4">
        <Card className="p-8 bg-white max-w-md w-full text-center">
          <div className="mb-6">
            <div className="w-16 h-16 bg-gradient-to-r from-green-600 to-blue-600 rounded-full flex items-center justify-center mx-auto mb-4">
              <QrCode className="w-8 h-8 text-white" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              Quét mã QR để thanh toán
            </h2>
            <p className="text-gray-600">
              Sử dụng ứng dụng ngân hàng để quét mã
            </p>
          </div>

          {qrCodeImage ? (
            <div className="bg-white border-4 border-green-600 rounded-xl p-4 mb-6">
              <img 
                src={qrCodeImage} 
                alt="VietQR Code" 
                className="w-full h-auto rounded-lg"
              />
            </div>
          ) : (
            <div className="bg-white border-4 border-blue-600 rounded-xl p-4 mb-6">
              <div className="bg-gradient-to-br from-blue-100 to-purple-100 aspect-square rounded-lg flex items-center justify-center">
                <Loader2 className="w-12 h-12 text-blue-600 animate-spin" />
              </div>
            </div>
          )}

          <div className="bg-gradient-to-r from-green-50 to-blue-50 rounded-lg p-4 mb-6 text-left">
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm text-gray-600">Số tiền:</span>
              <span className="text-xl font-bold text-green-600">
                ₫{totalPrice.toLocaleString()}
              </span>
            </div>
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm text-gray-600">Ngân hàng:</span>
              <span className="font-semibold text-gray-900">MB Bank</span>
            </div>
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm text-gray-600">Số tài khoản:</span>
              <span className="font-semibold text-gray-900">
                {VIETQR_CONFIG.bankAccount.accountNo}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Nội dung:</span>
              <span className="font-mono text-sm font-semibold text-gray-900">
                THANHTOAN {currentOrderId.slice(-8).toUpperCase()}
              </span>
            </div>
          </div>

          <Button
            onClick={handleConfirmPayment}
            disabled={loading}
            className="w-full mb-3 bg-gradient-to-r from-green-600 to-blue-600 text-white h-12 text-base font-semibold"
          >
            {loading ? (
              <>
                <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                Đang xử lý...
              </>
            ) : (
              <>
                <Check className="w-5 h-5 mr-2" />
                ✅ Xác nhận đã chuyển khoản
              </>
            )}
          </Button>

          <Button
            variant="outline"
            onClick={() => {
              setShowQR(false);
              setLoading(false);
              setQrCodeImage('');
            }}
            disabled={loading}
            className="w-full"
          >
            Hủy và chọn phương thức khác
          </Button>

          <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
            <p className="text-xs text-blue-800">
              <strong>📌 Lưu ý:</strong> Sau khi chuyển khoản thành công, hãy nhấn nút xác nhận để hoàn tất đơn hàng.
            </p>
          </div>
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

            {/* Bank Transfer Option */}
            <Card
              className={`p-6 cursor-pointer transition-all ${
                selectedMethod === 'BANK_TRANSFER'
                  ? 'border-2 border-green-600 bg-green-50'
                  : 'border hover:border-gray-300'
              }`}
              onClick={() => setSelectedMethod('BANK_TRANSFER')}
            >
              <div className="flex items-start gap-4">
                <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center mt-1 ${
                  selectedMethod === 'BANK_TRANSFER' ? 'border-green-600 bg-green-600' : 'border-gray-300'
                }`}>
                  {selectedMethod === 'BANK_TRANSFER' && <CheckCircle className="w-4 h-4 text-white" />}
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                      <QrCode className="w-5 h-5 text-green-600" />
                    </div>
                    <div>
                      <h3 className="font-bold text-gray-900">Chuyển khoản ngân hàng (VietQR)</h3>
                      <p className="text-sm text-gray-600">Quét mã QR bằng app ngân hàng</p>
                    </div>
                  </div>
                  {selectedMethod === 'BANK_TRANSFER' && (
                    <div className="mt-3 p-3 bg-white rounded-lg border border-green-200">
                      <p className="text-sm text-gray-700">
                        ✓ Quét mã QR bằng app ngân hàng bất kỳ
                      </p>
                      <p className="text-sm text-gray-700 mt-1">
                        ✓ Nhanh chóng, an toàn, không phí giao dịch
                      </p>
                      <p className="text-sm text-gray-700 mt-1">
                        ✓ Thông tin chuyển khoản tự động điền sẵn
                      </p>
                      <div className="mt-2 p-2 bg-yellow-50 rounded border border-yellow-200">
                        <p className="text-xs text-yellow-800">
                          💡 <strong>Hướng dẫn:</strong> Quét mã QR, sau khi chuyển khoản nhấn "Xác nhận đã chuyển khoản".
                        </p>
                      </div>
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
