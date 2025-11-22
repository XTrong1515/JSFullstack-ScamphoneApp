import { api } from './api';

export interface Address {
  _id?: string;
  fullName: string;
  phone: string;
  address: string;
  ward: string;
  district: string;
  city: string;
  isDefault: boolean;
}

export interface AddressResponse {
  success: boolean;
  addresses: Address[];
  message?: string;
}

class AddressService {
  // Get all addresses
  async getAddresses(): Promise<Address[]> {
    const response = await api.get<AddressResponse>('/addresses');
    return response.data.addresses;
  }

  // Add new address
  async addAddress(addressData: Omit<Address, '_id'>): Promise<Address[]> {
    const response = await api.post<AddressResponse>('/addresses', addressData);
    return response.data.addresses;
  }

  // Update address
  async updateAddress(addressId: string, addressData: Partial<Address>): Promise<Address[]> {
    const response = await api.put<AddressResponse>(`/addresses/${addressId}`, addressData);
    return response.data.addresses;
  }

  // Delete address
  async deleteAddress(addressId: string): Promise<Address[]> {
    const response = await api.delete<AddressResponse>(`/addresses/${addressId}`);
    return response.data.addresses;
  }

  // Set address as default
  async setDefaultAddress(addressId: string): Promise<Address[]> {
    const response = await api.put<AddressResponse>(`/addresses/${addressId}/set-default`);
    return response.data.addresses;
  }
}

export const addressService = new AddressService();
