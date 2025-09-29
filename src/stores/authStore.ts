// 認証状態管理ストア
import { create } from 'zustand';
import { AuthState, User } from '../types';

interface AuthStore extends AuthState {
  // アクション
  login: (user: User) => void;
  logout: () => void;
  setLoading: (isLoading: boolean) => void;
  updateUser: (user: Partial<User>) => void;
}

export const useAuthStore = create<AuthStore>((set, get) => ({
  // 初期状態
  user: null,
  isAuthenticated: false,
  isLoading: false,

  // アクション
  login: (user: User) => {
    set({
      user,
      isAuthenticated: true,
      isLoading: false,
    });
    // ローカルストレージに保存（簡易版）
    localStorage.setItem('user', JSON.stringify(user));
    localStorage.setItem('isAuthenticated', 'true');
  },

  logout: () => {
    set({
      user: null,
      isAuthenticated: false,
      isLoading: false,
    });
    // ローカルストレージから削除
    localStorage.removeItem('user');
    localStorage.removeItem('isAuthenticated');
    localStorage.removeItem('auth-token');
  },

  setLoading: (isLoading: boolean) => {
    set({ isLoading });
  },

  updateUser: (updatedUser: Partial<User>) => {
    const currentUser = get().user;
    if (currentUser) {
      const newUser = { ...currentUser, ...updatedUser };
      set({
        user: newUser,
      });
      localStorage.setItem('user', JSON.stringify(newUser));
    }
  },
}));

// アプリケーション起動時に認証状態を復元
const savedUser = localStorage.getItem('user');
const savedAuth = localStorage.getItem('isAuthenticated');
if (savedUser && savedAuth === 'true') {
  try {
    const user = JSON.parse(savedUser);
    useAuthStore.setState({
      user,
      isAuthenticated: true,
    });
  } catch (error) {
    console.error('Failed to restore auth state:', error);
    localStorage.removeItem('user');
    localStorage.removeItem('isAuthenticated');
  }
}