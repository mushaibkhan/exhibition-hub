import React, { createContext, useContext, useEffect, useState } from 'react';
import { AppRole } from '@/types/database';

interface MockUser {
  id: string;
  email: string;
  full_name?: string;
}

interface AuthContextType {
  user: MockUser | null;
  session: { user: MockUser } | null;
  role: AppRole | null;
  isAdmin: boolean;
  isMaintainer: boolean;
  isLoading: boolean;
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>;
  signUp: (email: string, password: string, fullName: string) => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const STORAGE_KEY = 'mock_auth';
const STORAGE_ROLE_KEY = 'mock_user_role';

// Mock users - in a real app, this would be in a database
const MOCK_USERS: Record<string, { password: string; full_name?: string; role?: AppRole }> = {
  'admin@gmail.com': { password: 'admin123', full_name: 'Admin User', role: 'admin' },
  'maintainer@example.com': { password: 'maintainer123', full_name: 'Maintainer User', role: 'maintainer' },
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<MockUser | null>(null);
  const [role, setRole] = useState<AppRole | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Load user from localStorage on mount
    const storedUser = localStorage.getItem(STORAGE_KEY);
    const storedRole = localStorage.getItem(STORAGE_ROLE_KEY) as AppRole | null;
    
    if (storedUser) {
      try {
        const parsedUser = JSON.parse(storedUser);
        setUser(parsedUser);
        setRole(storedRole);
      } catch (e) {
        // Invalid stored data, clear it
        localStorage.removeItem(STORAGE_KEY);
        localStorage.removeItem(STORAGE_ROLE_KEY);
      }
    }
    
    setIsLoading(false);
  }, []);

  const signIn = async (email: string, password: string) => {
    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 300));
    
    // Normalize email - trim whitespace and convert to lowercase
    const normalizedEmail = email.trim().toLowerCase();
    const mockUser = MOCK_USERS[normalizedEmail];
    
    // Debug: log the login attempt
    console.log('Login attempt:', {
      originalEmail: email,
      normalizedEmail,
      passwordLength: password.length,
      userExists: !!mockUser,
      expectedPassword: mockUser?.password,
      passwordMatch: mockUser?.password === password
    });
    
    // Check if user exists and password matches
    if (mockUser && mockUser.password === password) {
      const userData: MockUser = {
        id: normalizedEmail.replace('@', '_').replace(/\./g, '_'),
        email: normalizedEmail,
        full_name: mockUser.full_name,
      };

      setUser(userData);
      setRole(mockUser.role || null);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(userData));
      if (mockUser.role) {
        localStorage.setItem(STORAGE_ROLE_KEY, mockUser.role);
      }

      return { error: null };
    }
    
    // If email is admin@gmail.com but wrong password, give helpful message
    if (normalizedEmail === 'admin@gmail.com') {
      return { error: new Error('Invalid password. Try: admin123') };
    }
    
    // If email is maintainer@example.com but wrong password
    if (normalizedEmail === 'maintainer@example.com') {
      return { error: new Error('Invalid password. Try: maintainer123') };
    }
    
    // Default error
    return { error: new Error('Invalid email or password. Try: admin@gmail.com / admin123') };
  };

  const signUp = async (email: string, password: string, fullName: string) => {
    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 300));
    
    const emailLower = email.toLowerCase();
    
    if (MOCK_USERS[emailLower]) {
      return { error: new Error('User already exists') };
    }

    // Create new user (default role is null - needs admin assignment)
    const userData: MockUser = {
      id: emailLower.replace('@', '_').replace(/\./g, '_'),
      email: emailLower,
      full_name: fullName,
    };

    // Store in mock users (in real app, this would go to database)
    MOCK_USERS[emailLower] = { password, full_name: fullName };
    
    setUser(userData);
    setRole(null); // New users need role assignment
    localStorage.setItem(STORAGE_KEY, JSON.stringify(userData));

    return { error: null };
  };

  const signOut = async () => {
    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 100));
    
    setUser(null);
    setRole(null);
    localStorage.removeItem(STORAGE_KEY);
    localStorage.removeItem(STORAGE_ROLE_KEY);
  };

  const value = {
    user,
    session: user ? { user } : null,
    role,
    isAdmin: role === 'admin',
    isMaintainer: role === 'maintainer',
    isLoading,
    signIn,
    signUp,
    signOut
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
