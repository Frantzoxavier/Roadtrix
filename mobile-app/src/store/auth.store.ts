import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { authApi } from '../services/api';

interface User {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  role: string;
  driver?: {
    id: string;
    status: string;
    vehicleType: string;
    vehicleMake: string;
    vehicleModel: string;
    plateNumber: string;
    rating: number;
  };
}

interface AuthState {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  loadFromStorage: () => Promise<void>;
  updateUser: (user: Partial<User>) => void;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  token: null,
  isLoading: true,
  isAuthenticated: false,

  loadFromStorage: async () => {
    try {
      const [token, userStr] = await AsyncStorage.multiGet(['roadtrix_token', 'roadtrix_user']);
      if (token[1] && userStr[1]) {
        set({
          token: token[1],
          user: JSON.parse(userStr[1]),
          isAuthenticated: true,
        });
      }
    } catch {
      // ignore
    } finally {
      set({ isLoading: false });
    }
  },

  login: async (email: string, password: string) => {
    const res = await authApi.login(email, password);
    const { token, user } = res.data.data;

    if (user.role !== 'DRIVER') {
      throw new Error('This app is for drivers only. Please use the admin dashboard.');
    }

    await AsyncStorage.multiSet([
      ['roadtrix_token', token],
      ['roadtrix_user', JSON.stringify(user)],
    ]);

    set({ token, user, isAuthenticated: true });
  },

  logout: async () => {
    await AsyncStorage.multiRemove(['roadtrix_token', 'roadtrix_user']);
    set({ token: null, user: null, isAuthenticated: false });
  },

  updateUser: (updates) => {
    const current = get().user;
    if (current) {
      const updated = { ...current, ...updates };
      set({ user: updated });
      AsyncStorage.setItem('roadtrix_user', JSON.stringify(updated));
    }
  },
}));
