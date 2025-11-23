import User from '../Models/UserModel.js';
import crypto from 'crypto';
import bcrypt from 'bcryptjs';

// Tạo mã OTP 6 chữ số
const generateOTP = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

// Gửi yêu cầu reset password với OTP
export const requestPasswordReset = async (req, res) => {
  try {
    const { email } = req.body;
    const user = await User.findOne({ email });

    if (!user) {
      return res.status(404).json({ message: 'Không tìm thấy tài khoản với email này' });
    }

    // Tạo OTP 6 chữ số và thời gian hết hạn (15 phút)
    const otp = generateOTP();
    const otpExpiry = Date.now() + 15 * 60 * 1000; // 15 phút

    // Hash OTP trước khi lưu (bảo mật)
    const salt = await bcrypt.genSalt(10);
    const hashedOTP = await bcrypt.hash(otp, salt);

    // Lưu OTP vào database
    user.resetPasswordToken = hashedOTP;
    user.resetPasswordExpires = otpExpiry;
    await user.save();

    // TODO: Gửi email chứa OTP bằng nodemailer
    // Ở đây bạn sẽ tích hợp nodemailer để gửi email
    console.log(`[OTP] Generated OTP for ${email}: ${otp}`);

    res.json({
      message: 'Mã OTP đã được gửi vào email của bạn',
      // Chỉ trả về OTP trong development để test
      otp: process.env.NODE_ENV === 'development' ? otp : undefined,
      expiresIn: '15 phút'
    });
  } catch (error) {
    res.status(500).json({ message: 'Lỗi server', error: error.message });
  }
};

// Verify OTP và reset password
export const resetPassword = async (req, res) => {
  try {
    const { email, otp, newPassword } = req.body;

    if (!email || !otp || !newPassword) {
      return res.status(400).json({ 
        message: 'Vui lòng cung cấp đầy đủ email, OTP và mật khẩu mới' 
      });
    }

    // Tìm user theo email
    const user = await User.findOne({
      email,
      resetPasswordExpires: { $gt: Date.now() }
    });

    if (!user) {
      return res.status(400).json({
        message: 'Email không hợp lệ hoặc OTP đã hết hạn'
      });
    }

    // Verify OTP (so sánh với hash)
    const isOTPValid = await bcrypt.compare(otp, user.resetPasswordToken);
    
    if (!isOTPValid) {
      return res.status(400).json({
        message: 'Mã OTP không chính xác'
      });
    }

    // Cập nhật password và xóa OTP (pre-save hook sẽ tự hash password)
    user.password = newPassword;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpires = undefined;
    await user.save();

    res.json({ message: 'Mật khẩu đã được cập nhật thành công' });
  } catch (error) {
    res.status(500).json({ message: 'Lỗi server', error: error.message });
  }
};