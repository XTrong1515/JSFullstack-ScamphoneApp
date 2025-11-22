import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface CartItem {
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

interface CartStore {
  cartItems: CartItem[];
  userId: string | null;
  appliedDiscount: {
    code: string;
    name: string;
    discountAmount: number;
    type: string;
    value: number;
  } | null;
  
  // Actions
  setUserId: (userId: string | null) => void;
  addToCart: (product: any, variant?: any) => void;
  updateQuantity: (itemId: string, quantity: number) => void;
  removeItem: (itemId: string) => void;
  clearCart: () => void;
  setDiscount: (discount: any) => void;
  removeDiscount: () => void;
  getTotalItems: () => number;
  getTotalPrice: () => number;
}

export const useCartStore = create<CartStore>()(
  persist(
    (set, get) => ({
      cartItems: [],
      userId: null,
      appliedDiscount: null,

      setUserId: (userId) => {
        const currentUserId = get().userId;
        if (currentUserId !== userId) {
          // User changed, clear cart
          set({ userId, cartItems: [], appliedDiscount: null });
        }
      },

      addToCart: (product, variant) => {
        set((state) => {
          const prodId = product.id ?? product._id;
          const variantKey = variant ? JSON.stringify(variant.attributes) : null;
          
          // Find existing item with same product and variant
          const existingItem = state.cartItems.find(item => {
            const itemVariantKey = item.selectedVariant 
              ? JSON.stringify(item.selectedVariant.attributes)
              : null;
            return item.id === prodId && itemVariantKey === variantKey;
          });

          if (existingItem) {
            // Increment quantity
            return {
              cartItems: state.cartItems.map(item => {
                const itemVariantKey = item.selectedVariant 
                  ? JSON.stringify(item.selectedVariant.attributes)
                  : null;
                return item.id === prodId && itemVariantKey === variantKey
                  ? { ...item, quantity: item.quantity + 1 }
                  : item;
              })
            };
          } else {
            // Add new item
            const newItem: CartItem = {
              id: prodId,
              name: product.name,
              price: variant?.price ?? product.price,
              originalPrice: product.originalPrice,
              image: variant?.image ?? product.image,
              quantity: 1,
              discount: product.discount,
              selectedVariant: variant
            };
            return {
              cartItems: [...state.cartItems, newItem]
            };
          }
        });
      },

      updateQuantity: (itemId, quantity) => {
        set((state) => ({
          cartItems: state.cartItems.map(item =>
            item.id === itemId ? { ...item, quantity } : item
          )
        }));
      },

      removeItem: (itemId) => {
        set((state) => ({
          cartItems: state.cartItems.filter(item => item.id !== itemId)
        }));
      },

      clearCart: () => {
        set({ cartItems: [], appliedDiscount: null });
      },

      setDiscount: (discount) => {
        set({ appliedDiscount: discount });
      },

      removeDiscount: () => {
        set({ appliedDiscount: null });
      },

      getTotalItems: () => {
        const { cartItems } = get();
        return cartItems.reduce((total, item) => total + item.quantity, 0);
      },

      getTotalPrice: () => {
        const { cartItems } = get();
        return cartItems.reduce((total, item) => total + (item.price * item.quantity), 0);
      }
    }),
    {
      name: 'scamphone-cart'
    }
  )
);
