import { api } from './api';

export interface Review {
  _id: string;
  user: {
    _id: string;
    name: string;
    avatar?: string;
  };
  product: string;
  rating: number;
  comment: string;
  createdAt: string;
  isVerifiedPurchase?: boolean;
}

export interface ReviewCreateData {
  product: string;
  rating: number;
  comment: string;
}

export const reviewService = {
  async getProductReviews(productId: string) {
    const { data } = await api.get<{ reviews: Review[]; total: number }>(
      `/reviews/product/${productId}`
    );
    return data;
  },

  async createReview(reviewData: ReviewCreateData) {
    const { data } = await api.post<Review>('/reviews', reviewData);
    return data;
  },

  async updateReview(reviewId: string, reviewData: Partial<ReviewCreateData>) {
    const { data } = await api.put<Review>(`/reviews/${reviewId}`, reviewData);
    return data;
  },

  async deleteReview(reviewId: string) {
    await api.delete(`/reviews/${reviewId}`);
  }
};