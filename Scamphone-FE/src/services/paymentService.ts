import { api } from './api';

export interface VNPayPaymentRequest {
  orderId: string;
  amount: number;
  orderInfo?: string;
  ipAddr?: string;
}

export interface VNPayPaymentResponse {
  success: boolean;
  paymentUrl: string;
  orderId: string;
}

export interface VNPayReturnData {
  success: boolean;
  code: string;
  message: string;
  orderId: string;
  amount: number;
}

export const paymentService = {
  async createVNPayPayment(data: VNPayPaymentRequest): Promise<VNPayPaymentResponse> {
    const { data: response } = await api.post<VNPayPaymentResponse>('/payment/vnpay/create', data);
    return response;
  },

  async verifyVNPayReturn(queryParams: URLSearchParams): Promise<VNPayReturnData> {
    const { data } = await api.get<VNPayReturnData>('/payment/vnpay/return', {
      params: Object.fromEntries(queryParams)
    });
    return data;
  }
};
