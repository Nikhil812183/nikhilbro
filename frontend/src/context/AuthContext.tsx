'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '../services/api';

interface User {
  id: number;
  email: string;
  role: string;
  name: string;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  loading: boolean;
  requireOtp: boolean;
  error: string | null;
  login: (email: string, password: string) => Promise<boolean>;
  registerUser: (payload: any) => Promise<void>;
  verifyOtp: (otp: string) => Promise<void>;
  logout: () => void;
  setError: (error: string | null) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [requireOtp, setRequireOtp] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    // Restore session on mount
    const savedToken = localStorage.getItem('token');
    const savedUser = localStorage.getItem('user');

    if (savedToken && savedUser) {
      setToken(savedToken);
      setUser(JSON.parse(savedUser));
    }
    setLoading(false);
  }, []);

  const login = async (email: string, password: string): Promise<boolean> => {
    setError(null);
    setLoading(true);
    try {
      const res = await api.login({ email, password });
      
      // Temporarily store token in memory
      setToken(res.token);
      setUser(res.user);
      
      if (res.requireOtp) {
        setRequireOtp(true);
        localStorage.setItem('tempToken', res.token);
        localStorage.setItem('tempUser', JSON.stringify(res.user));
        router.push('/otp-verify');
        return false;
      }
      
      // Zero OTP fallback path (if configured)
      localStorage.setItem('token', res.token);
      localStorage.setItem('user', JSON.stringify(res.user));
      router.push('/dashboard');
      return true;
    } catch (err: any) {
      setError(err.message || 'Login failed');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const verifyOtp = async (otp: string) => {
    setError(null);
    setLoading(true);
    try {
      await api.verifyOtp(otp);
      
      // Move temp values to permanent session
      const t = localStorage.getItem('tempToken');
      const u = localStorage.getItem('tempUser');
      
      if (t && u) {
        localStorage.setItem('token', t);
        localStorage.setItem('user', u);
        setToken(t);
        setUser(JSON.parse(u));
        
        localStorage.removeItem('tempToken');
        localStorage.removeItem('tempUser');
      }
      
      setRequireOtp(false);
      router.push('/dashboard');
    } catch (err: any) {
      setError(err.message || 'Invalid OTP code');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const registerUser = async (payload: any) => {
    setError(null);
    setLoading(true);
    try {
      await api.register(payload);
      router.push('/login');
    } catch (err: any) {
      setError(err.message || 'Registration failed');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
    setToken(null);
    setRequireOtp(false);
    router.push('/login');
  };

  return (
    <AuthContext.Provider value={{
      user,
      token,
      loading,
      requireOtp,
      error,
      login,
      registerUser,
      verifyOtp,
      logout,
      setError
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
