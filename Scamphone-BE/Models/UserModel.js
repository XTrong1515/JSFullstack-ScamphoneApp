import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const addressSchema = new mongoose.Schema({
    fullName: { type: String, required: true },
    phone: { type: String, required: true },
    address: { type: String, required: true }, // Số nhà, tên đường
    ward: { type: String, required: true }, // Phường/Xã
    district: { type: String, required: true }, // Quận/Huyện
    city: { type: String, required: true }, // Tỉnh/Thành phố
    isDefault: { type: Boolean, default: false }
}, { _id: true });

const userSchema = new mongoose.Schema({
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    phone: { type: String },
    address: { type: String }, // Kept for backward compatibility
    role: { type: String, enum: ['user', 'admin'], default: 'user' },
    isLocked: { type: Boolean, default: false },
    loyaltyPoints: { type: Number, default: 0 },
    resetPasswordToken: String,
    resetPasswordExpires: Date,
    addresses: [addressSchema] // Sổ địa chỉ
}, { timestamps: true });

// Hash password before saving
userSchema.pre('save', async function(next) {
    if (!this.isModified('password')) {
        return next();
    }
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
});

// Method to compare password (async with bcrypt.compare)
userSchema.methods.comparePassword = async function(candidatePassword) {
    return bcrypt.compare(candidatePassword, this.password);
};

export default mongoose.model('User', userSchema);