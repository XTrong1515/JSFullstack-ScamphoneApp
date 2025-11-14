import { useState } from "react";
import { ShoppingCart, User, Phone, ChevronDown, Grid3X3 } from "lucide-react";
import { Button } from "./ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";
import { CategoryDropdown } from "./CategoryDropdown";
import { NotificationBadge } from "./NotificationCenter";
import { SearchBar } from "./SearchBar";

interface User {
  id: string;
  name: string;
  email: string;
  phone: string;
  avatar: string;
}

interface HeaderProps {
  currentPage: string;
  onPageChange: (page: string) => void;
  cartItemCount: number;
  user?: User;
  onShowAuthModal: () => void;
  onShowCartDropdown: () => void;
  onShowUserMenu: () => void;
  onCategorySelect: (categoryId: string, subcategoryId?: string) => void;
  onShowNotifications?: () => void;
  onSearch?: (query: string) => void;
}

export function Header({ 
  currentPage, 
  onPageChange, 
  cartItemCount, 
  user, 
  onShowAuthModal, 
  onShowCartDropdown,
  onShowUserMenu,
  onCategorySelect,
  onShowNotifications,
  onSearch
}: HeaderProps) {
  const [showCategoryDropdown, setShowCategoryDropdown] = useState(false);
  const handleSearch = (value: string) => {
    if (!value.trim()) return;
    onSearch?.(value.trim());
  };

  return (
    <>
      <header className="bg-white border-b shadow-sm">
      {/* Top bar */}
      <div className="bg-blue-600 text-white py-2">
        <div className="container mx-auto px-4 flex justify-between items-center">
          <div className="flex items-center space-x-4">
            <span className="flex items-center space-x-1">
              <Phone className="w-4 h-4" />
              <span>Hotline: 1900 232 460</span>
            </span>
          </div>
          <div className="flex items-center space-x-4">
            <span>Miễn phí vận chuyển đơn từ 500K</span>
          </div>
        </div>
      </div>

      {/* Main header */}
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          {/* Logo */}
          <div 
            className="flex items-center space-x-2 cursor-pointer"
            onClick={() => onPageChange('home')}
          >
            <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white p-2 rounded-lg">
              <Phone className="w-8 h-8" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-blue-600">ScamPhone</h1>
              <p className="text-sm text-gray-500">Điện thoại & Công nghệ</p>
            </div>
          </div>

          {/* Search bar */}
          <div className="flex-1 max-w-2xl mx-8">
            <SearchBar onSearch={handleSearch} />
          </div>

          {/* Actions */}
          <div className="flex items-center space-x-4">
            {user && onShowNotifications && (
              <NotificationBadge onClick={onShowNotifications} />
            )}
            
            {user ? (
              <Button
                variant="ghost"
                onClick={onShowUserMenu}
                className="flex items-center space-x-2"
              >
                <Avatar className="w-8 h-8">
                  <AvatarImage src={user.avatar} alt={user.name} />
                  <AvatarFallback>
                    {user.name.split(' ').map(n => n[0]).join('')}
                  </AvatarFallback>
                </Avatar>
                <span className="hidden md:block">{user.name}</span>
                <ChevronDown className="w-4 h-4" />
              </Button>
            ) : (
              <Button
                variant="ghost"
                onClick={onShowAuthModal}
                className="flex items-center space-x-2"
              >
                <User className="w-5 h-5" />
                <span>Đăng nhập</span>
              </Button>
            )}
            
            <Button
              variant="ghost"
              onClick={onShowCartDropdown}
              className="flex items-center space-x-2 relative"
              data-cart-icon
            >
              <ShoppingCart className="w-5 h-5" />
              <span className="hidden md:block">Giỏ hàng</span>
              {cartItemCount > 0 && (
                <span className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs">
                  {cartItemCount}
                </span>
              )}
            </Button>
          </div>
        </div>

        {/* Navigation */}
        <nav className="mt-4">
          <div className="flex items-center space-x-8">
            <Button
              variant={currentPage === 'home' ? 'default' : 'ghost'}
              onClick={() => onPageChange('home')}
              className={currentPage === 'home' ? "bg-blue-600 hover:bg-blue-700" : ""}
            >
              Trang chủ
            </Button>
            
            <Button 
              variant="ghost"
              onClick={() => setShowCategoryDropdown(!showCategoryDropdown)}
              className="flex items-center space-x-1"
            >
              <Grid3X3 className="w-4 h-4" />
              <span>Danh mục sản phẩm</span>
              <ChevronDown className="w-4 h-4" />
            </Button>
            
            <Button 
              variant="ghost"
              onClick={() => onCategorySelect('phone')}
            >
              Điện thoại
            </Button>
            <Button 
              variant="ghost"
              onClick={() => onCategorySelect('laptop')}
            >
              Laptop
            </Button>
            <Button 
              variant="ghost"
              onClick={() => onCategorySelect('tablet')}
            >
              Tablet
            </Button>
            <Button 
              variant="ghost"
              onClick={() => onCategorySelect('accessories')}
            >
              Phụ kiện
            </Button>
            <Button 
              variant="ghost"
              onClick={() => onCategorySelect('home-appliances')}
            >
              Đồ gia dụng
            </Button>
            <Button 
              variant="ghost"
              onClick={() => onCategorySelect('tv')}
            >
              TV
            </Button>
            <Button 
              variant="ghost"
              onClick={() => onCategorySelect('refrigerator')}
            >
              Tủ lạnh
            </Button>
            <Button variant="ghost">Khuyến mãi</Button>
            <Button variant="ghost">Tin tức</Button>
          </div>
        </nav>
      </div>
    </header>

    {/* Category Dropdown */}
    <CategoryDropdown
      isOpen={showCategoryDropdown}
      onClose={() => setShowCategoryDropdown(false)}
      onCategorySelect={onCategorySelect}
    />
  </>
  );
}