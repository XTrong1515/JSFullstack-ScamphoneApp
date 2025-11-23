import { useState } from "react";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Separator } from "../ui/separator";
import { Badge } from "../ui/badge";
import { Minus, Plus, Trash2, ShoppingBag, ArrowLeft, Loader2 } from "lucide-react";
import { Alert, AlertDescription } from "../ui/alert";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "../ui/dialog";
import { Label } from "../ui/label";
import { orderService } from "../../services/orderService";
import { adminService } from "../../services/adminService";
import { useCartStore } from "../../stores/useCartStore";
import { ImageWithFallback } from "../figma/ImageWithFallback";

interface CartItem {
  id: string;
  name: string;
  price: number;
  originalPrice?: number;
  image: string;
  quantity: number;
  discount?: number;
  selectedVariant?: {
    attributes: { [key: string]: string };
    sku: string;
    price: number;
    stock: number;
    image?: string;
  };
}

interface CartPageProps {
  user: any | null;
  onPageChange: (page: string) => void;
}

interface ShippingAddress {
  street: string;
  city: string;
  state: string;
  zipCode: string;
  country: string;
}

export function CartPage({ user, onPageChange }: CartPageProps) {
  const { 
    cartItems, 
    updateQuantity: updateCartQuantity, 
    removeItem: removeCartItem, 
    clearCart,
    setDiscount, 
    removeDiscount, 
    appliedDiscount: storedDiscount 
  } = useCartStore();
  const [promoCode, setPromoCode] = useState("");
  const [appliedDiscount, setAppliedDiscount] = useState<any>(storedDiscount);
  const [discountAmount, setDiscountAmount] = useState(storedDiscount?.discountAmount || 0);
  const [isApplyingDiscount, setIsApplyingDiscount] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string>("");
  const [discountError, setDiscountError] = useState<string>("");
  const [showCheckout, setShowCheckout] = useState(false);
  const [shippingAddress, setShippingAddress] = useState<ShippingAddress>({
    street: "",
    city: "",
    state: "",
    zipCode: "",
    country: "Vietnam"
  });

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND'
    }).format(price);
  };

  const updateQuantity = (id: string, newQuantity: number) => {
    if (newQuantity <= 0) {
      removeItem(id);
      return;
    }
    updateCartQuantity(id, newQuantity);
  };

  const removeItem = (id: string) => {
    removeCartItem(id);
  };

  const handleApplyDiscount = async () => {
    if (!promoCode.trim()) {
      setDiscountError("Vui lòng nhập mã giảm giá");
      return;
    }

    setIsApplyingDiscount(true);
    setDiscountError("");

    try {
      const orderValue = totalAmount;
      console.log('[CartPage] Validating discount:', promoCode, 'for order value:', orderValue);
      const result = await adminService.validateDiscount(
        promoCode.trim(),
        orderValue,
        user?._id
      );

      console.log('[CartPage] Validation result:', result);

      if (result.valid && result.discount) {
        console.log('[CartPage] Setting discount to store:', result.discount);
        
        setAppliedDiscount(result.discount);
        setDiscountAmount(result.discount.discountAmount || 0);
        setDiscountError("");
        
        // Save to Zustand store
        const discountData = {
          code: result.discount.code,
          name: result.discount.name,
          discountAmount: result.discount.discountAmount,
          type: result.discount.type,
          value: result.discount.value
        };
        console.log('[CartPage] Saving to Zustand store:', discountData);
        setDiscount(discountData);
        
        // Verify it was saved
        const currentStore = useCartStore.getState();
        console.log('[CartPage] Store after save:', currentStore.appliedDiscount);
      }
    } catch (err: any) {
      console.error('[CartPage] Discount validation error:', err);
      setDiscountError(err.response?.data?.message || "Mã giảm giá không hợp lệ");
      setAppliedDiscount(null);
      setDiscountAmount(0);
    } finally {
      setIsApplyingDiscount(false);
    }
  };

  const handleRemoveDiscount = () => {
    setAppliedDiscount(null);
    setDiscountAmount(0);
    setPromoCode("");
    setDiscountError("");
    
    // Remove from Zustand store
    removeDiscount();
  };

  const handleCheckout = async () => {
    if (!user) {
      setError("Vui lòng đăng nhập để tiếp tục thanh toán");
      return;
    }

    if (!validateShippingAddress()) {
      return;
    }

    setIsLoading(true);
    setError("");

    try {
      await orderService.createOrder({
        products: cartItems.map(item => ({
          product: item.id,
          quantity: item.quantity
        })),
        shippingAddress
      });

      // Clear cart after successful order
      clearCart();
      setShowCheckout(false);
      onPageChange('home');
    } catch (err: any) {
      setError(err.response?.data?.message || "Có lỗi xảy ra khi tạo đơn hàng. Vui lòng thử lại.");
    } finally {
      setIsLoading(false);
    }
  };

  const validateShippingAddress = () => {
    if (!shippingAddress.street) {
      setError("Vui lòng nhập địa chỉ");
      return false;
    }
    if (!shippingAddress.city) {
      setError("Vui lòng nhập thành phố");
      return false;
    }
    if (!shippingAddress.state) {
      setError("Vui lòng nhập tỉnh/thành phố");
      return false;
    }
    if (!shippingAddress.zipCode) {
      setError("Vui lòng nhập mã bưu điện");
      return false;
    }
    return true;
  };

  const totalAmount = cartItems.reduce((total, item) => total + (item.price * item.quantity), 0);
  const originalAmount = cartItems.reduce((total, item) => {
    const originalPrice = item.originalPrice || item.price;
    return total + (originalPrice * item.quantity);
  }, 0);
  const totalDiscount = originalAmount - totalAmount;
  const shippingFee = totalAmount >= 500000 ? 0 : 30000;
  const afterDiscount = totalAmount - discountAmount;
  const finalAmount = afterDiscount + shippingFee;

  if (cartItems.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="container mx-auto px-3 sm:px-4 py-6 sm:py-8">
          <div className="flex items-center mb-4 sm:mb-6">
            <Button
              variant="ghost"
              onClick={() => onPageChange('home')}
              className="flex items-center space-x-2 text-sm sm:text-base"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Quay lại mua sắm</span>
            </Button>
          </div>
          
          <div className="text-center py-12 sm:py-16">
            <ShoppingBag className="w-20 h-20 sm:w-24 sm:h-24 text-gray-300 mx-auto mb-4 sm:mb-6" />
            <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-3 sm:mb-4">Giỏ hàng của bạn đang trống</h2>
            <p className="text-sm sm:text-base text-gray-600 mb-6 sm:mb-8">Hãy khám phá các sản phẩm tuyệt vời của chúng tôi</p>
            <Button 
              onClick={() => onPageChange('home')}
              className="bg-blue-600 hover:bg-blue-700 w-full sm:w-auto"
            >
              Tiếp tục mua sắm
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-3 sm:px-4 py-6 sm:py-8">
        <div className="flex items-center mb-4 sm:mb-6">
          <Button
            variant="ghost"
            onClick={() => onPageChange('home')}
            className="flex items-center space-x-2 text-sm sm:text-base"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Tiếp tục mua sắm</span>
          </Button>
        </div>

        <h1 className="text-2xl sm:text-3xl font-bold mb-6 sm:mb-8">
          Giỏ hàng của bạn 
          <span className="text-blue-600 ml-2">({cartItems.length} sản phẩm)</span>
        </h1>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6 lg:gap-8">
          {/* Cart Items */}
          <div className="lg:col-span-2 space-y-3 sm:space-y-4">
            {cartItems.map((item) => (
              <Card key={item.id} className="shadow-sm hover:shadow-md transition-shadow">
                <CardContent className="p-3 sm:p-4 md:p-6">
                  <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 sm:gap-4">
                    <ImageWithFallback
                      src={item.image}
                      alt={item.name}
                      className="w-20 h-20 sm:w-24 sm:h-24 object-cover rounded-lg flex-shrink-0"
                    />
                    
                    <div className="flex-1 w-full sm:w-auto">
                      <h3 className="font-medium text-sm sm:text-base text-gray-900 mb-2 line-clamp-2">{item.name}</h3>
                      {item.selectedVariant && item.selectedVariant.attributes && Object.keys(item.selectedVariant.attributes).length > 0 && (
                        <p className="text-xs text-gray-600 mb-2">
                          📦 {Object.entries(item.selectedVariant.attributes).map(([key, value]) => value).join(', ')}
                        </p>
                      )}
                      <div className="flex flex-wrap items-center gap-2 mb-3">
                        <span className="text-base sm:text-lg font-bold text-blue-600">
                          {formatPrice(item.price)}
                        </span>
                        {item.originalPrice && (
                          <>
                            <span className="text-xs sm:text-sm text-gray-500 line-through">
                              {formatPrice(item.originalPrice)}
                            </span>
                            {item.discount && (
                              <Badge className="bg-red-500 text-white text-xs">
                                -{item.discount}%
                              </Badge>
                            )}
                          </>
                        )}
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => updateQuantity(item.id, item.quantity - 1)}
                            className="w-7 h-7 sm:w-8 sm:h-8 p-0"
                          >
                            <Minus className="w-3 h-3 sm:w-4 sm:h-4" />
                          </Button>
                          <Input
                            type="number"
                            value={item.quantity}
                            onChange={(e) => updateQuantity(item.id, parseInt(e.target.value) || 1)}
                            className="w-28 sm:w-32 text-center text-sm h-7 sm:h-8"
                            min="1"
                          />
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => updateQuantity(item.id, item.quantity + 1)}
                            className="w-7 h-7 sm:w-8 sm:h-8 p-0"
                          >
                            <Plus className="w-3 h-3 sm:w-4 sm:h-4" />
                          </Button>
                        </div>
                        
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => removeItem(item.id)}
                          className="text-red-600 hover:text-red-700 hover:bg-red-50"
                        >
                          <Trash2 className="w-4 h-4" />
                          <span className="ml-1 sm:inline hidden">Xóa</span>
                        </Button>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Order Summary */}
          <div className="lg:col-span-1">
            <Card className="sticky top-4 sm:top-8 shadow-md">
              <CardHeader className="p-4 sm:p-6">
                <CardTitle className="text-lg sm:text-xl">Tóm tắt đơn hàng</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 sm:space-y-4 p-4 sm:p-6 pt-0">
                <div className="flex justify-between text-sm sm:text-base">
                  <span>Tạm tính:</span>
                  <span className="font-semibold">{formatPrice(totalAmount)}</span>
                </div>
                
                {totalDiscount > 0 && (
                  <div className="flex justify-between text-green-600 text-sm sm:text-base">
                    <span>💰 Tiết kiệm:</span>
                    <span className="font-semibold">-{formatPrice(totalDiscount)}</span>
                  </div>
                )}
                
                {appliedDiscount && discountAmount > 0 && (
                  <div className="flex justify-between text-green-600 text-sm sm:text-base">
                    <span>🎟️ Mã giảm giá ({appliedDiscount.code}):</span>
                    <span className="font-semibold">-{formatPrice(discountAmount)}</span>
                  </div>
                )}
                
                <div className="flex justify-between text-sm sm:text-base">
                  <span>Phí vận chuyển:</span>
                  <span className={`font-semibold ${shippingFee === 0 ? "text-green-600" : ""}`}>
                    {shippingFee === 0 ? "Miễn phí" : formatPrice(shippingFee)}
                  </span>
                </div>
                
                {totalAmount < 500000 && (
                  <div className="bg-blue-50 p-2.5 sm:p-3 rounded-lg">
                    <p className="text-xs sm:text-sm text-blue-600">
                      🚚 Mua thêm {formatPrice(500000 - totalAmount)} để được miễn phí vận chuyển
                    </p>
                  </div>
                )}
                
                <Separator />
                
                <div className="flex justify-between text-base sm:text-lg font-bold">
                  <span>Tổng cộng:</span>
                  <span className="text-blue-600">{formatPrice(finalAmount)}</span>
                </div>
                
                <div className="space-y-2 sm:space-y-3">
                  {appliedDiscount ? (
                    <div className="flex items-center gap-2 p-3 bg-green-50 border border-green-200 rounded-lg">
                      <div className="flex-1">
                        <p className="text-sm font-medium text-green-700">
                          ✓ Đã áp dụng: {appliedDiscount.name}
                        </p>
                        <p className="text-xs text-green-600">
                          Giảm {formatPrice(discountAmount)}
                        </p>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={handleRemoveDiscount}
                        className="text-red-600 hover:text-red-700"
                      >
                        Xóa
                      </Button>
                    </div>
                  ) : (
                    <>
                      <div className="flex gap-2">
                        <Input
                          placeholder="Mã giảm giá"
                          value={promoCode}
                          onChange={(e) => {
                            setPromoCode(e.target.value);
                            setDiscountError("");
                          }}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              handleApplyDiscount();
                            }
                          }}
                          disabled={isApplyingDiscount}
                          className="text-sm"
                        />
                        <Button 
                          variant="outline" 
                          className="text-sm whitespace-nowrap"
                          onClick={handleApplyDiscount}
                          disabled={isApplyingDiscount || !promoCode.trim()}
                        >
                          {isApplyingDiscount ? (
                            <>
                              <Loader2 className="mr-1 h-3 w-3 animate-spin" />
                              Đang kiểm tra...
                            </>
                          ) : (
                            'Áp dụng'
                          )}
                        </Button>
                      </div>
                      {discountError && (
                        <Alert variant="destructive" className="py-2">
                          <AlertDescription className="text-xs">{discountError}</AlertDescription>
                        </Alert>
                      )}
                    </>
                  )}
                  
          <Button 
            className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-sm sm:text-base py-5 sm:py-6 shadow-lg hover:shadow-xl transition-all" 
            size="lg"
            onClick={() => {
              if (!user) {
                setError("Vui lòng đăng nhập để tiếp tục thanh toán");
                return;
              }
              // Navigate to checkout page
              onPageChange('checkout');
            }}
            disabled={isLoading || cartItems.length === 0}
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Đang xử lý...
              </>
            ) : (
              '🛒 Tiến hành thanh toán'
            )}
          </Button>                  <Button 
                    variant="outline" 
                    className="w-full text-sm sm:text-base"
                    onClick={() => onPageChange('home')}
                  >
                    Tiếp tục mua sắm
                  </Button>
                </div>
                
                <div className="text-xs sm:text-sm text-gray-600 space-y-1.5 sm:space-y-2 bg-gray-50 p-3 rounded-lg">
                  <div className="flex items-start gap-2">
                    <span className="text-green-600 flex-shrink-0">✓</span>
                    <span>Miễn phí đổi trả trong 30 ngày</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <span className="text-green-600 flex-shrink-0">✓</span>
                    <span>Bảo hành chính hãng</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <span className="text-green-600 flex-shrink-0">✓</span>
                    <span>Hỗ trợ kỹ thuật 24/7</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      <Dialog open={showCheckout} onOpenChange={setShowCheckout}>
        <DialogContent className="sm:max-w-[425px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-lg sm:text-xl">Thông tin giao hàng</DialogTitle>
            <DialogDescription className="text-sm">
              Vui lòng nhập thông tin giao hàng chính xác
            </DialogDescription>
          </DialogHeader>

          {error && (
            <Alert variant="destructive">
              <AlertDescription className="text-sm">{error}</AlertDescription>
            </Alert>
          )}

          <div className="grid gap-3 sm:gap-4 py-3 sm:py-4">
            <div className="grid gap-1.5 sm:gap-2">
              <Label htmlFor="street" className="text-sm">Địa chỉ <span className="text-red-500">*</span></Label>
              <Input
                id="street"
                value={shippingAddress.street}
                onChange={(e) => setShippingAddress({...shippingAddress, street: e.target.value})}
                placeholder="Số nhà, tên đường"
                className="text-sm"
              />
            </div>
            <div className="grid gap-1.5 sm:gap-2">
              <Label htmlFor="city" className="text-sm">Quận/Huyện <span className="text-red-500">*</span></Label>
              <Input
                id="city"
                value={shippingAddress.city}
                onChange={(e) => setShippingAddress({...shippingAddress, city: e.target.value})}
                placeholder="Quận/Huyện"
                className="text-sm"
              />
            </div>
            <div className="grid gap-1.5 sm:gap-2">
              <Label htmlFor="state" className="text-sm">Tỉnh/Thành phố <span className="text-red-500">*</span></Label>
              <Input
                id="state"
                value={shippingAddress.state}
                onChange={(e) => setShippingAddress({...shippingAddress, state: e.target.value})}
                placeholder="Tỉnh/Thành phố"
                className="text-sm"
              />
            </div>
            <div className="grid gap-1.5 sm:gap-2">
              <Label htmlFor="zipCode" className="text-sm">Mã bưu điện <span className="text-red-500">*</span></Label>
              <Input
                id="zipCode"
                value={shippingAddress.zipCode}
                onChange={(e) => setShippingAddress({...shippingAddress, zipCode: e.target.value})}
                placeholder="Mã bưu điện"
                className="text-sm"
              />
            </div>
          </div>
          <DialogFooter className="flex-col sm:flex-row gap-2">
            <Button variant="outline" onClick={() => setShowCheckout(false)} className="w-full sm:w-auto text-sm">
              Hủy
            </Button>
            <Button onClick={handleCheckout} disabled={isLoading} className="w-full sm:w-auto text-sm">
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Đang xử lý...
                </>
              ) : (
                'Xác nhận đặt hàng'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}