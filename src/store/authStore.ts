import { create } from 'zustand';
import { devtools } from 'zustand/middleware';

export interface AuthUser {
  id: string;
  email: string;
  name: string;
  picture: string;
}

export interface AuthState {
  user: AuthUser | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  accessToken: string | null;
  tokenExpiry: number | null;
}

export interface AuthActions {
  setUser: (user: AuthUser | null) => void;
  setToken: (accessToken: string | null, tokenExpiry: number | null) => void;
  logout: () => void;
  setLoading: (loading: boolean) => void;
}

const initialState: AuthState = {
  user: null,
  isAuthenticated: false,
  isLoading: false,
  accessToken: null,
  tokenExpiry: null,
};

export const useAuthStore = create<AuthState & AuthActions>()(
  devtools(
    (set) => ({
      ...initialState,
      setUser: (user) => set({ user, isAuthenticated: !!user }),
      setToken: (accessToken, tokenExpiry) => set({ accessToken, tokenExpiry }),
      logout: () => set({ ...initialState }),
      setLoading: (isLoading) => set({ isLoading }),
    }),
    { name: 'AuthStore' }
  )
);