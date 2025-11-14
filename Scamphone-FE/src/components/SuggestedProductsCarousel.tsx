import React from 'react';
import { ProductCard } from './ProductCard';
import { Button } from './ui/button';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface SuggestedProductsCarouselProps {
  title: string;
  products: any[];
  onAddToCart: (p: any) => void;
  onProductClick: (p: any) => void;
}

export const SuggestedProductsCarousel: React.FC<SuggestedProductsCarouselProps> = ({
  title,
  products,
  onAddToCart,
  onProductClick
}) => {
  const scrollRef = React.useRef<HTMLDivElement>(null);

  if (!products || products.length === 0) return null;

  const scroll = (dir: 'left' | 'right') => {
    if (!scrollRef.current) return;
    const amount = 320; // px per scroll
    scrollRef.current.scrollBy({ left: dir === 'left' ? -amount : amount, behavior: 'smooth' });
  };

  return (
    <div className="mt-10">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-semibold">{title}</h2>
        <div className="flex gap-2">
          <Button variant="outline" size="icon" onClick={() => scroll('left')}>
            <ChevronLeft className="w-4 h-4" />
          </Button>
          <Button variant="outline" size="icon" onClick={() => scroll('right')}>
            <ChevronRight className="w-4 h-4" />
          </Button>
        </div>
      </div>
      <div ref={scrollRef} className="flex gap-4 overflow-x-auto scrollbar-thin pb-2">
        {products.map(prod => (
          <div key={prod._id} className="min-w-[220px] flex-shrink-0">
            <ProductCard
              product={{
                id: prod._id,
                name: prod.name,
                price: prod.price,
                originalPrice: prod.originalPrice,
                image: prod.image,
                rating: prod.rating || 0,
                discount: prod.discount,
                isHot: prod.isHot
              }}
              onAddToCart={onAddToCart}
              onProductClick={onProductClick}
            />
          </div>
        ))}
      </div>
    </div>
  );
};
