import mongoose from "mongoose";

const orderItemSchema = new mongoose.Schema({
    product: { type: mongoose.Schema.Types.ObjectId, ref: "Product" },
    name: { type: String, required: true },
    quantity: { type: Number, required: true, min: 1 },
    price: { type: Number, required: true },
    image: { type: String },
    // Thông tin biến thể (nếu khách hàng mua variant cụ thể)
    variantAttributes: { type: Map, of: String }, // { "Màu sắc": "Đen", "Dung lượng": "256GB" }
    sku: { type: String } // Mã SKU của variant (nếu có)
});

const shippingAddressSchema = new mongoose.Schema({
    fullName: { type: String, required: true },
    phone: { type: String, required: true },
    address: { type: String, required: true },
    city: { type: String },
    district: { type: String }
}, { _id: false });

const orderSchema = new mongoose.Schema({
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    orderItems: [orderItemSchema],
    shippingAddress: { type: shippingAddressSchema, required: true },
    paymentMethod: { 
        type: String, 
        enum: ["COD", "VNPay", "Cash"],
        default: "COD"
    },
    totalPrice: { type: Number, required: true },
    status: {
        type: String,
        enum: ["pending", "processing", "shipping", "delivered", "cancelled"],
        default: "pending"
    },
    rejectionReason: { type: String },
    cancelReason: { type: String },
    cancelledBy: { type: String, enum: ['user', 'admin'], default: null },
    cancelledAt: { type: Date },
    isPaid: { type: Boolean, default: false },
    paidAt: { type: Date },
    isDelivered: { type: Boolean, default: false },
    deliveredAt: { type: Date }
}, { timestamps: true });

export default mongoose.model("Order", orderSchema);
