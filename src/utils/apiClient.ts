// API通信用のクライアント
import axios, { AxiosInstance, AxiosResponse } from 'axios';
import { ApiResponse } from '../types';

// APIベースURL（開発環境用）
const BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001/api';

// Axiosインスタンスを作成
const apiClient: AxiosInstance = axios.create({
  baseURL: BASE_URL,
  timeout: 10000, // 10秒でタイムアウト
  headers: {
    'Content-Type': 'application/json',
  },
});

// リクエストインターセプター（認証トークンの付与など）
apiClient.interceptors.request.use(
  (config) => {
    // ローカルストレージからトークンを取得
    const token = localStorage.getItem('auth-token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// レスポンスインターセプター（エラーハンドリング）
apiClient.interceptors.response.use(
  (response: AxiosResponse) => {
    return response;
  },
  (error) => {
    // 認証エラーの場合はログアウト処理
    if (error.response?.status === 401) {
      localStorage.removeItem('auth-token');
      // 必要に応じてログインページにリダイレクト
      window.location.href = '/login';
    }

    // ネットワークエラーの場合
    if (!error.response) {
      console.error('Network Error:', error.message);
      return Promise.reject(new Error('ネットワークエラーが発生しました'));
    }

    return Promise.reject(error);
  }
);

// 汎用的なAPIコール関数
export const apiCall = async <T>(
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH',
  endpoint: string,
  data?: any
): Promise<ApiResponse<T>> => {
  try {
    let response: AxiosResponse;

    switch (method) {
      case 'GET':
        response = await apiClient.get(endpoint);
        break;
      case 'POST':
        response = await apiClient.post(endpoint, data);
        break;
      case 'PUT':
        response = await apiClient.put(endpoint, data);
        break;
      case 'PATCH':
        response = await apiClient.patch(endpoint, data);
        break;
      case 'DELETE':
        response = await apiClient.delete(endpoint);
        break;
    }

    // バックエンドAPIは既に {success: true, data: ...} 形式で返すので、そのまま返す
    return response.data;
  } catch (error: any) {
    console.error(`API Error (${method} ${endpoint}):`, error);
    return {
      success: false,
      error: error.response?.data?.message || error.message || 'APIエラーが発生しました',
    };
  }
};

// 具体的なAPI関数群

/**
 * 認証関連API
 */
export const authApi = {
  // ログイン
  login: async (email: string, password: string) => {
    return apiCall<{ user: any; token: string }>('POST', '/auth/login', { email, password });
  },

  // ログアウト
  logout: () =>
    apiCall('POST', '/auth/logout'),

  // ユーザー情報取得（トークン検証）
  getProfile: () =>
    apiCall<any>('GET', '/auth/verify'),

  // パスワード変更
  changePassword: (currentPassword: string, newPassword: string) =>
    apiCall('PUT', '/auth/password', { currentPassword, newPassword }),
};

/**
 * ユーザー関連API
 */
export const userApi = {
  // ユーザー一覧取得
  getUsers: () =>
    apiCall<any[]>('GET', '/users'),

  // ユーザー作成
  createUser: (userData: any) =>
    apiCall<any>('POST', '/users', userData),

  // ユーザー更新
  updateUser: (userId: string, userData: any) =>
    apiCall<any>('PUT', `/users/${userId}`, userData),

  // ユーザー削除
  deleteUser: (userId: string) =>
    apiCall('DELETE', `/users/${userId}`),
};

/**
 * タスク関連API
 */
export const taskApi = {
  // タスク一覧取得
  getTasks: (params?: any) =>
    apiCall<any[]>('GET', '/tasks', params),

  // タスク作成
  createTask: (taskData: any) =>
    apiCall<any>('POST', '/tasks', taskData),

  // タスク更新
  updateTask: (taskId: string, taskData: any) =>
    apiCall<any>('PUT', `/tasks/${taskId}`, taskData),

  // タスク削除
  deleteTask: (taskId: string) =>
    apiCall('DELETE', `/tasks/${taskId}`),

  // SOS発信/解除
  toggleSOS: (taskId: string, sosFlag: boolean, sosComment?: string) =>
    apiCall('PATCH', `/tasks/${taskId}/sos`, { sosFlag, sosComment }),
};

/**
 * カテゴリ関連API
 */
export const categoryApi = {
  // カテゴリ一覧取得
  getCategories: () =>
    apiCall<any[]>('GET', '/categories'),

  // カテゴリ作成
  createCategory: (categoryData: any) =>
    apiCall<any>('POST', '/categories', categoryData),

  // カテゴリ更新
  updateCategory: (categoryId: string, categoryData: any) =>
    apiCall<any>('PUT', `/categories/${categoryId}`, categoryData),

  // カテゴリ削除
  deleteCategory: (categoryId: string) =>
    apiCall('DELETE', `/categories/${categoryId}`),
};

/**
 * テンプレート関連API
 */
export const templateApi = {
  // テンプレート一覧取得
  getTemplates: () =>
    apiCall<any[]>('GET', '/templates'),

  // テンプレート作成
  createTemplate: (templateData: any) =>
    apiCall<any>('POST', '/templates', templateData),

  // テンプレート更新
  updateTemplate: (templateId: string, templateData: any) =>
    apiCall<any>('PUT', `/templates/${templateId}`, templateData),

  // テンプレート削除
  deleteTemplate: (templateId: string) =>
    apiCall('DELETE', `/templates/${templateId}`),
};

/**
 * レポート関連API
 */
export const reportApi = {
  // 月次レポート取得
  getMonthlyReport: (year: number, month: number) =>
    apiCall<any>('GET', `/reports/monthly/${year}/${month}`),

  // ユーザー別実績取得
  getUserReport: (userId: string, startDate: string, endDate: string) =>
    apiCall<any>('GET', `/reports/user/${userId}?start=${startDate}&end=${endDate}`),

  // チーム負荷状況取得
  getTeamLoad: () =>
    apiCall<any[]>('GET', '/reports/team-load'),
};

export default apiClient;