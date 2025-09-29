// 社内スケジュール管理システム - 基本型定義

// ユーザー関連の型定義
export interface User {
  id: string;
  name: string;
  email: string;
  role: 'admin' | 'user';
  department?: string;
  createdAt: Date;
  lastLoginAt?: Date;
}

// タスク関連の型定義
export interface Task {
  id: string;
  title: string;
  startDate: Date;
  endDate: Date;
  assignedUserId: string;
  assignedUser?: User; // APIから取得時に含まれる
  categoryId: string;
  category?: Category; // APIから取得時に含まれる
  priority: 'high' | 'medium' | 'low';
  urgency: 1 | 2 | 3 | 4 | 5;
  status: 'not_started' | 'in_progress' | 'completed';
  sosFlag: boolean;
  sosComment?: string;
  clientName?: string;
  projectName?: string;
  relatedUsers?: User[]; // 関連ユーザーオブジェクト配列
  memo?: string;
  isDeleted: boolean;
  createdAt: Date;
  updatedAt: Date;
}

// カテゴリ関連の型定義
export interface Category {
  id: string;
  name: string;
  creatorId: string;
  creator?: User; // APIから取得時に含まれる
  createdAt: Date;
  _count?: {
    tasks: number;
  }; // APIから取得時に含まれるタスク数
}

// タスクテンプレート関連の型定義
export interface TaskTemplate {
  id: string;
  name: string;
  defaultValues: Partial<Omit<Task, 'id' | 'createdAt' | 'updatedAt'>>;
  creatorId: string;
  createdAt: Date;
}

// SOS関連の型定義
export interface SOSNotification {
  id: string;
  taskId: string;
  message?: string;
  createdAt: Date;
  isResolved: boolean;
  resolvedAt?: Date;
}

// チーム負荷メーター関連の型定義
export interface TeamLoadStatus {
  userId: string;
  userName: string;
  weeklyTaskCount: number;
  monthlyTaskCount: number;
  loadLevel: 'light' | 'normal' | 'heavy'; // 緑/黄/赤
}

// ガントチャート表示用の型定義
export interface GanttChartFilters {
  users?: string[];
  categories?: string[];
  statuses?: Task['status'][];
  priorities?: Task['priority'][];
  urgencies?: number[];
  dateRange?: {
    start: Date;
    end: Date;
  };
}

// APIレスポンス用の共通型
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

// フォーム関連の型定義
export interface TaskFormData {
  title: string;
  startDate: string;
  endDate: string;
  assignedUserId: string;
  categoryId: string;
  priority: Task['priority'];
  urgency: Task['urgency'];
  clientName?: string;
  projectName?: string;
  relatedUsers?: User[];
  memo?: string;
  sosFlag?: boolean;
  sosComment?: string;
}

// 認証関連の型定義
export interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}

// 通知関連の型定義
export interface Notification {
  id: string;
  type: 'info' | 'warning' | 'error' | 'success';
  title: string;
  message: string;
  createdAt: Date;
  isRead: boolean;
}