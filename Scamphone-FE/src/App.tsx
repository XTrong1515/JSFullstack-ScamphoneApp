import { useState, useEffect } from "react";
import { io, Socket } from "socket.io-client";
import { toast, Toaster } from "sonner";
import { Header } from "./components/Header";
import { Footer } from "./components/Footer";
import { HomePage } from "./components/pages/HomePage";
import { LoginPage } from "./components/pages/LoginPage";
import { RegisterPage } from "./components/pages/RegisterPage";
import { CartPage } from "./components/pages/CartPage";
import { ProductDetailPage } from "./components/pages/ProductDetailPage";
import { CategoryPage } from "./components/pages/CategoryPage";
import { AdminDashboard } from "./components/pages/AdminDashboard";
import { ProfilePage } from "./components/pages/ProfilePage";
import { OrdersPage } from "./components/pages/OrdersPage";
import { FavoritesPage } from "./components/pages/FavoritesPage";
import { PromotionsPage } from "./components/pages/PromotionsPage";
import { AuthModal } from "./components/AuthModal";
import { CartDropdown } from "./components/CartDropdown";
import { UserProfileDropdown } from "./components/UserProfileDropdown";
import { ScrollToTop } from "./components/ScrollToTop";
import { TestApiPage } from "./components/pages/TestApiPage";
import { ForgotPasswordForm } from "./components/ForgotPasswordForm";
import { ResetPasswordPage } from "./components/pages/ResetPasswordPage";
import { CheckoutPage } from "./components/pages/CheckoutPage";
import { PaymentPage } from "./components/pages/PaymentPage";
import { PaymentResultPage } from "./components/pages/PaymentResultPage";
import { OrderSuccessPage } from "./components/pages/OrderSuccessPage";
import { NotificationCenter } from "./components/NotificationCenter";
import { userService } from "./services/userService";
import { SearchResultsPage } from "./components/pages/SearchResultsPage";
import { useCartStore } from "./stores/useCartStore";

interface Product {
  id: string;
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
}

interface CartItem {
  id: string;
  name: string;
  price: number;
  originalPrice?: number;
  image: string;
  quantity: number;
  discount?: number;
}

interface User {
  id: string;
  name: string;
  email: string;
  phone: string;
  avatar: string;
}

export default function App() {
  const [currentPage, setCurrentPage] = useState<string>('home');
  const cartItems = useCartStore((state) => state.cartItems);
  const addToCart = useCartStore((state) => state.addToCart);
  const clearCart = useCartStore((state) => state.clearCart);
  const [user, setUser] = useState<User | undefined>(undefined);
  const [selectedProduct, setSelectedProduct] = useState<Product | undefined>(undefined);
  const [selectedCategory, setSelectedCategory] = useState<{categoryId: string, subcategoryId?: string} | undefined>(undefined);
  const [resetToken, setResetToken] = useState<string>('');
  const [resetEmail, setResetEmail] = useState<string>('');
  const [resetOtp, setResetOtp] = useState<string>('');
  const [checkoutData, setCheckoutData] = useState<any>(null);
  const [orderData, setOrderData] = useState<any>(null);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [socket, setSocket] = useState<Socket | null>(null);
  
  // Modal/Dropdown states
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [showCartDropdown, setShowCartDropdown] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);

  // Detect VNPay return URL on app mount
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.has('vnp_ResponseCode')) {
      setCurrentPage('payment-return');
    }
  }, []);

  // Load user from token on app mount
  useEffect(() => {
    const loadUser = async () => {
      const token = localStorage.getItem('token');
      if (token) {
        try {
          const userData = await userService.getCurrentUser();
          const userObj = {
            id: userData._id,
            name: userData.name,
            email: userData.email,
            phone: userData.phone || '',
            avatar: '',
            role: userData.role
          };
          setUser(userObj);
          
          // Cart is automatically loaded by Zustand persist middleware
          // Load cart for this user
          const userCartKey = `cart_${userData._id}`;
          // Cart loading handled by Zustand store
        } catch (error) {
          console.error('Failed to load user:', error);
          localStorage.removeItem('token');
        }
      }
    };
    loadUser();
  }, []);

  // Socket.io connection - connect when user logs in
  useEffect(() => {
    if (user) {
      const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';
      const newSocket = io(API_URL, {
        transports: ['websocket', 'polling'],
        reconnection: true
      });

      newSocket.on('connect', () => {
        console.log('[SOCKET] Connected to server');
        // Send user ID to server to map socket
        newSocket.emit('user_connected', user.id);
      });

      newSocket.on('new_notification', (notification) => {
        console.log('[SOCKET] Received notification:', notification);
        toast.success(notification.title, {
          description: notification.message,
          duration: 5000
        });
        // Trigger refresh of notification badge/list if needed
        setShowNotifications(false); // Force re-render
      });

      newSocket.on('disconnect', () => {
        console.log('[SOCKET] Disconnected from server');
      });

      setSocket(newSocket);

      return () => {
        newSocket.close();
      };
    } else {
      // Disconnect socket if user logs out
      if (socket) {
        socket.close();
        setSocket(null);
      }
    }
  }, [user]);

  // Save cart to localStorage when it changes (per user)
  // Cart persistence now handled by Zustand persist middleware

  const handleAddToCart = (product: any) => {
    // Extract variant if exists (from ProductDetailPage)
    const variant = product.selectedVariant;
    addToCart(product, variant);
  };

  // Cart updates now handled by Zustand store

  const handleProductClick = (product: Product) => {
    setSelectedProduct(product);
    setCurrentPage('product-detail');
  };

  const handleLogin = (userData: User) => {
    setUser(userData);
    // Zustand cart store handles persistence automatically
    // Check if there's a redirect after login
    if (currentPage === 'cart') {
      setShowAuthModal(false);
    }
  };

  const handleLogout = () => {
    setUser(undefined);
    clearCart(); // Clear cart on logout using Zustand
  };

  const handlePageChange = (page: string, data?: any) => {
    setCurrentPage(page);
    if (data) {
      if (page === 'payment') {
        setCheckoutData(data);
      } else if (page === 'order-success') {
        setOrderData(data);
      } else if (page === 'search') {
        setSearchQuery(data?.query || '');
      } else if (page === 'reset-password') {
        // Lưu email và OTP khi chuyển từ ForgotPasswordForm
        if (data.email) setResetEmail(data.email);
        if (data.otp) setResetOtp(data.otp);
      }
    }
  };

  const handleSearch = (query: string) => {
    setSearchQuery(query);
    setCurrentPage('search');
  };

  const handleCategorySelect = (categoryId: string, subcategoryId?: string) => {
    setSelectedCategory({ categoryId, subcategoryId });
    setCurrentPage('category');
  };

  const getTotalCartItems = () => {
    return cartItems.reduce((total, item) => total + item.quantity, 0);
  };

  const renderCurrentPage = () => {
    switch (currentPage) {
      case 'home':
        return (
          <HomePage 
            onAddToCart={handleAddToCart} 
            onProductClick={handleProductClick}
            onCategorySelect={handleCategorySelect}
          />
        );
      case 'login':
        return (
          <LoginPage 
            onPageChange={setCurrentPage} 
            onLogin={handleLogin}
          />
        );
      case 'register':
        return (
          <RegisterPage 
            onPageChange={setCurrentPage} 
            onLogin={handleLogin}
          />
        );
      case 'cart':
        return (
          <CartPage
            user={user}
            onPageChange={setCurrentPage}
          />
        );
      case 'product-detail':
        return selectedProduct ? (
          <ProductDetailPage
            product={selectedProduct}
            user={user}
            onPageChange={setCurrentPage}
            onAddToCart={handleAddToCart}
          />
        ) : (
          <HomePage 
            onAddToCart={handleAddToCart} 
            onProductClick={handleProductClick}
          />
        );
      case 'category':
        return selectedCategory ? (
          <CategoryPage
            categoryId={selectedCategory.categoryId}
            subcategoryId={selectedCategory.subcategoryId}
            onPageChange={setCurrentPage}
            onAddToCart={handleAddToCart}
            onProductClick={handleProductClick}
          />
        ) : (
          <HomePage 
            onAddToCart={handleAddToCart} 
            onProductClick={handleProductClick}
          />
        );
      case 'admin':
        return <AdminDashboard onPageChange={setCurrentPage} />;
      case 'profile':
        return <ProfilePage onPageChange={setCurrentPage} />;
      case 'orders':
        return <OrdersPage onPageChange={setCurrentPage} />;
      case 'favorites':
        return <FavoritesPage onPageChange={setCurrentPage} onAddToCart={handleAddToCart} />;
      case 'promotions':
        return <PromotionsPage onPageChange={setCurrentPage} />;
      case 'test-api':
        return <TestApiPage />;
      case 'forgot-password':
        return <ForgotPasswordForm 
          onPageChange={handlePageChange} 
          onTokenGenerated={setResetToken}
        />;
      case 'reset-password':
        return <ResetPasswordPage email={resetEmail} otp={resetOtp} />;
      case 'checkout':
        return <CheckoutPage onPageChange={handlePageChange} cartItems={cartItems} user={user} />;
      case 'payment':
        return <PaymentPage onPageChange={handlePageChange} checkoutData={checkoutData} />;
      case 'payment-result':
        return <PaymentResultPage onPageChange={setCurrentPage} />;
      case 'order-success':
        return <OrderSuccessPage onPageChange={setCurrentPage} orderData={orderData} />;
      case 'search':
        return (
          <SearchResultsPage
            query={searchQuery}
            onPageChange={setCurrentPage}
            onSearch={handleSearch}
            onAddToCart={handleAddToCart}
            onProductClick={handleProductClick}
          />
        );
      default:
        return (
          <HomePage 
            onAddToCart={handleAddToCart} 
            onProductClick={handleProductClick}
          />
        );
    }
  };

  // Check if current page should show full layout or standalone
  const isStandalonePage = currentPage === 'login' || currentPage === 'register' || currentPage === 'admin' || currentPage === 'profile' || currentPage === 'orders' || currentPage === 'favorites' || currentPage === 'forgot-password' || currentPage === 'reset-password';

  if (isStandalonePage) {
    // Render standalone pages without header/footer
    return (
      <div className="min-h-screen">
        {renderCurrentPage()}
      </div>
    );
  }

  // Render pages with full layout
  return (
    <div className="min-h-screen flex flex-col">
      <Header
        currentPage={currentPage}
        onPageChange={setCurrentPage}
        cartItemCount={getTotalCartItems()}
        user={user}
        onShowAuthModal={() => setShowAuthModal(true)}
        onShowCartDropdown={() => setShowCartDropdown(true)}
        onShowUserMenu={() => setShowUserMenu(true)}
        onCategorySelect={handleCategorySelect}
        onShowNotifications={() => setShowNotifications(true)}
        onSearch={handleSearch}
      />
      
      <main className="flex-1">
        {renderCurrentPage()}
      </main>
      
      <Footer />

      {/* Modals and Dropdowns */}
      <AuthModal
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
        onPageChange={setCurrentPage}
      />

      {showCartDropdown && (
        <CartDropdown
          onClose={() => setShowCartDropdown(false)}
          onPageChange={setCurrentPage}
        />
      )}

      {showUserMenu && user && (
        <UserProfileDropdown
          user={user}
          onClose={() => setShowUserMenu(false)}
          onLogout={handleLogout}
          onPageChange={setCurrentPage}
        />
      )}

      {showNotifications && user && (
        <NotificationCenter
          onClose={() => setShowNotifications(false)}
        />
      )}

      {/* Scroll to Top Button */}
      <ScrollToTop />

      {/* Toast notifications */}
      <Toaster position="top-right" richColors />
    </div>
  );
}
