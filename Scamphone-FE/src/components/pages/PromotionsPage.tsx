import { useState, useEffect } from "react";
import { Card } from "../ui/card";
import { Badge } from "../ui/badge";
import { Button } from "../ui/button";
import { Loader2, Gift, Calendar, Tag, Percent, Copy, Check } from "lucide-react";
import { adminService } from "../../services/adminService";

interface Promotion {
  _id: string;
  name: string;
  code: string;
  type: "percentage" | "fixed_amount" | "free_shipping";
  value: number;
  maxDiscount?: number;
  minOrderValue?: number;
  startDate: string;
  endDate: string;
  maxUses?: number;
  maxUsesPerUser?: number;
  usedCount: number;
  status: "active" | "inactive" | "expired";
  description?: string;
}

interface PromotionsPageProps {
  onPageChange: (page: string) => void;
}

export function PromotionsPage({ onPageChange }: PromotionsPageProps) {
  const [promotions, setPromotions] = useState<Promotion[]>([]);
  const [loading, setLoading] = useState(true);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  useEffect(() => {
    loadPromotions();
  }, []);

  const loadPromotions = async () => {
    try {
      setLoading(true);
      const response = await adminService.getAdminDiscounts();
      console.log('[PROMOTIONS] Raw response:', response);
      console.log('[PROMOTIONS] Discounts array:', response.discounts);
      
      // Lấy tất cả khuyến mãi, không lọc status để debug
      const allPromos = response.discounts || [];
      console.log('[PROMOTIONS] All promos:', allPromos);
      console.log('[PROMOTIONS] Total count:', allPromos.length);
      
      // Chỉ lấy các khuyến mãi active và chưa hết hạn
      const activePromos = allPromos.filter(
        (promo: Promotion) => {
          const isActive = promo.status === "active";
          const notExpired = new Date(promo.endDate) > new Date();
          console.log(`[PROMO] ${promo.code}: status=${promo.status} isActive=${isActive} notExpired=${notExpired}`);
          return isActive && notExpired;
        }
      );
      console.log('[PROMOTIONS] Active promos after filter:', activePromos);
      setPromotions(activePromos);
    } catch (error) {
      console.error('Error loading promotions:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCopyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('vi-VN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const getDiscountText = (promo: Promotion) => {
    if (promo.type === "percentage") {
      return `Giảm ${promo.value}%`;
    } else if (promo.type === "free_shipping") {
      return "Miễn phí vận chuyển";
    }
    return `Giảm ₫${promo.value.toLocaleString()}`;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 py-8">
      <div className="container mx-auto px-4">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center justify-center space-x-3 mb-4">
            <Gift className="w-12 h-12 text-red-500" />
            <h1 className="text-4xl font-bold bg-gradient-to-r from-red-600 to-pink-600 bg-clip-text text-transparent">
              Khuyến Mãi Đặc Biệt
            </h1>
          </div>
          <p className="text-gray-600 text-lg">
            Cập nhật các chương trình khuyến mãi hấp dẫn nhất hiện nay
          </p>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-10 h-10 animate-spin text-blue-600" />
          </div>
        ) : promotions.length === 0 ? (
          <Card className="p-12 text-center">
            <Gift className="w-16 h-16 mx-auto text-gray-400 mb-4" />
            <h3 className="text-xl font-semibold text-gray-700 mb-2">
              Hiện tại chưa có chương trình khuyến mãi nào
            </h3>
            <p className="text-gray-500 mb-6">
              Vui lòng quay lại sau để không bỏ lỡ các ưu đãi hấp dẫn!
            </p>
            <Button onClick={() => onPageChange('home')}>
              Quay về trang chủ
            </Button>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {promotions.map((promo) => {
              const isExpiringSoon = new Date(promo.endDate).getTime() - new Date().getTime() < 7 * 24 * 60 * 60 * 1000;
              const usagePercent = promo.maxUses ? (promo.usedCount / promo.maxUses) * 100 : 0;
              const isAlmostFull = usagePercent > 80;

              return (
                <Card 
                  key={promo._id} 
                  className="relative overflow-hidden hover:shadow-xl transition-all duration-300 border-2 hover:border-blue-400"
                >
                  {/* Decorative corner */}
                  <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-br from-red-500 to-pink-500 opacity-10 rounded-bl-full" />
                  
                  <div className="p-6 space-y-4">
                    {/* Badge */}
                    <div className="flex items-start justify-between">
                      <Badge className="bg-gradient-to-r from-red-500 to-pink-500 text-white px-3 py-1 text-sm font-semibold">
                        <Percent className="w-3 h-3 mr-1" />
                        {getDiscountText(promo)}
                      </Badge>
                      {isExpiringSoon && (
                        <Badge variant="outline" className="border-orange-500 text-orange-600 text-xs">
                          ⏰ Sắp hết hạn
                        </Badge>
                      )}
                    </div>

                    {/* Description */}
                    <div>
                      <h3 className="font-bold text-lg text-gray-800 mb-2">
                        {promo.name || promo.description || 'Chương trình khuyến mãi'}
                      </h3>
                      
                      {/* Conditions */}
                      <div className="space-y-1 text-sm text-gray-600">
                        {promo.minOrderValue && (
                          <div className="flex items-center space-x-2">
                            <Tag className="w-4 h-4 text-blue-500" />
                            <span>Đơn tối thiểu: ₫{promo.minOrderValue.toLocaleString()}</span>
                          </div>
                        )}
                        {promo.maxDiscount && promo.type === "percentage" && (
                          <div className="flex items-center space-x-2">
                            <Tag className="w-4 h-4 text-blue-500" />
                            <span>Giảm tối đa: ₫{promo.maxDiscount.toLocaleString()}</span>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Code */}
                    <div className="relative">
                      <div className="flex items-center justify-between bg-gradient-to-r from-blue-50 to-purple-50 border-2 border-dashed border-blue-300 rounded-lg p-3">
                        <div className="flex items-center space-x-2">
                          <Tag className="w-4 h-4 text-blue-600" />
                          <code className="font-mono font-bold text-blue-600 text-lg">
                            {promo.code}
                          </code>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleCopyCode(promo.code)}
                          className="hover:bg-blue-100"
                        >
                          {copiedCode === promo.code ? (
                            <Check className="w-4 h-4 text-green-600" />
                          ) : (
                            <Copy className="w-4 h-4 text-blue-600" />
                          )}
                        </Button>
                      </div>
                      {copiedCode === promo.code && (
                        <span className="absolute -bottom-6 left-0 text-xs text-green-600 font-medium">
                          ✓ Đã sao chép mã!
                        </span>
                      )}
                    </div>

                    {/* Date range */}
                    <div className="flex items-center space-x-2 text-sm text-gray-500 pt-2">
                      <Calendar className="w-4 h-4" />
                      <span>
                        HSD: {formatDate(promo.startDate)} - {formatDate(promo.endDate)}
                      </span>
                    </div>

                    {/* Usage limit */}
                    {promo.maxUses && (
                      <div className="space-y-1">
                        <div className="flex justify-between text-xs text-gray-600">
                          <span>Đã sử dụng: {promo.usedCount}/{promo.maxUses}</span>
                          <span>{usagePercent.toFixed(0)}%</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div
                            className={`h-2 rounded-full transition-all ${
                              isAlmostFull ? 'bg-orange-500' : 'bg-blue-500'
                            }`}
                            style={{ width: `${Math.min(usagePercent, 100)}%` }}
                          />
                        </div>
                        {isAlmostFull && (
                          <p className="text-xs text-orange-600 font-medium">
                            ⚠️ Số lượng có hạn, nhanh tay!
                          </p>
                        )}
                      </div>
                    )}

                    {/* CTA */}
                    <Button
                      className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-semibold"
                      onClick={() => onPageChange('home')}
                    >
                      Mua ngay
                    </Button>
                  </div>
                </Card>
              );
            })}
          </div>
        )}

        {/* Back button */}
        {!loading && promotions.length > 0 && (
          <div className="text-center mt-12">
            <Button
              variant="outline"
              onClick={() => onPageChange('home')}
              className="px-8"
            >
              ← Quay về trang chủ
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
