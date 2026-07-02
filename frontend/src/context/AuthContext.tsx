import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import api, { setAccessToken } from '../services/api';

export interface User {
  _id: string;
  name: string;
  email: string;
  role: 'student' | 'faculty' | 'admin';
  department?: {
    _id: string;
    name: string;
    code: string;
  };
  semester?: number;
  phone?: string;
  avatar?: string;
  isApproved: boolean;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<User>;
  register: (data: any) => Promise<string>;
  logout: () => Promise<void>;
  updateProfile: (data: any) => Promise<User>;
  checkAuth: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  // Initialize and check user session from Refresh Token Cookie
  const checkAuth = async () => {
    try {
      setLoading(true);
      // Request new Access Token using Refresh Token in HTTP-only Cookie
      const response = await api.post('/auth/refresh');
      const { accessToken, data } = response.data;
      setAccessToken(accessToken);
      setUser(data.user);
    } catch (error) {
      // Refresh token failed, clear state
      setAccessToken(null);
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    checkAuth();

    // Listen for automatic logout event from Axios interceptor
    const handleAuthExpired = () => {
      setUser(null);
      setAccessToken(null);
    };

    window.addEventListener('auth-expired', handleAuthExpired);
    return () => {
      window.removeEventListener('auth-expired', handleAuthExpired);
    };
  }, []);

  const login = async (email: string, password: string): Promise<User> => {
    try {
      setLoading(true);
      const response = await api.post('/auth/login', { email, password });
      const { accessToken, data } = response.data;
      setAccessToken(accessToken);
      setUser(data.user);
      return data.user;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Login failed. Please check credentials.');
    } finally {
      setLoading(false);
    }
  };

  const register = async (data: any): Promise<string> => {
    try {
      setLoading(true);
      const response = await api.post('/auth/register', data);
      const { message, accessToken, data: responseData } = response.data;

      // If user is a student, register will return an accessToken (logged in immediately)
      if (accessToken) {
        setAccessToken(accessToken);
        setUser(responseData.user);
      }
      return message || 'Registration successful';
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  const logout = async (): Promise<void> => {
    try {
      await api.post('/auth/logout');
    } catch (error) {
      console.error('Logout request failed', error);
    } finally {
      setAccessToken(null);
      setUser(null);
    }
  };

  const updateProfile = async (data: any): Promise<User> => {
    try {
      const response = await api.patch('/auth/update-me', data);
      const updatedUser = response.data.data.user;
      setUser(updatedUser);
      return updatedUser;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Profile update failed');
    }
  };

  const value: AuthContextType = {
    user,
    loading,
    isAuthenticated: !!user,
    login,
    register,
    logout,
    updateProfile,
    checkAuth,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
