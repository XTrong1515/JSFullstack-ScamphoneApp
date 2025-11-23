import { useState } from "react";
import { Button } from "./ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Badge } from "./ui/badge";
import { Separator } from "./ui/separator";
import { Minus, Plus, Trash2, ShoppingBag, X } from "lucide-react";
import { ImageWithFallback } from "./figma/ImageWithFallback";
import { useCartStore } from "../stores/useCartStore";

interface CartItem {
  id: string;
  name: string;
  price: number;
  originalPrice?: number;
  image: string;
  quantity: number;
  discount?: number;
}

interface CartDropdownProps {
  onClose: () => void;
  onPageChange: (page: string) => void;
}

export function CartDropdown({ onClose, onPageChange }: CartDropdownProps) {
  const { 
    cartItems, 
    updateQuantity: updateCartQuantity, 
    removeItem: removeCartItem 
  } = useCartStore();
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

  const totalAmount = cartItems.reduce((total, item) => total + (item.price * item.quantity), 0);

  const handleViewCart = () => {
    onClose();
    onPageChange('cart');
  };

  return (
    <div className="fixed inset-0 z-50 flex">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black bg-opacity-50"
        onClick={onClose}
      />
      
      {/* Sidebar */}
      <div className="relative ml-auto w-full max-w-md bg-white h-full shadow-xl">
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b">
            <h2 className="text-lg font-semibold">
              Giỏ hàng ({cartItems.length})
            </h2>
            <Button variant="ghost" size="sm" onClick={onClose}>
              <X className="w-4 h-4" />
            </Button>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto">
            {cartItems.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full p-8 text-center">
                <ShoppingBag className="w-16 h-16 text-gray-300 mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  Giỏ hàng trống
                </h3>
                <p className="text-gray-600 mb-6">
                  Hãy thêm sản phẩm vào giỏ hàng
                </p>
                <Button 
                  onClick={onClose}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  Tiếp tục mua sắm
                </Button>
              </div>
            ) : (
              <div className="p-4 space-y-4">
                {cartItems.map((item) => (
                  <div key={item.id} className="flex items-center space-x-3 p-3 border rounded-lg">
                    <ImageWithFallback
                      src={item.image}
                      alt={item.name}
                      className="w-16 h-16 object-cover rounded-lg"
                    />
                    
                    <div className="flex-1 min-w-0">
                      <h4 className="text-sm font-medium text-gray-900 truncate">
                        {item.name}
                      </h4>
                      <div className="flex items-center space-x-2 mt-1">
                        <span className="text-sm font-semibold text-blue-600">
                          {formatPrice(item.price)}
                        </span>
                        {item.originalPrice && (
                          <span className="text-xs text-gray-500 line-through">
                            {formatPrice(item.originalPrice)}
                          </span>
                        )}
                      </div>
                      
                      <div className="flex items-center justify-between mt-2">
                        <div className="flex items-center space-x-1">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => updateQuantity(item.id, item.quantity - 1)}
                            className="w-6 h-6 p-0"
                          >
                            <Minus className="w-3 h-3" />
                          </Button>
                          <span className="text-sm w-8 text-center">{item.quantity}</span>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => updateQuantity(item.id, item.quantity + 1)}
                            className="w-6 h-6 p-0"
                          >
                            <Plus className="w-3 h-3" />
                          </Button>
                        </div>
                        
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => removeItem(item.id)}
                          className="text-red-600 hover:text-red-700 hover:bg-red-50 p-1"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Footer */}
          {cartItems.length > 0 && (
            <div className="border-t p-4 space-y-4">
              <div className="flex justify-between items-center">
                <span className="font-medium">Tổng cộng:</span>
                <span className="text-lg font-bold text-blue-600">
                  {formatPrice(totalAmount)}
                </span>
              </div>
              
              <div className="space-y-2">
                <Button 
                  onClick={handleViewCart}
                  className="w-full bg-blue-600 hover:bg-blue-700"
                >
                  Xem giỏ hàng
                </Button>
                <Button 
                  variant="outline" 
                  className="w-full"
                  onClick={onClose}
                >
                  Tiếp tục mua sắm
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}