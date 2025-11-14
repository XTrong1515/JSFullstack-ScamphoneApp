import { useRef, useState } from "react";
import { Star, ShoppingCart } from "lucide-react";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import { ImageWithFallback } from "./figma/ImageWithFallback";
import { AddToCartAnimation } from "./AddToCartAnimation";

interface Product {
  id: string;
  name: string;
  price: number;
  originalPrice?: number;
  image: string;
  rating: number;
  discount?: number;
  isHot?: boolean;
  isNewProduct?: boolean;
  status?: 'active' | 'inactive' | 'out_of_stock';
  stock?: number;
}

interface ProductCardProps {
  product: Product;
  onAddToCart: (product: Product) => void;
  onProductClick: (product: Product) => void;
}

export function ProductCard({ product, onAddToCart, onProductClick }: ProductCardProps) {
  const [triggerAnimation, setTriggerAnimation] = useState(false);
  const buttonRef = useRef<HTMLButtonElement>(null);

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND'
    }).format(price);
  };

  const handleAddToCart = () => {
    setTriggerAnimation(true);
    onAddToCart(product);
  };

  // Check if product is available for purchase
  const isOutOfStock = product.stock !== undefined && product.stock === 0;
  const isInactive = product.status === 'inactive';
  const isUnavailable = isOutOfStock || isInactive;

  return (
    <div className="bg-white rounded-lg border border-gray-200 hover:border-blue-300 hover:shadow-lg transition-all duration-300 overflow-hidden group">
      <div className="relative cursor-pointer" onClick={() => onProductClick(product)}>
        <ImageWithFallback
          src={product.image}
          alt={product.name}
          className={`w-full h-48 object-cover group-hover:scale-105 transition-transform duration-300 ${
            isUnavailable ? 'opacity-60' : ''
          }`}
        />
        {product.discount && !isUnavailable && (
          <Badge className="absolute top-2 left-2 bg-red-500 text-white">
            -{product.discount}%
          </Badge>
        )}
        {product.isNewProduct && !isUnavailable && (
          <Badge className="absolute top-2 left-2 bg-green-500 text-white">
            NEW
          </Badge>
        )}
        {product.isHot && !isUnavailable && (
          <Badge className="absolute top-2 right-2 bg-orange-500 text-white">
            HOT
          </Badge>
        )}
        {isOutOfStock && (
          <Badge className="absolute top-2 left-2 bg-gray-500 text-white">
            Tạm hết hàng
          </Badge>
        )}
        {isInactive && !isOutOfStock && (
          <Badge className="absolute top-2 left-2 bg-gray-500 text-white">
            Ngưng bán
          </Badge>
        )}
        {product.stock !== undefined && product.stock > 0 && product.stock <= 5 && !isUnavailable && (
          <Badge className="absolute top-2 left-2 bg-yellow-500 text-white">
            Chỉ còn {product.stock}
          </Badge>
        )}
      </div>
      
      <div className="p-4">
        <h3 
          className="font-medium text-gray-900 mb-2 line-clamp-2 min-h-[3rem] cursor-pointer hover:text-blue-600"
          onClick={() => onProductClick(product)}
        >
          {product.name}
        </h3>
        
        <div className="flex items-center mb-2">
          <div className="flex items-center">
            {[...Array(5)].map((_, i) => (
              <Star
                key={i}
                className={`w-4 h-4 ${
                  i < Math.floor(product.rating)
                    ? 'text-yellow-400 fill-current'
                    : 'text-gray-300'
                }`}
              />
            ))}
          </div>
          <span className="text-sm text-gray-600 ml-2">({product.rating})</span>
        </div>
        
        <div className="flex items-center justify-between mb-3">
          <div>
            <span className="text-lg font-bold text-blue-600">
              {formatPrice(product.price)}
            </span>
            {product.originalPrice && (
              <span className="text-sm text-gray-500 line-through ml-2">
                {formatPrice(product.originalPrice)}
              </span>
            )}
          </div>
        </div>
        
        <Button
          ref={buttonRef}
          onClick={handleAddToCart}
          disabled={isUnavailable}
          className={`w-full flex items-center justify-center space-x-2 ${
            isUnavailable
              ? 'bg-gray-300 hover:bg-gray-300 cursor-not-allowed text-black font-bold border-2 border-gray-400'
              : 'bg-blue-600 hover:bg-blue-700 text-white'
          }`}
        >
          <ShoppingCart className={`w-4 h-4 ${isUnavailable ? 'stroke-[2.5]' : ''}`} />
          <span className={isUnavailable ? 'font-bold uppercase' : ''}>
            {isOutOfStock ? 'Tạm hết hàng' : isInactive ? 'Ngưng bán' : 'Thêm vào giỏ'}
          </span>
        </Button>
      </div>
      
      <AddToCartAnimation
        trigger={triggerAnimation}
        onComplete={() => setTriggerAnimation(false)}
        buttonRef={buttonRef}
      />
    </div>
  );
}