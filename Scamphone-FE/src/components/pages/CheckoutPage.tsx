import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  ShoppingBag,
  MapPin,
  Phone,
  User,
  Home,
  ChevronRight,
  Loader2,
  Package
} from "lucide-react";
import { Card } from "../ui/card";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { useCartStore } from "../../stores/useCartStore";
import { addressService, Address } from "../../services/addressService";

interface CartItem {
  _id?: string;
  id?: string;
  name: string;
  price: number;
  originalPrice?: number;
  quantity: number;
  image?: string;
  selectedVariant?: {
    attributes: { [key: string]: string };
    sku: string;
    price: number;
    stock: number;
    image?: string;
  };
}

interface CheckoutPageProps {
  onPageChange: (page: string, data?: any) => void;
  cartItems: CartItem[];
  user: any;
}

export function CheckoutPage({ onPageChange, cartItems: initialCartItems, user }: CheckoutPageProps) {
  const { appliedDiscount } = useCartStore();
  const [cartItems, setCartItems] = useState<CartItem[]>(initialCartItems || []);
  const [loading, setLoading] = useState(false);
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [selectedAddressId, setSelectedAddressId] = useState<string>("");
  const [useNewAddress, setUseNewAddress] = useState(false);

  // Shipping address form
  const [shippingInfo, setShippingInfo] = useState({
    fullName: "",
    phone: "",
    address: "",
    city: "",
    district: ""
  });

  useEffect(() => {
    // Update cart if props change
    if (initialCartItems && initialCartItems.length > 0) {
      setCartItems(initialCartItems);
    }

    // Load saved addresses
    loadAddresses();

    // Load saved shipping info if exists
    const savedShippingInfo = localStorage.getItem("shippingInfo");
    if (savedShippingInfo) {
      setShippingInfo(JSON.parse(savedShippingInfo));
    }
  }, [initialCartItems]);

  const loadAddresses = async () => {
    try {
      const data = await addressService.getAddresses();
      setAddresses(data);
      
      // Auto-select default address
      const defaultAddr = data.find(addr => addr.isDefault);
      if (defaultAddr && defaultAddr._id) {
        setSelectedAddressId(defaultAddr._id);
        setShippingInfo({
          fullName: defaultAddr.fullName,
          phone: defaultAddr.phone,
          address: `${defaultAddr.address}, ${defaultAddr.ward}, ${defaultAddr.district}`,
          city: defaultAddr.city,
          district: defaultAddr.district
        });
      } else if (data.length === 0) {
        setUseNewAddress(true);
      }
    } catch (error) {
      console.error('Failed to load addresses:', error);
      setUseNewAddress(true);
    }
  };

  const calculateSubtotal = () => {
    return cartItems.reduce((sum, item) => sum + item.price * item.quantity, 0);
  };

  const shippingFee = 0; // Miễn phí vận chuyển
  const discountAmount = appliedDiscount?.discountAmount || 0;
  const total = calculateSubtotal() - discountAmount + shippingFee;

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setShippingInfo(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const validateForm = () => {
    if (!shippingInfo.fullName.trim()) {
      alert("Vui lòng nhập họ và tên");
      return false;
    }
    if (!shippingInfo.phone.trim()) {
      alert("Vui lòng nhập số điện thoại");
      return false;
    }
    if (!/^[0-9]{10,11}$/.test(shippingInfo.phone.trim())) {
      alert("Số điện thoại không hợp lệ");
      return false;
    }
    if (!shippingInfo.address.trim()) {
      alert("Vui lòng nhập địa chỉ");
      return false;
    }
    return true;
  };

  const handleProceedToPayment = () => {
    if (!validateForm()) return;

    if (cartItems.length === 0) {
      alert("Giỏ hàng trống!");
      return;
    }

    // Save shipping info
    localStorage.setItem("shippingInfo", JSON.stringify(shippingInfo));

    // Navigate to payment page
    onPageChange('payment', {
      cartItems,
      shippingInfo,
      totalPrice: total
    });
  };

  if (cartItems.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 flex items-center justify-center">
        <Card className="p-12 text-center bg-white max-w-md">
          <ShoppingBag className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-gray-600 mb-2">
            Giỏ hàng trống
          </h3>
          <p className="text-gray-500 mb-6">
            Bạn chưa có sản phẩm nào trong giỏ hàng
          </p>
          <Button
            onClick={() => onPageChange('home')}
            className="bg-gradient-to-r from-blue-600 to-purple-600 text-white"
          >
            Tiếp tục mua sắm
          </Button>
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
              onClick={() => onPageChange('cart')}
              className="flex items-center gap-2"
            >
              <Home className="w-4 h-4" />
              Quay lại giỏ hàng
            </Button>
            <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              Xác nhận đơn hàng
            </h1>
            <div className="w-[140px]"></div>
          </div>

          {/* Progress indicator */}
          <div className="flex items-center justify-center gap-2 text-sm">
            <div className="flex items-center gap-2 text-gray-400">
              <ShoppingBag className="w-4 h-4" />
              <span>Giỏ hàng</span>
            </div>
            <ChevronRight className="w-4 h-4 text-gray-400" />
            <div className="flex items-center gap-2 text-blue-600 font-medium">
              <MapPin className="w-4 h-4" />
              <span>Xác nhận thông tin</span>
            </div>
            <ChevronRight className="w-4 h-4 text-gray-400" />
            <div className="flex items-center gap-2 text-gray-400">
              <Package className="w-4 h-4" />
              <span>Thanh toán</span>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Shipping Address Form */}
          <div className="lg:col-span-2 space-y-6">
            <Card className="p-6 bg-white">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-full bg-gradient-to-r from-blue-600 to-purple-600 flex items-center justify-center">
                  <MapPin className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-gray-900">Địa chỉ giao hàng</h2>
                  <p className="text-sm text-gray-600">Vui lòng nhập thông tin chính xác</p>
                </div>
              </div>

              {/* Address Selector */}
              {addresses.length > 0 && (
                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Chọn địa chỉ có sẵn
                  </label>
                  <select
                    value={selectedAddressId}
                    onChange={(e) => {
                      const addressId = e.target.value;
                      if (addressId === "new") {
                        setUseNewAddress(true);
                        setSelectedAddressId("");
                        setShippingInfo({
                          fullName: "",
                          phone: "",
                          address: "",
                          city: "",
                          district: ""
                        });
                      } else {
                        setUseNewAddress(false);
                        setSelectedAddressId(addressId);
                        const selected = addresses.find(a => a._id === addressId);
                        if (selected) {
                          setShippingInfo({
                            fullName: selected.fullName,
                            phone: selected.phone,
                            address: `${selected.address}, ${selected.ward}, ${selected.district}`,
                            city: selected.city,
                            district: selected.district
                          });
                        }
                      }
                    }}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    {addresses.map((addr) => (
                      <option key={addr._id} value={addr._id}>
                        {addr.fullName} - {addr.phone} - {addr.address}, {addr.ward}, {addr.district}, {addr.city}
                        {addr.isDefault && " (Mặc định)"}
                      </option>
                    ))}
                    <option value="new">+ Thêm địa chỉ mới</option>
                  </select>
                </div>
              )}

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <User className="w-4 h-4 inline mr-1" />
                    Họ và tên <span className="text-red-500">*</span>
                  </label>
                  <Input
                    name="fullName"
                    value={shippingInfo.fullName}
                    onChange={handleInputChange}
                    placeholder="Nguyễn Văn A"
                    className="h-11"
                    disabled={!useNewAddress && selectedAddressId !== ""}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <Phone className="w-4 h-4 inline mr-1" />
                    Số điện thoại <span className="text-red-500">*</span>
                  </label>
                  <Input
                    name="phone"
                    value={shippingInfo.phone}
                    onChange={handleInputChange}
                    placeholder="0912345678"
                    className="h-11"
                    disabled={!useNewAddress && selectedAddressId !== ""}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <Home className="w-4 h-4 inline mr-1" />
                    Địa chỉ <span className="text-red-500">*</span>
                  </label>
                  <Input
                    name="address"
                    value={shippingInfo.address}
                    onChange={handleInputChange}
                    placeholder="Số nhà, tên đường"
                    className="h-11"
                    disabled={!useNewAddress && selectedAddressId !== ""}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Quận/Huyện
                    </label>
                    <Input
                      name="district"
                      value={shippingInfo.district}
                      onChange={handleInputChange}
                      placeholder="Quận 1"
                      className="h-11"
                      disabled={!useNewAddress && selectedAddressId !== ""}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Tỉnh/Thành phố
                    </label>
                    <Input
                      name="city"
                      value={shippingInfo.city}
                      onChange={handleInputChange}
                      placeholder="TP. Hồ Chí Minh"
                      className="h-11"
                      disabled={!useNewAddress && selectedAddressId !== ""}
                    />
                  </div>
                </div>
              </div>
            </Card>

            {/* Order Items */}
            <Card className="p-6 bg-white">
              <h2 className="text-xl font-bold text-gray-900 mb-4">
                Sản phẩm đã chọn ({cartItems.length})
              </h2>
              <div className="space-y-3">
                {cartItems.map((item) => (
                  <div key={item._id || item.id} className="flex gap-4 p-3 bg-gray-50 rounded-lg">
                    {item.image && (
                      <img
                        src={item.image}
                        alt={item.name}
                        className="w-20 h-20 object-cover rounded border"
                      />
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-gray-900 truncate">{item.name}</p>
                      {item.selectedVariant && item.selectedVariant.attributes && Object.keys(item.selectedVariant.attributes).length > 0 && (
                        <p className="text-xs text-gray-600 mt-1">
                          📦 {Object.entries(item.selectedVariant.attributes).map(([key, value]) => value).join(', ')}
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
            </Card>
          </div>

          {/* Order Summary */}
          <div className="lg:col-span-1">
            <Card className="p-6 bg-white sticky top-24">
              <h2 className="text-xl font-bold text-gray-900 mb-4">Tóm tắt đơn hàng</h2>

              <div className="space-y-3 mb-4">
                <div className="flex justify-between text-gray-600">
                  <span>Tạm tính:</span>
                  <span className="font-medium">₫{calculateSubtotal().toLocaleString()}</span>
                </div>
                {appliedDiscount && discountAmount > 0 && (
                  <div className="flex justify-between text-green-600">
                    <span>🎟️ Giảm giá ({appliedDiscount.code}):</span>
                    <span className="font-medium">-₫{discountAmount.toLocaleString()}</span>
                  </div>
                )}
                <div className="flex justify-between text-gray-600">
                  <span>Phí vận chuyển:</span>
                  <span className="font-medium text-green-600">Miễn phí</span>
                </div>
                <div className="border-t pt-3">
                  <div className="flex justify-between items-center">
                    <span className="text-lg font-semibold text-gray-900">Tổng cộng:</span>
                    <span className="text-2xl font-bold text-blue-600">
                      ₫{total.toLocaleString()}
                    </span>
                  </div>
                </div>
              </div>

              <Button
                onClick={handleProceedToPayment}
                disabled={loading}
                className="w-full h-12 bg-gradient-to-r from-blue-600 to-purple-600 text-white font-medium text-lg"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                    Đang xử lý...
                  </>
                ) : (
                  "Tiếp tục thanh toán"
                )}
              </Button>

              <div className="mt-4 p-3 bg-blue-50 rounded-lg">
                <p className="text-xs text-blue-800 text-center">
                  🔒 Thông tin của bạn được bảo mật an toàn
                </p>
              </div>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
