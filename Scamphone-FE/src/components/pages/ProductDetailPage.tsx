import { useState, useRef, useEffect } from "react";
import { Button } from "../ui/button";
import { Badge } from "../ui/badge";
import { Separator } from "../ui/separator";
import { Alert, AlertDescription } from "../ui/alert";
import { Textarea } from "../ui/textarea";
import { Label } from "../ui/label";
import { Loader2 } from "lucide-react";
import { reviewService, Review } from "../../services/reviewService";
import { socialService, SocialStats } from "../../services/socialService";
import { productService } from "../../services/productService";
import { Card, CardContent } from "../ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../ui/tabs";
import { CommentSection } from "../CommentSection";
import { ShareDialog } from "../ShareDialog";
import { FavoriteButton } from "../FavoriteButton";
import { 
  Star, 
  ShoppingCart, 
  Heart, 
  Share2, 
  ArrowLeft,
  Truck,
  Shield,
  RotateCcw,
  Phone,
  Check,
  Minus,
  Plus
} from "lucide-react";
import { ImageWithFallback } from "../figma/ImageWithFallback";
import { AddToCartAnimation } from "../AddToCartAnimation";

interface Product {
  id?: string;
  _id: string;
  name: string;
  price: number;
  originalPrice?: number;
  image: string;
  rating: number;
  discount?: number;
  isHot?: boolean;
  description?: string;
  specifications?: { [key: string]: string };
  images?: string[];
  status?: 'active' | 'inactive' | 'out_of_stock';
  stock_quantity?: number;
  attributes?: Array<{ name: string; values: string[] }>;
  variants?: Array<{
    attributes: { [key: string]: string };
    price: number;
    originalPrice?: number;
    stock: number;
    sku?: string;
    image?: string;
  }>;
}

interface ProductDetailPageProps {
  product: Product;
  user: any | null;
  onPageChange: (page: string) => void;
  onAddToCart: (product: Product) => void;
}

interface ReviewFormData {
  rating: number;
  comment: string;
}

export function ProductDetailPage({ product: initialProduct, user, onPageChange, onAddToCart }: ProductDetailPageProps) {
  const [product, setProduct] = useState<Product>(initialProduct);
  const [isLoadingProduct, setIsLoadingProduct] = useState(false);
  const [selectedImage, setSelectedImage] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const reviewsRef = useRef<HTMLDivElement>(null);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [totalReviews, setTotalReviews] = useState(0);
  const [isLoadingReviews, setIsLoadingReviews] = useState(false);
  const [reviewError, setReviewError] = useState<string>('');
  const [reviewSuccess, setReviewSuccess] = useState<boolean>(false);
  const [isSubmittingReview, setIsSubmittingReview] = useState(false);
  const [isShareDialogOpen, setIsShareDialogOpen] = useState(false);
  const [isFavorited, setIsFavorited] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [socialStats, setSocialStats] = useState<SocialStats>({
    commentCount: 0,
    favoriteCount: 0,
    shareCount: 0,
    userHasLiked: false,
    userHasFavorited: false
  });
  const [reviewForm, setReviewForm] = useState<ReviewFormData>({
    rating: 5,
    comment: ''
  });
  
  // Dynamic variant selection state
  const [selectedAttributes, setSelectedAttributes] = useState<{ [key: string]: string }>({});
  const [selectedVariant, setSelectedVariant] = useState<{
    attributes: { [key: string]: string };
    price: number;
    originalPrice?: number;
    stock: number;
    sku?: string;
    image?: string;
  } | null>(null);
  
  const [selectedColor, setSelectedColor] = useState("Đen");
  const [selectedStorage, setSelectedStorage] = useState("256GB");
  const [triggerAnimation, setTriggerAnimation] = useState(false);
  const buttonRef = useRef<HTMLButtonElement>(null);

  // Fetch full product details from API
  useEffect(() => {
    const fetchProductDetails = async () => {
      try {
        setIsLoadingProduct(true);
        const productId = (initialProduct._id || initialProduct.id) as string;
        console.log('🔍 Fetching product with ID:', productId);
        const fullProduct = await productService.getProductById(productId);
        console.log('✅ Full product fetched:', fullProduct);
        console.log('📦 Attributes:', fullProduct.attributes);
        console.log('🎨 Variants:', fullProduct.variants);
        console.log('🖼️ Images:', fullProduct.images);
        setProduct(fullProduct as Product);
      } catch (err) {
        console.error('❌ Error fetching product:', err);
        // Fall back to initial product if fetch fails
        setProduct(initialProduct);
      } finally {
        setIsLoadingProduct(false);
      }
    };
    
    fetchProductDetails();
  }, [initialProduct._id, initialProduct.id]);

  // Initialize selected attributes and variant
  useEffect(() => {
    if (product.attributes && product.attributes.length > 0 && product.variants && product.variants.length > 0) {
      // Set default selected attributes (first value of each attribute)
      const defaultAttrs: { [key: string]: string } = {};
      product.attributes.forEach(attr => {
        if (attr.values && attr.values.length > 0) {
          defaultAttrs[attr.name] = attr.values[0];
        }
      });
      setSelectedAttributes(defaultAttrs);
      
      // Find matching variant
      const variant = product.variants.find(v => 
        JSON.stringify(v.attributes) === JSON.stringify(defaultAttrs)
      );
      setSelectedVariant(variant || null);
    }
  }, [product]);

  // Update selected variant when attributes change
  const handleAttributeSelect = (attrName: string, value: string) => {
    const newAttrs = { ...selectedAttributes, [attrName]: value };
    setSelectedAttributes(newAttrs);
    
    // Find matching variant
    const variant = product.variants?.find(v => 
      JSON.stringify(v.attributes) === JSON.stringify(newAttrs)
    );
    setSelectedVariant(variant || null);
  };

  // Get current price from variant or product
  const getCurrentPrice = () => {
    if (selectedVariant) {
      return selectedVariant.price;
    }
    return product.price;
  };

  const getCurrentOriginalPrice = () => {
    if (selectedVariant) {
      return selectedVariant.originalPrice || selectedVariant.price;
    }
    return product.originalPrice || product.price;
  };

  const getCurrentStock = () => {
    if (selectedVariant) {
      return selectedVariant.stock;
    }
    return 999; // Default for products without variants
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND'
    }).format(price);
  };

  // Validate and prepare images array
  const images = (() => {
    const imageArray = product.images && product.images.length > 0 
      ? product.images 
      : product.image 
      ? [product.image] 
      : [];
    
    // Filter out invalid URLs (empty strings, null, undefined)
    const validImages = imageArray.filter(img => 
      img && 
      typeof img === 'string' && 
      img.trim() !== '' &&
      (img.startsWith('http://') || img.startsWith('https://') || img.startsWith('data:'))
    );
    
    return validImages.length > 0 
      ? validImages 
      : ['https://via.placeholder.com/400x400?text=No+Image'];
  })();
  
  // Remove hardcoded colors/storage - will use dynamic attributes
  // const colors = ["Đen", "Trắng", "Xanh", "Tím"];
  // const storageOptions = ["128GB", "256GB", "512GB", "1TB"];

  const specifications = product.specifications || {
    "Màn hình": "6.7 inch, Super Retina XDR",
    "Chip": "A17 Pro",
    "Camera": "48MP + 12MP + 12MP",
    "RAM": "8GB",
    "Dung lượng": "256GB",
    "Pin": "4422 mAh",
    "Hệ điều hành": "iOS 17"
  };

  useEffect(() => {
    loadReviews();
    loadSocialData();
  }, [product._id || product.id, user?._id]);

  const loadSocialData = async () => {
    try {
      const productId = (product._id || product.id) as string;
      const stats = await socialService.getProductSocialStats(productId);
      setSocialStats(stats);
      setIsFavorited(stats.userHasFavorited);
    } catch (err: any) {
      console.error('Error loading social stats:', err);
      // Only show error toast for network errors, not auth errors
      if (err.code !== 401) {
        setError(err.message || 'Không thể tải thông tin tương tác');
      }
    }
  };

  useEffect(() => {
    // Reset state when user changes
    if (!user) {
      setIsFavorited(false);
      setSocialStats(prev => ({
        ...prev,
        userHasLiked: false,
        userHasFavorited: false
      }));
    }
  }, [user]);

  const checkFavoriteStatus = async () => {
    if (user) {
      try {
        const productId = (product._id || product.id) as string;
        const isFav = await socialService.isProductFavorited(productId);
        setIsFavorited(isFav);
      } catch (err) {
        console.error('Error checking favorite status:', err);
      }
    }
  };

  const loadReviews = async () => {
    setIsLoadingReviews(true);
    try {
      const productId = (product._id || product.id) as string;
      const data = await reviewService.getProductReviews(productId);
      setReviews(data.reviews);
      setTotalReviews(data.total);
    } catch (err) {
      console.error('Error loading reviews:', err);
    } finally {
      setIsLoadingReviews(false);
    }
  };

  const handleAddToCart = () => {
    // Check stock for variant
    if (selectedVariant && selectedVariant.stock <= 0) {
      alert('Sản phẩm này hiện đã hết hàng!');
      return;
    }
    
    setTriggerAnimation(true);
    const productToAdd = {
      ...product,
      quantity,
      // Include variant info if selected
      ...(selectedVariant && {
        selectedVariant: {
          attributes: selectedAttributes,
          price: selectedVariant.price,
          sku: selectedVariant.sku,
          stock: selectedVariant.stock,
          image: selectedVariant.image
        }
      })
    };
    console.log('Adding to cart:', productToAdd);
    onAddToCart(productToAdd);
  };

  const handleSubmitReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      setReviewError('Vui lòng đăng nhập để đánh giá sản phẩm');
      return;
    }

    if (!reviewForm.comment.trim()) {
      setReviewError('Vui lòng nhập nội dung đánh giá');
      return;
    }

    setIsSubmittingReview(true);
    setReviewError('');

    try {
      const productId = (product._id || product.id) as string;
      await reviewService.createReview({
        product: productId,
        rating: reviewForm.rating,
        comment: reviewForm.comment
      });
      
      // Reset form and reload reviews
      setReviewForm({ rating: 5, comment: '' });
      setReviewSuccess(true);
      loadReviews();
      
      // Hide success message after 3 seconds
      setTimeout(() => setReviewSuccess(false), 3000);
    } catch (err: any) {
      setReviewError(err.response?.data?.message || 'Có lỗi xảy ra khi gửi đánh giá');
    } finally {
      setIsSubmittingReview(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-3 sm:px-4 py-4 sm:py-6">
        {/* Breadcrumb */}
        <div className="flex items-center mb-4 sm:mb-6">
          <Button
            variant="ghost"
            onClick={() => onPageChange('home')}
            className="flex items-center space-x-2 text-sm sm:text-base"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Quay lại</span>
          </Button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6 lg:gap-8 mb-6 sm:mb-8">
          {/* Images */}
          <div className="space-y-3 sm:space-y-4">
            <div className="relative bg-white rounded-lg p-2 sm:p-4">
              <div className="aspect-square overflow-hidden rounded-lg">
                <ImageWithFallback
                  src={images[selectedImage]}
                  alt={product.name}
                  className="w-full h-full object-cover transition-transform duration-300 hover:scale-105"
                />
              </div>
              {product.discount && (
                <Badge className="absolute top-4 left-4 bg-red-500 text-white text-xs sm:text-sm">
                  -{product.discount}%
                </Badge>
              )}
              {product.isHot && (
                <Badge className="absolute top-4 right-4 bg-orange-500 text-white text-xs sm:text-sm">
                  HOT
                </Badge>
              )}
            </div>
            
            <div className="flex space-x-2 overflow-x-auto pb-2">
              {images.map((image, index) => (
                <button
                  key={index}
                  onClick={() => setSelectedImage(index)}
                  className={`flex-shrink-0 aspect-square w-16 sm:w-20 rounded-lg overflow-hidden border-2 transition-all ${
                    selectedImage === index ? 'border-blue-500 ring-2 ring-blue-200' : 'border-gray-200 hover:border-gray-400'
                  }`}
                >
                  <ImageWithFallback
                    src={image}
                    alt={`${product.name} ${index + 1}`}
                    className="w-full h-full object-cover"
                  />
                </button>
              ))}
            </div>
          </div>

          {/* Product Info */}
          <div className="space-y-4 sm:space-y-6">
            <div>
              <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold mb-2">{product.name}</h1>
              <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 mb-3 sm:mb-4">
                <div className="flex items-center gap-2">
                  <div className="flex items-center">
                    {[...Array(5)].map((_, i) => (
                      <Star
                        key={i}
                        className={`w-3.5 h-3.5 sm:w-4 sm:h-4 ${
                          i < Math.floor(product.rating)
                            ? 'text-yellow-400 fill-current'
                            : 'text-gray-300'
                        }`}
                      />
                    ))}
                  </div>
                  <span className="text-xs sm:text-sm text-gray-600">({product.rating}) | {totalReviews} đánh giá</span>
                </div>
              </div>
              <div className="flex flex-wrap items-center gap-3 sm:gap-4 text-xs sm:text-sm text-gray-600">
                <span>💬 {socialStats.commentCount} bình luận</span>
                <span>❤️ {socialStats.favoriteCount} lượt thích</span>
                <span>📤 {socialStats.shareCount} chia sẻ</span>
              </div>
            </div>

            {/* Price */}
            <div className="bg-gradient-to-r from-red-50 to-orange-50 p-4 sm:p-6 rounded-lg">
              <div className="flex flex-col sm:flex-row sm:items-baseline gap-2 sm:gap-3">
                <span className="text-2xl sm:text-3xl font-bold text-red-600">
                  {formatPrice(getCurrentPrice())}
                </span>
                {getCurrentOriginalPrice() !== getCurrentPrice() && (
                  <span className="text-lg sm:text-xl text-gray-500 line-through">
                    {formatPrice(getCurrentOriginalPrice())}
                  </span>
                )}
              </div>
              {getCurrentOriginalPrice() !== getCurrentPrice() && (
                <p className="text-sm sm:text-base text-green-600 mt-1">
                  💰 Tiết kiệm: {formatPrice(getCurrentOriginalPrice() - getCurrentPrice())}
                </p>
              )}
              {selectedVariant && (
                <p className="text-xs sm:text-sm text-gray-600 mt-2">
                  SKU: {selectedVariant.sku || 'N/A'} | 
                  {selectedVariant.stock <= 0 ? (
                    <span className="text-red-600 font-semibold"> Hết hàng</span>
                  ) : (
                    <> Còn lại: {selectedVariant.stock} sản phẩm</>
                  )}
                </p>
              )}
            </div>

            {/* Attributes Selection */}
            {product.attributes && product.attributes.length > 0 ? (
              <div className="space-y-3 sm:space-y-4">
                {product.attributes.map((attr) => (
                  <div key={attr.name} className="bg-white p-3 sm:p-4 rounded-lg">
                    <h3 className="font-medium mb-2 text-sm sm:text-base">{attr.name}:</h3>
                    <div className="flex flex-wrap gap-2">
                      {attr.values.map((value) => {
                        // Find variant for this attribute value
                        const testAttributes = { ...selectedAttributes, [attr.name]: value };
                        const matchingVariant = product.variants?.find(variant => 
                          Object.keys(testAttributes).every(key => 
                            variant.attributes[key] === testAttributes[key]
                          )
                        );
                        const isOutOfStock = matchingVariant && matchingVariant.stock <= 0;
                        const isDisabled = !matchingVariant || isOutOfStock;

                        return (
                          <Button
                            key={value}
                            variant={selectedAttributes[attr.name] === value ? "default" : "outline"}
                            size="sm"
                            onClick={() => handleAttributeSelect(attr.name, value)}
                            disabled={isDisabled}
                            className={`text-xs sm:text-sm flex flex-col items-center gap-1 h-auto py-2 ${
                              selectedAttributes[attr.name] === value ? "bg-blue-600 hover:bg-blue-700" : ""
                            } ${isDisabled ? "opacity-50 cursor-not-allowed" : ""}`}
                          >
                            <span className={isOutOfStock ? "line-through" : ""}>{value}</span>
                            {matchingVariant && (
                              <span className="text-[10px] font-normal">
                                {new Intl.NumberFormat('vi-VN').format(matchingVariant.price)}đ
                              </span>
                            )}
                            {isOutOfStock && (
                              <span className="text-[9px] text-red-500">Hết hàng</span>
                            )}
                          </Button>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="bg-gray-50 p-4 rounded-lg text-sm text-gray-500">
                Sản phẩm này chưa có thuộc tính. Vui lòng liên hệ quản trị viên để cập nhật.
              </div>
            )}

            {/* Quantity */}
            <div className="bg-white p-3 sm:p-4 rounded-lg">
              <h3 className="font-medium mb-2 text-sm sm:text-base">Số lượng:</h3>
              <div className="flex items-center space-x-3">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    className="w-8 h-8 sm:w-10 sm:h-10 p-0"
                  >
                    <Minus className="w-3 h-3 sm:w-4 sm:h-4" />
                  </Button>
                  <span className="w-12 sm:w-16 text-center font-semibold text-base sm:text-lg">{quantity}</span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setQuantity(quantity + 1)}
                    className="w-8 h-8 sm:w-10 sm:h-10 p-0"
                  >
                    <Plus className="w-3 h-3 sm:w-4 sm:h-4" />
                  </Button>
                </div>
            </div>

            {/* Actions */}
            <div className="space-y-2 sm:space-y-3">
              <Button
                ref={buttonRef}
                onClick={handleAddToCart}
                disabled={
                  product.status === 'out_of_stock' || 
                  product.status === 'inactive' ||
                  (selectedVariant && selectedVariant.stock <= 0)
                }
                className={`w-full flex items-center justify-center space-x-2 text-sm sm:text-base py-5 sm:py-6 shadow-lg transition-all ${
                  product.status === 'out_of_stock' || product.status === 'inactive' || (selectedVariant && selectedVariant.stock <= 0)
                    ? 'bg-gray-300 hover:bg-gray-300 cursor-not-allowed text-black font-bold border-2 border-gray-400'
                    : 'bg-blue-600 hover:bg-blue-700 text-white hover:shadow-xl'
                }`}
                size="lg"
              >
                <ShoppingCart className="w-4 h-4 sm:w-5 sm:h-5 stroke-[2.5]" />
                <span className="font-bold text-base">
                  {product.status === 'out_of_stock' || product.status === 'inactive' || (selectedVariant && selectedVariant.stock <= 0)
                    ? 'TẠM HẾT HÀNG' 
                    : 'THÊM VÀO GIỎ'}
                </span>
              </Button>
              
              <div className="grid grid-cols-3 gap-2 sm:gap-3">
                <FavoriteButton
                  productId={(product._id || product.id || '') as string}
                  isFavorited={isFavorited}
                  onFavoriteChange={setIsFavorited}
                  disabled={!user}
                />
                <Button 
                  variant="outline" 
                  className="flex items-center justify-center space-x-2 text-sm sm:text-base"
                  onClick={() => setIsShareDialogOpen(true)}
                >
                  <Share2 className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                  <span>Chia sẻ</span>
                </Button>
                <Button 
                  variant="outline" 
                  className="flex items-center justify-center space-x-2 text-sm sm:text-base bg-gradient-to-r from-blue-600 to-purple-600 text-white hover:from-blue-700 hover:to-purple-700 border-0"
                  onClick={() => {
                    reviewsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
                  }}
                >
                  <span>Đánh giá</span>
                </Button>
              </div>
              
              <ShareDialog
                isOpen={isShareDialogOpen}
                onClose={() => setIsShareDialogOpen(false)}
                productId={(product._id || product.id) as string}
                title={product.name}
                description={product.description || ""}
                image={product.image}
              />
            </div>

            {/* Benefits */}
            <Card className="shadow-md">
              <CardContent className="p-3 sm:p-4 space-y-2 sm:space-y-3">
                <div className="flex items-center space-x-3">
                  <div className="flex-shrink-0 w-8 h-8 sm:w-10 sm:h-10 bg-green-100 rounded-full flex items-center justify-center">
                    <Truck className="w-4 h-4 sm:w-5 sm:h-5 text-green-600" />
                  </div>
                  <span className="text-xs sm:text-sm font-medium">Miễn phí vận chuyển toàn quốc</span>
                </div>
                <div className="flex items-center space-x-3">
                  <div className="flex-shrink-0 w-8 h-8 sm:w-10 sm:h-10 bg-blue-100 rounded-full flex items-center justify-center">
                    <Shield className="w-4 h-4 sm:w-5 sm:h-5 text-blue-600" />
                  </div>
                  <span className="text-xs sm:text-sm font-medium">Bảo hành chính hãng 12 tháng</span>
                </div>
                <div className="flex items-center space-x-3">
                  <div className="flex-shrink-0 w-8 h-8 sm:w-10 sm:h-10 bg-purple-100 rounded-full flex items-center justify-center">
                    <RotateCcw className="w-4 h-4 sm:w-5 sm:h-5 text-purple-600" />
                  </div>
                  <span className="text-xs sm:text-sm font-medium">Đổi trả miễn phí trong 7 ngày</span>
                </div>
                <div className="flex items-center space-x-3">
                  <div className="flex-shrink-0 w-8 h-8 sm:w-10 sm:h-10 bg-orange-100 rounded-full flex items-center justify-center">
                    <Phone className="w-4 h-4 sm:w-5 sm:h-5 text-orange-600" />
                  </div>
                  <span className="text-xs sm:text-sm font-medium">Hỗ trợ kỹ thuật 24/7</span>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Tabs */}
        <Card className="shadow-md">
          <CardContent className="p-0">
            <Tabs defaultValue="description" className="w-full">
              <TabsList className="grid w-full grid-cols-2 sm:grid-cols-4 h-auto">
                <TabsTrigger value="description" className="text-xs sm:text-sm py-2 sm:py-3">Mô tả</TabsTrigger>
                <TabsTrigger value="specifications" className="text-xs sm:text-sm py-2 sm:py-3">Thông số</TabsTrigger>
                <TabsTrigger value="reviews" className="text-xs sm:text-sm py-2 sm:py-3" ref={reviewsRef}>Đánh giá ({totalReviews})</TabsTrigger>
                <TabsTrigger value="comments" className="text-xs sm:text-sm py-2 sm:py-3">Bình luận ({socialStats.commentCount})</TabsTrigger>
              </TabsList>
              
              <TabsContent value="description" className="p-4 sm:p-6">
                <div className="prose max-w-none">
                  <p className="text-sm sm:text-base text-gray-700 leading-relaxed">
                    {product.description || 
                    `${product.name} là sản phẩm công nghệ hàng đầu với thiết kế hiện đại và tính năng vượt trội. 
                    Sản phẩm được thiết kế với chất liệu cao cấp, đảm bảo độ bền và tính thẩm mỹ cao. 
                    Với công nghệ tiên tiến và hiệu suất mạnh mẽ, sản phẩm này sẽ đáp ứng mọi nhu cầu của bạn 
                    trong công việc và giải trí hàng ngày.`}
                  </p>
                </div>
              </TabsContent>
              
              <TabsContent value="specifications" className="p-4 sm:p-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                  {Object.entries(specifications).map(([key, value]) => (
                    <div key={key} className="flex flex-col sm:flex-row sm:justify-between sm:items-center p-3 bg-gray-50 rounded-lg gap-1 sm:gap-0">
                      <span className="font-medium text-gray-700 text-xs sm:text-sm">{key}:</span>
                      <span className="text-gray-900 text-sm sm:text-base">{value}</span>
                    </div>
                  ))}
                </div>
              </TabsContent>
              
              <TabsContent value="reviews" className="p-6">
                <div className="space-y-6">
                  {/* Review Form */}
                  {user && (
                    <Card>
                      <CardContent className="p-4">
                        <h3 className="font-medium mb-4">Viết đánh giá của bạn</h3>
                        <form onSubmit={handleSubmitReview} className="space-y-4">
                          <div>
                            <Label>Đánh giá</Label>
                            <div className="flex space-x-1 mt-1">
                              {[1, 2, 3, 4, 5].map((star) => (
                                <button
                                  key={star}
                                  type="button"
                                  onClick={() => setReviewForm({ ...reviewForm, rating: star })}
                                  className="focus:outline-none"
                                >
                                  <Star
                                    className={`w-6 h-6 ${
                                      star <= reviewForm.rating
                                        ? 'text-yellow-400 fill-current'
                                        : 'text-gray-300'
                                    }`}
                                  />
                                </button>
                              ))}
                            </div>
                          </div>

                          <div>
                            <Label>Nhận xét của bạn</Label>
                            <Textarea
                              value={reviewForm.comment}
                              onChange={(e) => setReviewForm({ ...reviewForm, comment: e.target.value })}
                              placeholder="Chia sẻ trải nghiệm của bạn về sản phẩm..."
                              className="mt-1"
                              rows={4}
                            />
                          </div>

                          {reviewError && (
                            <Alert variant="destructive">
                              <AlertDescription>{reviewError}</AlertDescription>
                            </Alert>
                          )}
                          {reviewSuccess && (
                            <Alert className="bg-green-50 border-green-200">
                              <Check className="h-4 w-4 text-green-600" />
                              <AlertDescription className="text-green-600">
                                Cảm ơn bạn đã gửi đánh giá!
                              </AlertDescription>
                            </Alert>
                          )}

                          <Button type="submit" disabled={isSubmittingReview}>
                            {isSubmittingReview ? (
                              <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                Đang gửi...
                              </>
                            ) : (
                              'Gửi đánh giá'
                            )}
                          </Button>
                        </form>
                      </CardContent>
                    </Card>
                  )}

                  {/* Reviews List */}
                  <div className="space-y-4">
                    {isLoadingReviews ? (
                      <div className="text-center py-8">
                        <Loader2 className="h-8 w-8 animate-spin mx-auto" />
                        <p className="text-gray-500 mt-2">Đang tải đánh giá...</p>
                      </div>
                    ) : reviews.length > 0 ? (
                      reviews.map((review) => (
                        <div key={review._id} className="flex items-center space-x-4 p-4 border rounded-lg">
                          <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center text-white font-medium">
                            {review.user.name.charAt(0)}
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center space-x-2 mb-1">
                              <span className="font-medium">{review.user.name}</span>
                              {review.isVerifiedPurchase && (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-green-100 text-green-700 text-xs font-medium rounded-full">
                                  <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                  </svg>
                                  Đã mua hàng
                                </span>
                              )}
                              <div className="flex">
                                {[...Array(5)].map((_, i) => (
                                  <Star
                                    key={i}
                                    className={`w-4 h-4 ${
                                      i < review.rating ? 'text-yellow-400 fill-current' : 'text-gray-300'
                                    }`}
                                  />
                                ))}
                              </div>
                            </div>
                            <p className="text-gray-700">{review.comment}</p>
                            <p className="text-sm text-gray-500 mt-1">
                              {new Date(review.createdAt).toLocaleDateString('vi-VN')}
                            </p>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="text-center py-8">
                        <p className="text-gray-500">Chưa có đánh giá nào cho sản phẩm này</p>
                      </div>
                    )}
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="comments" className="p-6">
                <CommentSection
                  productId={(product._id || product.id) as string}
                  user={user}
                />
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
      
      <AddToCartAnimation
        trigger={triggerAnimation}
        onComplete={() => setTriggerAnimation(false)}
        buttonRef={buttonRef}
      />
    </div>
  );
}