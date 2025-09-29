// タスク関連のユーティリティ関数
import { Task, TeamLoadStatus, User } from '../types';
import { isToday, isPastDate, isFutureDate, getWeekStart, getWeekEnd, getMonthStart, getMonthEnd } from './dateUtils';

/**
 * タスクの優先度に応じた色を取得
 */
export const getPriorityColor = (priority: Task['priority']): string => {
  switch (priority) {
    case 'high':
      return '#f44336'; // 赤
    case 'medium':
      return '#ff9800'; // オレンジ
    case 'low':
      return '#4caf50'; // 緑
    default:
      return '#757575'; // グレー
  }
};

/**
 * タスクのステータスに応じた色を取得
 */
export const getStatusColor = (status: Task['status']): string => {
  switch (status) {
    case 'not_started':
      return '#757575'; // グレー
    case 'in_progress':
      return '#2196f3'; // 青
    case 'completed':
      return '#4caf50'; // 緑
    default:
      return '#757575';
  }
};

/**
 * タスクのステータスに応じた日本語ラベルを取得
 */
export const getStatusLabel = (status: Task['status']): string => {
  switch (status) {
    case 'not_started':
      return '未着手';
    case 'in_progress':
      return '進行中';
    case 'completed':
      return '完了';
    default:
      return '不明';
  }
};

/**
 * 優先度の日本語ラベルを取得
 */
export const getPriorityLabel = (priority: Task['priority']): string => {
  switch (priority) {
    case 'high':
      return '高';
    case 'medium':
      return '中';
    case 'low':
      return '低';
    default:
      return '不明';
  }
};

/**
 * 今日が期限のタスクを取得
 */
export const getTodayTasks = (tasks: Task[]): Task[] => {
  return tasks.filter(task =>
    !task.isDeleted &&
    isToday(task.endDate)
  );
};

/**
 * 期限切れのタスクを取得
 */
export const getOverdueTasks = (tasks: Task[]): Task[] => {
  return tasks.filter(task =>
    !task.isDeleted &&
    task.status !== 'completed' &&
    isPastDate(task.endDate)
  );
};

/**
 * SOS発信中のタスクを取得
 */
export const getSOSTasks = (tasks: Task[]): Task[] => {
  return tasks.filter(task =>
    !task.isDeleted &&
    task.sosFlag
  );
};

/**
 * 指定ユーザーのタスクを取得
 */
export const getUserTasks = (tasks: Task[], userId: string): Task[] => {
  return tasks.filter(task =>
    !task.isDeleted &&
    task.assignedUserId === userId
  );
};

/**
 * 指定期間のタスクを取得
 */
export const getTasksInPeriod = (
  tasks: Task[],
  startDate: Date,
  endDate: Date
): Task[] => {
  return tasks.filter(task => {
    if (task.isDeleted) return false;
    const taskStart = new Date(task.startDate);
    const taskEnd = new Date(task.endDate);

    // タスクの期間が指定期間と重複しているかチェック
    return (taskStart <= endDate && taskEnd >= startDate);
  });
};

/**
 * 今週のタスクを取得
 */
export const getWeeklyTasks = (tasks: Task[]): Task[] => {
  const weekStart = getWeekStart();
  const weekEnd = getWeekEnd();
  return getTasksInPeriod(tasks, weekStart, weekEnd);
};

/**
 * 今月のタスクを取得
 */
export const getMonthlyTasks = (tasks: Task[]): Task[] => {
  const monthStart = getMonthStart();
  const monthEnd = getMonthEnd();
  return getTasksInPeriod(tasks, monthStart, monthEnd);
};

/**
 * ユーザーのタスク負荷を計算
 */
export const calculateUserLoad = (tasks: Task[], userId: string, userName: string): TeamLoadStatus => {
  const userTasks = getUserTasks(tasks, userId);
  const weeklyTasks = getWeeklyTasks(userTasks);
  const monthlyTasks = getMonthlyTasks(userTasks);

  const weeklyTaskCount = weeklyTasks.filter(task => task.status !== 'completed').length;
  const monthlyTaskCount = monthlyTasks.filter(task => task.status !== 'completed').length;

  let loadLevel: TeamLoadStatus['loadLevel'] = 'light';
  if (weeklyTaskCount >= 5) {
    loadLevel = 'heavy';
  } else if (weeklyTaskCount >= 3) {
    loadLevel = 'normal';
  }

  return {
    userId,
    userName,
    weeklyTaskCount,
    monthlyTaskCount,
    loadLevel,
  };
};

/**
 * チーム全体の負荷状況を計算
 */
export const calculateTeamLoad = (tasks: Task[], users: User[]): TeamLoadStatus[] => {
  return users.map(user =>
    calculateUserLoad(tasks, user.id, user.name)
  );
};

/**
 * タスクの進捗率を計算（期間に基づく）
 */
export const calculateTaskProgress = (task: Task): number => {
  if (task.status === 'completed') return 100;
  if (task.status === 'not_started') return 0;

  const now = new Date();
  const start = new Date(task.startDate);
  const end = new Date(task.endDate);
  const total = end.getTime() - start.getTime();
  const elapsed = now.getTime() - start.getTime();

  if (elapsed <= 0) return 0;
  if (elapsed >= total) return 90; // 進行中の場合は最大90%まで

  return Math.floor((elapsed / total) * 90);
};

/**
 * タスクの緊急度に応じたスコアを計算
 */
export const getTaskUrgencyScore = (task: Task): number => {
  let score = task.urgency * 10; // 基本スコア

  // 期限が近い場合はスコアを上げる
  const daysUntilDeadline = Math.ceil((new Date(task.endDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
  if (daysUntilDeadline <= 1) score += 30;
  else if (daysUntilDeadline <= 3) score += 20;
  else if (daysUntilDeadline <= 7) score += 10;

  // SOSフラグがある場合は最高優先度
  if (task.sosFlag) score += 100;

  // 優先度による調整
  if (task.priority === 'high') score += 20;
  else if (task.priority === 'low') score -= 10;

  return score;
};

/**
 * タスクを緊急度順にソート
 */
export const sortTasksByUrgency = (tasks: Task[]): Task[] => {
  return [...tasks].sort((a, b) =>
    getTaskUrgencyScore(b) - getTaskUrgencyScore(a)
  );
};

/**
 * タスクIDを生成
 */
export const generateTaskId = (): string => {
  return `task_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
};