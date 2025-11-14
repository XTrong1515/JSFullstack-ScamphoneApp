import { api } from './api';

export interface SearchFilters {
  category?: string;
  priceRange?: {
    min: number;
    max: number;
  };
  brand?: string[];
  rating?: number;
  sortBy?: 'price-asc' | 'price-desc' | 'rating' | 'newest';
  page?: number;
  limit?: number;
}

export interface SearchResult {
  products: Array<{
    _id: string;
    name: string;
    price: number;
    originalPrice?: number;
    image: string;
    rating: number;
    discount?: number;
    isHot?: boolean;
    brand?: string;
    category?: string;
  }>;
  total: number;
  page: number;
  totalPages: number;
  suggestions?: {
    accessories?: any[];
    similarPrice?: any[];
    hotDeals?: any[];
  };
}

export const searchService = {
  // Tìm kiếm sản phẩm với filter
  searchProducts: async (
    query: string,
    filters: SearchFilters = {}
  ): Promise<SearchResult> => {
    const response = await api.get('/products/search', {
      params: {
        q: query,
        ...filters,
        priceRange: filters.priceRange 
          ? `${filters.priceRange.min}-${filters.priceRange.max}`
          : undefined,
        brand: filters.brand?.join(',')
      }
    });
    return response.data as SearchResult;
  },

  // Lấy danh sách thương hiệu
  getBrands: async (): Promise<string[]> => {
    const response = await api.get('/products/brands');
    return response.data;
  },

  // Lấy khoảng giá sản phẩm
  getPriceRange: async (): Promise<{ min: number; max: number }> => {
    const response = await api.get('/products/price-range');
    return response.data;
  },

  // Gợi ý tìm kiếm
  getSuggestions: async (query: string): Promise<string[]> => {
    const response = await api.get('/products/suggestions', {
      params: { q: query }
    });
    return response.data;
  }
};