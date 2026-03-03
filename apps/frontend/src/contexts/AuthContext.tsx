import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { AppRole } from '@/types/database';
import { api } from '@/lib/api';

interface AuthUser {
  id: string;
  email: string;
  full_name: string | null;
  phone: string | null;
  is_active: boolean;
  roles: AppRole[];
}

interface AuthContextType {
  user: AuthUser | null;
  session: { user: AuthUser } | null;
  role: AppRole | null;
  isAdmin: boolean;
  isMaintainer: boolean;
  isLoading: boolean;
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>;
  signUp: (email: string, password: string, fullName: string) => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const TOKEN_KEY = 'exhibition_hub_token';

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const role: AppRole | null = user?.roles?.[0] ?? null;
  const isAdmin = user?.roles?.includes('admin') ?? false;
  const isMaintainer = user?.roles?.includes('maintainer') ?? false;

  const clearAuth = useCallback(() => {
    localStorage.removeItem(TOKEN_KEY);
    setUser(null);
  }, []);

  useEffect(() => {
    const token = localStorage.getItem(TOKEN_KEY);

    if (token) {
      api.get<AuthUser & { roles: AppRole[] }>('/auth/me')
        .then((freshUser) => {
          const userData: AuthUser = {
            id: freshUser.id,
            email: freshUser.email,
            full_name: freshUser.full_name,
            phone: freshUser.phone,
            is_active: freshUser.is_active,
            roles: freshUser.roles,
          };
          setUser(userData);
        })
        .catch(() => {
          clearAuth();
        })
        .finally(() => {
          setIsLoading(false);
        });
    } else {
      setIsLoading(false);
    }
  }, [clearAuth]);

  const signIn = async (email: string, password: string) => {
    try {
      const response = await api.post<{ token: string; user: AuthUser }>('/auth/login', {
        email,
        password,
      });

      localStorage.setItem(TOKEN_KEY, response.token);
      setUser(response.user);

      return { error: null };
    } catch (err) {
      return { error: err instanceof Error ? err : new Error('Login failed') };
    }
  };

  const signUp = async (email: string, password: string, fullName: string) => {
    try {
      await api.post('/auth/register', {
        email,
        password,
        full_name: fullName,
      });

      return { error: null };
    } catch (err) {
      return { error: err instanceof Error ? err : new Error('Registration failed') };
    }
  };

  const signOut = async () => {
    clearAuth();
  };

  const value: AuthContextType = {
    user,
    session: user ? { user } : null,
    role,
    isAdmin,
    isMaintainer,
    isLoading,
    signIn,
    signUp,
    signOut,
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
