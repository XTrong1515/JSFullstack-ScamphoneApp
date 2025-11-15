import { create } from 'zustand';
import { userService } from '../services/userService';

interface User {
  id: string;
  name: string;
  email: string;
  phone: string;
  avatar: string;
  role?: string;
}

interface UserStore {
  user: User | null;
  isLoading: boolean;
  error: string | null;
  
  // Actions
  setUser: (user: User | null) => void;
  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string) => Promise<void>;
  logout: () => void;
  fetchUser: () => Promise<void>;
  updateUser: (updates: Partial<User>) => void;
}

export const useUserStore = create<UserStore>((set, get) => ({
  user: null,
  isLoading: false,
  error: null,

  setUser: (user) => set({ user }),

  login: async (email: string, password: string) => {
    set({ isLoading: true, error: null });
    try {
      const response = await userService.login({ email, password });
      localStorage.setItem('token', response.token);
      
      const userData = {
        id: response.user._id,
        name: response.user.name,
        email: response.user.email,
        phone: response.user.phone || '',
        avatar: '',
        role: response.user.role
      };
      
      set({ user: userData, isLoading: false });
    } catch (error: any) {
      set({ error: error.message || 'Đăng nhập thất bại', isLoading: false });
      throw error;
    }
  },

  register: async (name: string, email: string, password: string) => {
    set({ isLoading: true, error: null });
    try {
      const response = await userService.register({ name, email, password, phone: '' });
      localStorage.setItem('token', response.token);
      
      const userData = {
        id: response.user._id,
        name: response.user.name,
        email: response.user.email,
        phone: response.user.phone || '',
        avatar: '',
        role: response.user.role
      };
      
      set({ user: userData, isLoading: false });
    } catch (error: any) {
      set({ error: error.message || 'Đăng ký thất bại', isLoading: false });
      throw error;
    }
  },

  logout: () => {
    localStorage.removeItem('token');
    set({ user: null, error: null });
  },

  fetchUser: async () => {
    const token = localStorage.getItem('token');
    if (!token) {
      set({ user: null });
      return;
    }

    set({ isLoading: true });
    try {
      const userData = await userService.getCurrentUser();
      const user = {
        id: userData._id,
        name: userData.name,
        email: userData.email,
        phone: userData.phone || '',
        avatar: '',
        role: userData.role
      };
      set({ user, isLoading: false });
    } catch (error) {
      console.error('Failed to fetch user:', error);
      localStorage.removeItem('token');
      set({ user: null, isLoading: false });
    }
  },

  updateUser: (updates) => {
    const { user } = get();
    if (user) {
      set({ user: { ...user, ...updates } });
    }
  }
}));
