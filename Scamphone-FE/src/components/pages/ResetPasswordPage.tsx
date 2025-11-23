import { useState, useEffect } from 'react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Card } from '../ui/card';
import { Alert, AlertDescription } from '../ui/alert';
import { Loader2, Check } from 'lucide-react';
import { passwordResetService } from '../../services/passwordResetService';

interface ResetPasswordPageProps {
  email?: string;
  otp?: string;
}

export function ResetPasswordPage({ email: propEmail, otp: propOtp }: ResetPasswordPageProps) {
  const [email, setEmail] = useState<string>('');
  const [otp, setOtp] = useState<string>('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    // Sử dụng props nếu có, nếu không thì lấy từ URL hash
    if (propEmail && propOtp) {
      setEmail(propEmail);
      setOtp(propOtp);
    } else {
      // Lấy từ hash URL (/#reset-password?email=...&otp=...)
      const hash = window.location.hash;
      const queryString = hash.includes('?') ? hash.split('?')[1] : '';
      const params = new URLSearchParams(queryString);
      const emailFromUrl = params.get('email');
      const otpFromUrl = params.get('otp');
      
      if (emailFromUrl) setEmail(emailFromUrl);
      if (otpFromUrl) setOtp(otpFromUrl);
    }
  }, [propEmail, propOtp]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email || !otp) {
      setError('Thông tin email hoặc OTP không hợp lệ');
      return;
    }

    if (newPassword !== confirmPassword) {
      setError('Mật khẩu xác nhận không khớp');
      return;
    }

    if (newPassword.length < 6) {
      setError('Mật khẩu phải có ít nhất 6 ký tự');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      await passwordResetService.resetPassword(email, otp, newPassword);
      setSuccess(true);
      // Chuyển về trang đăng nhập sau 3 giây
      setTimeout(() => {
        window.location.href = '/';
        window.location.hash = '#login';
      }, 3000);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Có lỗi xảy ra');
    } finally {
      setIsLoading(false);
    }
  };

  if (!email || !otp) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Alert variant="destructive" className="max-w-md">
          <AlertDescription>
            Thông tin reset mật khẩu không hợp lệ. Vui lòng thực hiện lại quy trình quên mật khẩu.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center p-4">
      <Card className="p-8 w-full max-w-md shadow-2xl border-0">
        {success ? (
          <div className="text-center space-y-6">
            <div className="w-20 h-20 bg-gradient-to-br from-green-400 to-emerald-500 rounded-full flex items-center justify-center mx-auto animate-bounce">
              <Check className="w-10 h-10 text-white" />
            </div>
            <div>
              <h2 className="text-3xl font-bold bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent mb-3">
                Thành công!
              </h2>
              <p className="text-gray-600">
                Mật khẩu của bạn đã được đặt lại thành công
              </p>
            </div>
            <div className="bg-blue-50 border-2 border-blue-200 rounded-lg p-4">
              <p className="text-sm text-blue-700">
                Bạn sẽ được chuyển về trang đăng nhập trong vài giây...
              </p>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="text-center mb-6">
              <div className="w-16 h-16 bg-gradient-to-br from-blue-600 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
              </div>
              <h2 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-2">
                Đặt lại mật khẩu
              </h2>
              <p className="text-gray-600">
                Vui lòng nhập mật khẩu mới của bạn
              </p>
            </div>

            <div className="space-y-4">
              {/* Email Display (readonly) */}
              <div className="space-y-2">
                <Label htmlFor="email" className="text-sm font-semibold text-gray-700">
                  Email
                </Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  readOnly
                  className="bg-gray-50 text-gray-600 cursor-not-allowed"
                />
              </div>

              {/* OTP Display (readonly) */}
              <div className="space-y-2">
                <Label htmlFor="displayOtp" className="text-sm font-semibold text-gray-700">
                  Mã OTP
                </Label>
                <Input
                  id="displayOtp"
                  type="text"
                  value={otp}
                  readOnly
                  className="bg-gray-50 text-gray-600 cursor-not-allowed text-center tracking-widest font-mono"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="newPassword" className="text-sm font-semibold text-gray-700">
                  Mật khẩu mới
                </Label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                    </svg>
                  </div>
                  <Input
                    id="newPassword"
                    type="password"
                    value={newPassword}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => 
                      setNewPassword(e.target.value)
                    }
                    placeholder="Nhập mật khẩu mới (tối thiểu 6 ký tự)"
                    className="pl-10 py-6 text-base border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                    required
                    minLength={6}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirmPassword" className="text-sm font-semibold text-gray-700">
                  Xác nhận mật khẩu
                </Label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <Input
                    id="confirmPassword"
                    type="password"
                    value={confirmPassword}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => 
                      setConfirmPassword(e.target.value)
                    }
                    placeholder="Nhập lại mật khẩu mới"
                    className="pl-10 py-6 text-base border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                    required
                    minLength={6}
                  />
                </div>
              </div>
            </div>

            {error && (
              <div className="rounded-lg bg-red-50 border-2 border-red-200 p-4">
                <div className="flex items-start gap-3">
                  <svg className="h-5 w-5 text-red-600 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <p className="text-sm text-red-700">{error}</p>
                </div>
              </div>
            )}

            <Button
              type="submit"
              className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-semibold py-6 text-base shadow-lg hover:shadow-xl transition-all"
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                  Đang xử lý...
                </>
              ) : (
                <>
                  <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  Đặt lại mật khẩu
                </>
              )}
            </Button>
          </form>
        )}
      </Card>
    </div>
  );
}
