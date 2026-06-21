'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { authApi } from '@/services/api';
import { useRouter } from 'next/navigation';

interface User {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  role: string;
  driver?: any;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType>({} as AuthContextType);

/** Landing route for a given role after login / on access mismatch. */
export function roleHome(role?: string): string {
  return role === 'DRIVER' ? '/driver' : '/dashboard';
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const storedToken = localStorage.getItem('roadtrix_token');
    const storedUser = localStorage.getItem('roadtrix_user');

    if (storedToken && storedUser) {
      setToken(storedToken);
      setUser(JSON.parse(storedUser));
    }
    setIsLoading(false);
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    const res = await authApi.login(email, password);
    const { token: newToken, user: newUser } = res.data.data;

    if (!['ADMIN', 'DISPATCHER', 'DRIVER'].includes(newUser.role)) {
      throw new Error('Access denied. This account cannot use the web app.');
    }

    localStorage.setItem('roadtrix_token', newToken);
    localStorage.setItem('roadtrix_user', JSON.stringify(newUser));
    setToken(newToken);
    setUser(newUser);
    router.push(roleHome(newUser.role));
  }, [router]);

  const logout = useCallback(() => {
    localStorage.removeItem('roadtrix_token');
    localStorage.removeItem('roadtrix_user');
    setToken(null);
    setUser(null);
    router.push('/login');
  }, [router]);

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isLoading,
        login,
        logout,
        isAuthenticated: !!token && !!user,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
