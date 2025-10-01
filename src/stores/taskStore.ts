// タスク管理ストア
import { create } from 'zustand';
import { Task, Category, TaskTemplate, SOSNotification } from '../types';
import { taskApi, categoryApi } from '../utils/apiClient';

interface TaskStore {
  // 状態
  tasks: Task[];
  categories: Category[];
  templates: TaskTemplate[];
  sosNotifications: SOSNotification[];
  isLoading: boolean;
  error: string | null;

  // データ取得アクション
  loadTasks: () => Promise<void>;
  loadCategories: () => Promise<void>;

  // タスク関連アクション
  setTasks: (tasks: Task[]) => void;
  addTask: (task: Task) => void;
  updateTask: (taskId: string, updates: Partial<Task>) => void;
  deleteTask: (taskId: string) => void;
  toggleSOS: (taskId: string, comment?: string) => void;

  // カテゴリ関連アクション
  setCategories: (categories: Category[]) => void;
  addCategory: (category: Category) => void;

  // テンプレート関連アクション
  setTemplates: (templates: TaskTemplate[]) => void;
  addTemplate: (template: TaskTemplate) => void;

  // SOS通知関連アクション
  setSosNotifications: (notifications: SOSNotification[]) => void;
  resolveSOS: (taskId: string) => void;

  // ユーティリティアクション
  setLoading: (isLoading: boolean) => void;
  setError: (error: string | null) => void;
}

export const useTaskStore = create<TaskStore>((set, get) => ({
  // 初期状態
  tasks: [],
  categories: [],
  templates: [],
  sosNotifications: [],
  isLoading: false,
  error: null,

  // データ取得アクション
  loadTasks: async () => {
    try {
      set({ isLoading: true, error: null });
      const response = await taskApi.getTasks();
      if (response.success && response.data) {
        // データ形式を変換（バックエンドのenum形式をフロントエンドの形式に）
        const tasks = response.data.map((task: any) => ({
          ...task,
          priority: task.priority?.toLowerCase() as 'high' | 'medium' | 'low',
          status: task.status?.toLowerCase().replace('_', '') as 'not_started' | 'in_progress' | 'completed',
          startDate: new Date(task.startDate),
          endDate: new Date(task.endDate),
          createdAt: new Date(task.createdAt),
          updatedAt: new Date(task.updatedAt),
          // assignedUser, category, relatedUsers はそのまま保持
        }));
        console.log('Loaded tasks:', tasks);
        set({ tasks, isLoading: false });
      } else {
        set({ error: response.error || 'タスクの取得に失敗しました', isLoading: false });
      }
    } catch (error: any) {
      set({ error: error.message || 'タスクの取得に失敗しました', isLoading: false });
    }
  },

  loadCategories: async () => {
    try {
      const response = await categoryApi.getCategories();
      if (response.success && response.data) {
        const categories = response.data.map((category: any) => ({
          ...category,
          createdAt: new Date(category.createdAt),
        }));
        set({ categories });
      } else {
        set({ error: response.error || 'カテゴリの取得に失敗しました' });
      }
    } catch (error: any) {
      set({ error: error.message || 'カテゴリの取得に失敗しました' });
    }
  },

  // タスク関連アクション
  setTasks: (tasks) => set({ tasks }),

  addTask: (task) => {
    set((state) => ({
      tasks: [...state.tasks, task],
    }));
  },

  updateTask: (taskId, updates) => {
    set((state) => ({
      tasks: state.tasks.map((task) =>
        task.id === taskId
          ? { ...task, ...updates, updatedAt: new Date() }
          : task
      ),
    }));
  },

  deleteTask: (taskId) => {
    set((state) => ({
      tasks: state.tasks.map((task) =>
        task.id === taskId
          ? { ...task, isDeleted: true, updatedAt: new Date() }
          : task
      ),
    }));
  },

  toggleSOS: async (taskId, comment) => {
    try {
      const task = get().tasks.find((t) => t.id === taskId);
      if (!task) return;

      const newSOSFlag = !task.sosFlag;

      // APIを呼び出してSOS状態を更新
      const response = await taskApi.toggleSOS(taskId, newSOSFlag, comment);
      if (response.success) {
        // ローカル状態も更新
        get().updateTask(taskId, {
          sosFlag: newSOSFlag,
          sosComment: newSOSFlag ? comment : undefined,
        });

        // 必要に応じてタスク一覧を再取得
        await get().loadTasks();
      } else {
        set({ error: response.error || 'SOSの更新に失敗しました' });
      }
    } catch (error: any) {
      set({ error: error.message || 'SOSの更新に失敗しました' });
    }
  },

  // カテゴリ関連アクション
  setCategories: (categories) => set({ categories }),

  addCategory: (category) => {
    set((state) => ({
      categories: [...state.categories, category],
    }));
  },

  // テンプレート関連アクション
  setTemplates: (templates) => set({ templates }),

  addTemplate: (template) => {
    set((state) => ({
      templates: [...state.templates, template],
    }));
  },

  // SOS通知関連アクション
  setSosNotifications: (notifications) => set({ sosNotifications: notifications }),

  resolveSOS: (taskId) => {
    set((state) => ({
      sosNotifications: state.sosNotifications.map((notification) =>
        notification.taskId === taskId
          ? { ...notification, isResolved: true, resolvedAt: new Date() }
          : notification
      ),
    }));
  },

  // ユーティリティアクション
  setLoading: (isLoading) => set({ isLoading }),
  setError: (error) => set({ error }),
}));