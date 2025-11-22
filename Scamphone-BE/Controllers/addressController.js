import User from '../Models/UserModel.js';

// @desc    Get all addresses of current user
// @route   GET /api/v1/users/addresses
// @access  Private
export const getAddresses = async (req, res) => {
    try {
        const user = await User.findById(req.user._id).select('addresses');
        
        if (!user) {
            return res.status(404).json({ message: 'Người dùng không tồn tại' });
        }

        res.status(200).json({
            success: true,
            addresses: user.addresses || []
        });
    } catch (error) {
        console.error('Get addresses error:', error);
        res.status(500).json({ message: 'Lỗi server khi lấy danh sách địa chỉ' });
    }
};

// @desc    Add new address
// @route   POST /api/v1/users/addresses
// @access  Private
export const addAddress = async (req, res) => {
    try {
        const { fullName, phone, address, ward, district, city, isDefault } = req.body;

        // Validate required fields
        if (!fullName || !phone || !address || !ward || !district || !city) {
            return res.status(400).json({ 
                message: 'Vui lòng điền đầy đủ thông tin địa chỉ' 
            });
        }

        const user = await User.findById(req.user._id);
        
        if (!user) {
            return res.status(404).json({ message: 'Người dùng không tồn tại' });
        }

        // If this is set as default, unset all other defaults
        if (isDefault) {
            user.addresses.forEach(addr => {
                addr.isDefault = false;
            });
        }

        // If this is the first address, make it default
        const shouldBeDefault = isDefault || user.addresses.length === 0;

        // Add new address
        user.addresses.push({
            fullName,
            phone,
            address,
            ward,
            district,
            city,
            isDefault: shouldBeDefault
        });

        await user.save();

        res.status(201).json({
            success: true,
            message: 'Thêm địa chỉ thành công',
            addresses: user.addresses
        });
    } catch (error) {
        console.error('Add address error:', error);
        res.status(500).json({ message: 'Lỗi server khi thêm địa chỉ' });
    }
};

// @desc    Update address
// @route   PUT /api/v1/users/addresses/:addressId
// @access  Private
export const updateAddress = async (req, res) => {
    try {
        const { addressId } = req.params;
        const { fullName, phone, address, ward, district, city, isDefault } = req.body;

        const user = await User.findById(req.user._id);
        
        if (!user) {
            return res.status(404).json({ message: 'Người dùng không tồn tại' });
        }

        const addressToUpdate = user.addresses.id(addressId);
        
        if (!addressToUpdate) {
            return res.status(404).json({ message: 'Địa chỉ không tồn tại' });
        }

        // If setting as default, unset all other defaults
        if (isDefault) {
            user.addresses.forEach(addr => {
                addr.isDefault = false;
            });
        }

        // Update fields
        if (fullName) addressToUpdate.fullName = fullName;
        if (phone) addressToUpdate.phone = phone;
        if (address) addressToUpdate.address = address;
        if (ward) addressToUpdate.ward = ward;
        if (district) addressToUpdate.district = district;
        if (city) addressToUpdate.city = city;
        if (isDefault !== undefined) addressToUpdate.isDefault = isDefault;

        await user.save();

        res.status(200).json({
            success: true,
            message: 'Cập nhật địa chỉ thành công',
            addresses: user.addresses
        });
    } catch (error) {
        console.error('Update address error:', error);
        res.status(500).json({ message: 'Lỗi server khi cập nhật địa chỉ' });
    }
};

// @desc    Delete address
// @route   DELETE /api/v1/users/addresses/:addressId
// @access  Private
export const deleteAddress = async (req, res) => {
    try {
        const { addressId } = req.params;

        const user = await User.findById(req.user._id);
        
        if (!user) {
            return res.status(404).json({ message: 'Người dùng không tồn tại' });
        }

        const addressToDelete = user.addresses.id(addressId);
        
        if (!addressToDelete) {
            return res.status(404).json({ message: 'Địa chỉ không tồn tại' });
        }

        const wasDefault = addressToDelete.isDefault;

        // Remove address
        addressToDelete.deleteOne();

        // If deleted address was default and there are other addresses, set the first one as default
        if (wasDefault && user.addresses.length > 0) {
            user.addresses[0].isDefault = true;
        }

        await user.save();

        res.status(200).json({
            success: true,
            message: 'Xóa địa chỉ thành công',
            addresses: user.addresses
        });
    } catch (error) {
        console.error('Delete address error:', error);
        res.status(500).json({ message: 'Lỗi server khi xóa địa chỉ' });
    }
};

// @desc    Set address as default
// @route   PUT /api/v1/users/addresses/:addressId/set-default
// @access  Private
export const setDefaultAddress = async (req, res) => {
    try {
        const { addressId } = req.params;

        const user = await User.findById(req.user._id);
        
        if (!user) {
            return res.status(404).json({ message: 'Người dùng không tồn tại' });
        }

        const addressToSetDefault = user.addresses.id(addressId);
        
        if (!addressToSetDefault) {
            return res.status(404).json({ message: 'Địa chỉ không tồn tại' });
        }

        // Unset all defaults
        user.addresses.forEach(addr => {
            addr.isDefault = false;
        });

        // Set this as default
        addressToSetDefault.isDefault = true;

        await user.save();

        res.status(200).json({
            success: true,
            message: 'Đã đặt làm địa chỉ mặc định',
            addresses: user.addresses
        });
    } catch (error) {
        console.error('Set default address error:', error);
        res.status(500).json({ message: 'Lỗi server khi đặt địa chỉ mặc định' });
    }
};
