import React, { createContext, useContext, useReducer, useEffect } from 'react';
import { User, AuthState, LoginForm, RegisterForm } from '@/types';
import axios from 'axios';

interface AuthContextType extends AuthState {
  login: (credentials: LoginForm) => Promise<void>;
  register: (userData: RegisterForm) => Promise<void>;
  logout: () => void;
  updateUser: (userData: Partial<User>) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

type AuthAction =
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_USER'; payload: User }
  | { type: 'SET_TOKEN'; payload: string }
  | { type: 'LOGOUT' }
  | { type: 'UPDATE_USER'; payload: Partial<User> };

const authReducer = (state: AuthState, action: AuthAction): AuthState => {
  switch (action.type) {
    case 'SET_LOADING':
      return { ...state, isLoading: action.payload };
    case 'SET_USER':
      return { ...state, user: action.payload, isAuthenticated: true, isLoading: false };
    case 'SET_TOKEN':
      return { ...state, token: action.payload };
    case 'LOGOUT':
      return { user: null, token: null, isAuthenticated: false, isLoading: false };
    case 'UPDATE_USER':
      return { ...state, user: state.user ? { ...state.user, ...action.payload } : null };
    default:
      return state;
  }
};

const initialState: AuthState = {
  user: null,
  token: null,
  isAuthenticated: false,
  isLoading: true,
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [state, dispatch] = useReducer(authReducer, initialState);

  // Check for existing token on app load
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      dispatch({ type: 'SET_TOKEN', payload: token });
      verifyToken(token);
    } else {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  }, []);

  const verifyToken = async (token: string) => {
    try {
      const response = await axios.get('/api/auth/verify', {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (response.data.success) {
        dispatch({ type: 'SET_USER', payload: response.data.data });
      } else {
        localStorage.removeItem('token');
        dispatch({ type: 'LOGOUT' });
      }
    } catch (error) {
      localStorage.removeItem('token');
      dispatch({ type: 'LOGOUT' });
    }
  };

  const login = async (credentials: LoginForm) => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      
      const response = await axios.post('/api/auth/login', credentials);
      
      if (response.data.success) {
        const { token, user } = response.data.data;
        localStorage.setItem('token', token);
        dispatch({ type: 'SET_TOKEN', payload: token });
        dispatch({ type: 'SET_USER', payload: user });
      } else {
        throw new Error(response.data.message);
      }
    } catch (error: any) {
      dispatch({ type: 'SET_LOADING', payload: false });
      throw new Error(error.response?.data?.message || 'Login failed');
    }
  };

  const register = async (userData: RegisterForm) => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      
      const response = await axios.post('/api/auth/register', userData);
      
      if (response.data.success) {
        const { token, user } = response.data.data;
        localStorage.setItem('token', token);
        dispatch({ type: 'SET_TOKEN', payload: token });
        dispatch({ type: 'SET_USER', payload: user });
      } else {
        throw new Error(response.data.message);
      }
    } catch (error: any) {
      dispatch({ type: 'SET_LOADING', payload: false });
      throw new Error(error.response?.data?.message || 'Registration failed');
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    dispatch({ type: 'LOGOUT' });
  };

  const updateUser = (userData: Partial<User>) => {
    dispatch({ type: 'UPDATE_USER', payload: userData });
  };

  const value: AuthContextType = {
    ...state,
    login,
    register,
    logout,
    updateUser,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}; 