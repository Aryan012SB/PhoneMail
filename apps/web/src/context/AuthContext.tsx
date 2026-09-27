import React, { createContext, useContext, useState, useEffect } from 'react';
import { User } from '../types';
import { api, setToken, removeToken, getToken } from '../services/api';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  loginWithOtp: (phone: string, otp: string) => Promise<void>;
  registerWeb: (phone: string, name?: string, password?: string) => Promise<void>;
  loginPassword: (phone: string, pass: string) => Promise<void>;
  quickDemoLogin: (phone: string) => Promise<void>;
  logout: () => void;
  refreshUser: () => Promise<void>;
  simulateIvr: (phone: string) => Promise<any>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  const refreshUser = async () => {
    const token = getToken();
    if (!token) {
      setUser(null);
      setLoading(false);
      return;
    }
    try {
      const userData = await api.getMe();
      setUser(userData);
    } catch (err) {
      console.warn('Auth token expired or invalid:', err);
      removeToken();
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refreshUser();
  }, []);

  const loginWithOtp = async (phone: string, otp: string) => {
    const res = await api.verifyOtp(phone, otp);
    setToken(res.token);
    setUser(res.user);
  };

  const registerWeb = async (phone: string, name?: string, password?: string) => {
    const res = await api.register({ phoneNumber: phone, name, password });
    setToken(res.token);
    setUser(res.user);
  };

  const loginPassword = async (phone: string, pass: string) => {
    const res = await api.login(phone, pass);
    setToken(res.token);
    setUser(res.user);
  };

  const logout = () => {
    removeToken();
    setUser(null);
  };

  const quickDemoLogin = async (phone: string) => {
    const res = await api.demoLogin(phone);
    setToken(res.token);
    setUser(res.user);
  };

  const simulateIvr = async (phone: string) => {
    return await api.simulateIvrCall(phone, '1');
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        loginWithOtp,
        registerWeb,
        loginPassword,
        quickDemoLogin,
        logout,
        refreshUser,
        simulateIvr,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
};
