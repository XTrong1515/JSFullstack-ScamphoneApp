import { useState, useEffect } from 'react';
import { addressService, Address } from '../services/addressService';
import { toast } from 'sonner';

export function AddressManagement() {
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState<Omit<Address, '_id'>>({
    fullName: '',
    phone: '',
    address: '',
    ward: '',
    district: '',
    city: '',
    isDefault: false
  });

  useEffect(() => {
    loadAddresses();
  }, []);

  const loadAddresses = async () => {
    try {
      setIsLoading(true);
      const data = await addressService.getAddresses();
      setAddresses(data);
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Không thể tải danh sách địa chỉ');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      let updatedAddresses: Address[];
      
      if (editingId) {
        updatedAddresses = await addressService.updateAddress(editingId, formData);
        toast.success('Cập nhật địa chỉ thành công');
      } else {
        updatedAddresses = await addressService.addAddress(formData);
        toast.success('Thêm địa chỉ thành công');
      }
      
      setAddresses(updatedAddresses);
      resetForm();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Có lỗi xảy ra');
    }
  };

  const handleEdit = (address: Address) => {
    setFormData({
      fullName: address.fullName,
      phone: address.phone,
      address: address.address,
      ward: address.ward,
      district: address.district,
      city: address.city,
      isDefault: address.isDefault
    });
    setEditingId(address._id!);
    setShowAddForm(true);
  };

  const handleDelete = async (addressId: string) => {
    if (!confirm('Bạn có chắc muốn xóa địa chỉ này?')) return;
    
    try {
      const updatedAddresses = await addressService.deleteAddress(addressId);
      setAddresses(updatedAddresses);
      toast.success('Xóa địa chỉ thành công');
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Không thể xóa địa chỉ');
    }
  };

  const handleSetDefault = async (addressId: string) => {
    try {
      const updatedAddresses = await addressService.setDefaultAddress(addressId);
      setAddresses(updatedAddresses);
      toast.success('Đã đặt làm địa chỉ mặc định');
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Có lỗi xảy ra');
    }
  };

  const resetForm = () => {
    setFormData({
      fullName: '',
      phone: '',
      address: '',
      ward: '',
      district: '',
      city: '',
      isDefault: false
    });
    setEditingId(null);
    setShowAddForm(false);
  };

  if (isLoading) {
    return <div className="text-center py-8">Đang tải...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Sổ địa chỉ</h2>
        <button
          onClick={() => setShowAddForm(!showAddForm)}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          {showAddForm ? 'Hủy' : '+ Thêm địa chỉ mới'}
        </button>
      </div>

      {showAddForm && (
        <form onSubmit={handleSubmit} className="bg-gray-50 p-6 rounded-lg space-y-4">
          <h3 className="text-lg font-semibold">
            {editingId ? 'Sửa địa chỉ' : 'Thêm địa chỉ mới'}
          </h3>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Họ và tên *</label>
              <input
                type="text"
                required
                value={formData.fullName}
                onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Nguyễn Văn A"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-1">Số điện thoại *</label>
              <input
                type="tel"
                required
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="0912345678"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Địa chỉ *</label>
            <input
              type="text"
              required
              value={formData.address}
              onChange={(e) => setFormData({ ...formData, address: e.target.value })}
              className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Số nhà, tên đường"
            />
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Phường/Xã *</label>
              <input
                type="text"
                required
                value={formData.ward}
                onChange={(e) => setFormData({ ...formData, ward: e.target.value })}
                className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Phường 1"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-1">Quận/Huyện *</label>
              <input
                type="text"
                required
                value={formData.district}
                onChange={(e) => setFormData({ ...formData, district: e.target.value })}
                className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Quận 1"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-1">Tỉnh/Thành phố *</label>
              <input
                type="text"
                required
                value={formData.city}
                onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="TP. Hồ Chí Minh"
              />
            </div>
          </div>

          <div className="flex items-center">
            <input
              type="checkbox"
              id="isDefault"
              checked={formData.isDefault}
              onChange={(e) => setFormData({ ...formData, isDefault: e.target.checked })}
              className="w-4 h-4 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
            />
            <label htmlFor="isDefault" className="ml-2 text-sm">
              Đặt làm địa chỉ mặc định
            </label>
          </div>

          <div className="flex gap-3">
            <button
              type="submit"
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              {editingId ? 'Cập nhật' : 'Thêm địa chỉ'}
            </button>
            <button
              type="button"
              onClick={resetForm}
              className="px-6 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400"
            >
              Hủy
            </button>
          </div>
        </form>
      )}

      <div className="space-y-4">
        {addresses.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            Chưa có địa chỉ nào. Thêm địa chỉ để sử dụng khi đặt hàng.
          </div>
        ) : (
          addresses.map((address) => (
            <div
              key={address._id}
              className={`border rounded-lg p-4 ${
                address.isDefault ? 'border-blue-500 bg-blue-50' : 'border-gray-200'
              }`}
            >
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <h3 className="font-semibold text-lg">{address.fullName}</h3>
                    {address.isDefault && (
                      <span className="px-2 py-1 bg-blue-600 text-white text-xs rounded">
                        Mặc định
                      </span>
                    )}
                  </div>
                  <p className="text-gray-600">{address.phone}</p>
                  <p className="text-gray-700 mt-1">
                    {address.address}, {address.ward}, {address.district}, {address.city}
                  </p>
                </div>
                
                <div className="flex flex-col gap-2">
                  <button
                    onClick={() => handleEdit(address)}
                    className="px-3 py-1 text-sm text-blue-600 border border-blue-600 rounded hover:bg-blue-50"
                  >
                    Sửa
                  </button>
                  {!address.isDefault && (
                    <>
                      <button
                        onClick={() => handleSetDefault(address._id!)}
                        className="px-3 py-1 text-sm text-green-600 border border-green-600 rounded hover:bg-green-50"
                      >
                        Đặt mặc định
                      </button>
                      <button
                        onClick={() => handleDelete(address._id!)}
                        className="px-3 py-1 text-sm text-red-600 border border-red-600 rounded hover:bg-red-50"
                      >
                        Xóa
                      </button>
                    </>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
