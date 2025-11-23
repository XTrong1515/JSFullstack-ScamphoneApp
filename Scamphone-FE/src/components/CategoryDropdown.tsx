import { useState, useEffect } from "react";
import { Button } from "./ui/button";
import { ChevronDown, Smartphone, Laptop, Tablet, Headphones, Home, Tv, Refrigerator, Package, Loader2 } from "lucide-react";
import { categoryService, Category as BackendCategory } from "../services/categoryService";

// Removed unused local Category interface - using BackendCategory from service

interface CategoryDropdownProps {
  isOpen: boolean;
  onClose: () => void;
  onCategorySelect: (categoryId: string, subcategoryId?: string) => void;
}

export function CategoryDropdown({ isOpen, onClose, onCategorySelect }: CategoryDropdownProps) {
  const [hoveredCategory, setHoveredCategory] = useState<string | null>(null);
  const [categories, setCategories] = useState<BackendCategory[]>([]);
  const [loading, setLoading] = useState(true);

  // Map category names to icons
  const categoryIcons: { [key: string]: React.ElementType } = {
    'điện thoại': Smartphone,
    'phone': Smartphone,
    'smartphone': Smartphone,
    'laptop': Laptop,
    'máy tính': Laptop,
    'tablet': Tablet,
    'máy tính bảng': Tablet,
    'phụ kiện': Headphones,
    'accessories': Headphones,
    'đồ gia dụng': Home,
    'home appliances': Home,
    'tv': Tv,
    'tivi': Tv,
    'tủ lạnh': Refrigerator,
    'refrigerator': Refrigerator,
  };

  const getIconForCategory = (categoryName: string): React.ElementType => {
    const lowerName = categoryName.toLowerCase();
    for (const [key, icon] of Object.entries(categoryIcons)) {
      if (lowerName.includes(key)) {
        return icon;
      }
    }
    return Package; // Default icon
  };

  useEffect(() => {
    if (isOpen) {
      loadCategories();
    }
  }, [isOpen]);

  const loadCategories = async () => {
    try {
      setLoading(true);
      const data = await categoryService.getAllCategories();
      setCategories(data);
    } catch (error) {
      console.error('Error loading categories:', error);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-40">
      {/* Backdrop */}
      <div 
        className="absolute inset-0"
        onClick={onClose}
      />
      
      {/* Dropdown content */}
      <div className="absolute top-16 left-0 right-0 bg-white shadow-lg border-t">
        <div className="container mx-auto px-4 py-6">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
            </div>
          ) : categories.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              Chưa có danh mục nào
            </div>
          ) : (
            <div className={`grid gap-6 ${categories.length >= 7 ? 'grid-cols-7' : `grid-cols-${Math.min(categories.length, 4)}`}`}>
              {categories.map((category) => {
                const IconComponent = getIconForCategory(category.name);
                const isHovered = hoveredCategory === category._id;
                
                return (
                  <div
                    key={category._id}
                    className="space-y-4"
                    onMouseEnter={() => setHoveredCategory(category._id)}
                    onMouseLeave={() => setHoveredCategory(null)}
                  >
                    {/* Category header */}
                    <div 
                      className={`flex items-center space-x-2 p-3 rounded-lg cursor-pointer transition-colors ${
                        isHovered ? 'bg-blue-50 text-blue-600' : 'hover:bg-gray-50'
                      }`}
                      onClick={() => {
                        onCategorySelect(category._id);
                        onClose();
                      }}
                    >
                      <IconComponent className="w-5 h-5" />
                      <span className="font-medium">{category.name}</span>
                    </div>
                    
                    {/* View all button */}
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="w-full text-blue-600 border-blue-200 hover:bg-blue-50"
                      onClick={() => {
                        onCategorySelect(category._id);
                        onClose();
                      }}
                    >
                      Xem tất cả {category.name}
                    </Button>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}