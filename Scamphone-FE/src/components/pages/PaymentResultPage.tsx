import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { CheckCircle, XCircle, Loader2, Home } from "lucide-react";
import { Card } from "../ui/card";
import { Button } from "../ui/button";
import { paymentService } from "../../services/paymentService";
import { orderService } from "../../services/orderService";

interface PaymentResultPageProps {
  onPageChange: (page: string)=> void;
}

export function PaymentResultPage({ onPageChange }: PaymentResultPageProps) {
  const [loading, setLoading] = useState(true);
  const [paymentStatus, setPaymentStatus] = useState<{
    success: boolean;
    message: string;
    orderId?: string;
    amount?: number;
  } | null>(null);

  useEffect(() => {
    verifyPayment();
  }, []);

  const verifyPayment = async () => {
    try {
      // Get query parameters from URL
      const params = new URLSearchParams(window.location.search);
      
      // Verify payment with backend
      const result = await paymentService.verifyVNPayReturn(params);
      
      setPaymentStatus(result);

      // If payment successful, update order status
      if (result.success && result.orderId) {
        try {
          // Mark order as paid (you may need to add this endpoint)
          // await orderService.markAsPaid(result.orderId);
          
          // Clear cart
          localStorage.removeItem('cart');
          localStorage.removeItem('shippingInfo');
        } catch (err) {
          console.error('Error updating order:', err);
        }
      }
    } catch (error: any) {
      console.error('Payment verification error:', error);
      setPaymentStatus({
        success: false,
        message: error.response?.data?.message || 'Không thể xác minh thanh toán'
      });
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 flex items-center justify-center">
        <Card className="p-12 text-center bg-white max-w-md">
          <Loader2 className="w-16 h-16 text-blue-600 animate-spin mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-gray-600">
            Đang xác minh thanh toán...
          </h3>
          <p className="text-gray-500 mt-2">
            Vui lòng đợi trong giây lát
          </p>
        </Card>
      </div>
    );
  }

  if (!paymentStatus) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 flex items-center justify-center">
        <Card className="p-12 text-center bg-white max-w-md">
          <XCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-gray-600 mb-2">
            Lỗi thanh toán
          </h3>
          <p className="text-gray-500 mb-6">
            Không thể xác minh thông tin thanh toán
          </p>
          <Button
            onClick={() => onPageChange('home')}
            className="bg-gradient-to-r from-blue-600 to-purple-600 text-white"
          >
            <Home className="w-4 h-4 mr-2" />
            Về trang chủ
          </Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 flex items-center justify-center p-4">
      <Card className="p-8 sm:p-12 text-center bg-white max-w-lg w-full">
        {paymentStatus.success ? (
          <>
            <div className="w-20 h-20 bg-gradient-to-r from-green-400 to-green-600 rounded-full flex items-center justify-center mx-auto mb-6">
              <CheckCircle className="w-12 h-12 text-white" />
            </div>
            <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-3">
              Thanh toán thành công!
            </h2>
            <p className="text-gray-600 mb-6">
              {paymentStatus.message}
            </p>

            {paymentStatus.amount && (
              <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
                <p className="text-sm text-gray-600 mb-1">Số tiền đã thanh toán</p>
                <p className="text-2xl font-bold text-green-600">
                  ₫{paymentStatus.amount.toLocaleString()}
                </p>
              </div>
            )}

            <div className="space-y-3">
              <Button
                onClick={() => onPageChange('orders')}
                className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white h-12"
              >
                Xem đơn hàng của tôi
              </Button>
              <Button
                onClick={() => onPageChange('home')}
                variant="outline"
                className="w-full h-12"
              >
                <Home className="w-4 h-4 mr-2" />
                Về trang chủ
              </Button>
            </div>

            <p className="text-xs text-gray-500 mt-6">
              📧 Chúng tôi đã gửi xác nhận đơn hàng đến email của bạn
            </p>
          </>
        ) : (
          <>
            <div className="w-20 h-20 bg-gradient-to-r from-red-400 to-red-600 rounded-full flex items-center justify-center mx-auto mb-6">
              <XCircle className="w-12 h-12 text-white" />
            </div>
            <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-3">
              Thanh toán thất bại
            </h2>
            <p className="text-gray-600 mb-6">
              {paymentStatus.message}
            </p>

            <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
              <p className="text-sm text-red-800">
                Giao dịch không thành công. Vui lòng thử lại hoặc chọn phương thức thanh toán khác.
              </p>
            </div>

            <div className="space-y-3">
              <Button
                onClick={() => onPageChange('cart')}
                className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white h-12"
              >
                Thử lại
              </Button>
              <Button
                onClick={() => onPageChange('home')}
                variant="outline"
                className="w-full h-12"
              >
                <Home className="w-4 h-4 mr-2" />
                Về trang chủ
              </Button>
            </div>
          </>
        )}
      </Card>
    </div>
  );
}
