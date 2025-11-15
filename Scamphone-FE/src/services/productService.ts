import { api } from './api';

export interface Product {
  _id: string;
  name: string;
  description?: string;
  price: number;
  originalPrice?: number;
  stock_quantity: number;
  category: {
    _id: string;
    name: string;
  };
  brand?: string;
  image: string;
  images?: string[];
  specifications?: Record<string, string>;
  discount?: number;
  rating?: number;
  reviewCount?: number;
  status?: 'active' | 'inactive' | 'out_of_stock';
  isHot?: boolean;
  isNewProduct?: boolean;
  attributes?: {
    name: string;
    values: string[];
  }[];
  variants?: {
    attributes: Record<string, string>;
    price: number;
    originalPrice?: number;
    stock: number;
    sku?: string;
    image?: string;
  }[];
  createdAt: string;
  updatedAt: string;
}

export const productService = {
  async getAllProducts(params?: {
    page?: number;
    limit?: number;
    category?: string;
    search?: string;
    minPrice?: number;
    maxPrice?: number;
    brand?: string;
    sort?: string;
    status?: 'active' | 'inactive' | 'out_of_stock';
  }) {
    const { data } = await api.get<{ 
      products: Product[];
      total: number;
      page: number;
      pages: number;
    }>('/products', { params });
    return data;
  },

  async getProductById(id: string) {
    const { data } = await api.get<Product>(`/products/${id}`);
    return data;
  },

  async getNewProducts() {
    const { data } = await api.get<{ products: Product[] }>('/products/new');
    return data;
  },

  async getHotProducts() {
    const { data } = await api.get<{ products: Product[] }>('/products/hot');
    return data;
  },

  async updateProductStatus(id: string, status: 'active' | 'inactive' | 'out_of_stock') {
    const { data } = await api.put<Product>(`/products/${id}`, { status });
    return data;
  }
};