import mongoose from "mongoose";

const productSchema = new mongoose.Schema({
  name: { type: String, required: true, index: true },
  description: { type: String, required: true },
  price: { type: Number, required: true, min: 0 },
  originalPrice: { type: Number }, // Giá gốc trước khuyến mãi
  stock_quantity: { type: Number, required: true, default: 0, min: 0 },
  category: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Category",
    required: true
  },
  brand: { type: String }, // Thương hiệu: Apple, Samsung, etc.
  images: [{ type: String }], // Mảng URL ảnh
  image: { type: String }, // Ảnh chính (backward compatible)
  specifications: { type: Map, of: String }, // Thông số kỹ thuật
  
  // Product Attributes & Variants
  attributes: [{
    name: { type: String }, // "Màu sắc", "Dung lượng", "Kích cỡ"
    values: [{ type: String }] // ["Đen", "Trắng"], ["256GB", "512GB"]
  }],
  
  variants: [{
    attributes: { type: Map, of: String }, // { "Màu sắc": "Đen", "Dung lượng": "256GB" }
    price: { type: Number }, // Giá riêng của variant
    originalPrice: { type: Number }, // Giá gốc của variant
    stock: { type: Number, default: 0, min: 0 }, // Số lượng riêng - không cho phép âm
    sku: { type: String }, // Mã SKU duy nhất
    image: { type: String } // Ảnh riêng của variant (optional)
  }],
  
  rating: { type: Number, default: 0, min: 0, max: 5 },
  numReviews: { type: Number, default: 0 },
  discount: { type: Number, default: 0, min: 0, max: 100 }, // % giảm giá
  isHot: { type: Boolean, default: false }, // Sản phẩm hot
  isNewProduct: { type: Boolean, default: true }, // Sản phẩm mới (auto-expire sau 7 ngày)
  slug: { type: String, required: true, unique: true, index: true },
  status: { type: String, enum: ['active', 'inactive', 'out_of_stock'], default: 'active' }
}, { timestamps: true });

// Index để search nhanh
productSchema.index({ name: 'text', description: 'text' });
productSchema.index({ category: 1, status: 1 });
productSchema.index({ createdAt: -1 }); // Sort by newest

export default mongoose.model("Product", productSchema);