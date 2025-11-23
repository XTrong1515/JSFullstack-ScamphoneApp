import mongoose from "mongoose";

const discountSchema = new mongoose.Schema({
  name: { type: String, required: true }, // Tên chương trình
  code: { type: String, required: true, unique: true, uppercase: true, trim: true },
  description: { type: String },
  
  // Loại giảm giá
  type: {
    type: String,
    enum: ['percentage', 'fixed_amount', 'free_shipping'],
    required: true,
    default: 'percentage'
  },
  
  // Giá trị giảm
  value: { type: Number, required: true, min: 0 }, // % hoặc số tiền
  maxDiscount: { type: Number, default: 0 }, // Giảm tối đa (cho percentage)
  
  // Điều kiện áp dụng
  minOrderValue: { type: Number, default: 0 }, // Đơn tối thiểu
  
  // Thời gian
  startDate: { type: Date, required: true },
  endDate: { type: Date, required: true },
  
  // Giới hạn sử dụng
  maxUses: { type: Number, default: null }, // null = không giới hạn
  usedCount: { type: Number, default: 0 },
  maxUsesPerUser: { type: Number, default: 1 },
  
  // Trạng thái
  status: {
    type: String,
    enum: ['active', 'inactive', 'expired'],
    default: 'active'
  },
  
  // Áp dụng cho
  applicableProducts: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Product' }],
  applicableCategories: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Category' }],
  
  // Tracking
  usedBy: [{
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    orderId: { type: mongoose.Schema.Types.ObjectId, ref: 'Order' },
    usedAt: { type: Date, default: Date.now },
    orderValue: { type: Number }
  }]
}, { timestamps: true });

// Index để tìm kiếm nhanh
discountSchema.index({ code: 1 });
discountSchema.index({ status: 1, startDate: 1, endDate: 1 });

// Method kiểm tra có thể sử dụng không
discountSchema.methods.canUse = function(userId, orderValue) {
  const now = new Date();
  
  // Check status
  if (this.status !== 'active') return { valid: false, message: 'Mã khuyến mãi không hoạt động' };
  
  // Check time
  if (now < this.startDate) return { valid: false, message: 'Mã khuyến mãi chưa bắt đầu' };
  if (now > this.endDate) return { valid: false, message: 'Mã khuyến mãi đã hết hạn' };
  
  // Check max uses
  if (this.maxUses && this.usedCount >= this.maxUses) {
    return { valid: false, message: 'Mã khuyến mãi đã hết lượt sử dụng' };
  }
  
  // Check min order value
  if (orderValue < this.minOrderValue) {
    return { valid: false, message: `Đơn hàng tối thiểu ${this.minOrderValue.toLocaleString()}đ` };
  }
  
  // Check user usage
  if (userId) {
    const userUsage = this.usedBy.filter(u => u.user.toString() === userId.toString()).length;
    if (userUsage >= this.maxUsesPerUser) {
      return { valid: false, message: 'Bạn đã sử dụng hết lượt của mã này' };
    }
  }
  
  return { valid: true };
};

// Method tính số tiền giảm
discountSchema.methods.calculateDiscount = function(orderValue) {
  if (this.type === 'percentage') {
    const discount = (orderValue * this.value) / 100;
    return this.maxDiscount > 0 ? Math.min(discount, this.maxDiscount) : discount;
  } else if (this.type === 'fixed_amount') {
    return Math.min(this.value, orderValue);
  } else if (this.type === 'free_shipping') {
    return 0; // Handled separately in shipping logic
  }
  return 0;
};

export default mongoose.model("Discount", discountSchema);