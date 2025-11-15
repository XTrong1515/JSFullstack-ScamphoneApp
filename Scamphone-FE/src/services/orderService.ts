import { api } from './api';

export interface OrderItem {
  product?: string;
  name: string;
  quantity: number;
  price: number;
  image?: string;
  // Thông tin biến thể (nếu khách hàng mua variant cụ thể)
  variantAttributes?: { [key: string]: string }; // { "Màu sắc": "Đen", "Dung lượng": "256GB" }
  sku?: string; // Mã SKU của variant
}

export interface ShippingAddress {
  fullName: string;
  phone: string;
  address: string;
  city?: string;
  district?: string;
}

export interface Order {
  _id: string;
  user: string;
  orderItems: OrderItem[];
  shippingAddress: ShippingAddress;
  paymentMethod: 'COD' | 'VNPay' | 'Cash';
  totalPrice: number;
  status: 'pending' | 'processing' | 'shipping' | 'delivered' | 'cancelled';
  rejectionReason?: string;
  cancelReason?: string;
  cancelledBy?: 'user' | 'admin';
  cancelledAt?: string;
  isPaid: boolean;
  paidAt?: string;
  isDelivered: boolean;
  deliveredAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateOrderData {
  orderItems: OrderItem[];
  shippingAddress: ShippingAddress;
  paymentMethod: 'COD' | 'VNPay';
  totalPrice: number;
}

export const orderService = {
  // User APIs
  async createOrder(orderData: CreateOrderData) {
    const { data } = await api.post<Order>('/orders', orderData);
    return data;
  },

  async getUserOrders() {
    const { data } = await api.get<Order[]>('/orders/myorders');
    return data;
  },

  async getOrderById(id: string) {
    const { data } = await api.get<Order>(`/orders/${id}`);
    return data;
  },

  // Admin APIs
  async getAllOrders() {
    const { data } = await api.get<Order[]>('/orders');
    return data;
  },

  async updateOrderStatus(id: string, status: Order['status']) {
    const { data } = await api.put<Order>(`/orders/${id}/status`, { status });
    return data;
  },

  async confirmOrder(id: string) {
    const { data } = await api.put<Order>(`/orders/${id}/confirm`);
    return data;
  },

  async rejectOrder(id: string, reason: string) {
    const { data } = await api.put<Order>(`/orders/${id}/reject`, { reason });
    return data;
  },

  async cancelOrder(id: string, reason?: string) {
    const { data } = await api.put<Order>(`/orders/${id}/cancel`, { reason });
    return data;
  }
};
