import { api } from './api';

export const passwordResetService = {
  // Gửi yêu cầu reset password và nhận OTP
  requestReset: async (email: string) => {
    const response = await api.post('/password/request-reset', { email });
    return response.data;
  },

  // Reset password với email, OTP và mật khẩu mới
  resetPassword: async (email: string, otp: string, newPassword: string) => {
    const response = await api.post('/password/reset', {
      email,
      otp,
      newPassword
    });
    return response.data;
  }
};