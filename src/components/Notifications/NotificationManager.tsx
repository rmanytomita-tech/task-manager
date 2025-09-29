// 通知管理コンポーネント
import React, { useEffect, useState } from 'react';
import {
  Snackbar,
  Alert,
  AlertTitle,
  IconButton,
  Box,
  Typography,
  Chip,
} from '@mui/material';
import {
  Close as CloseIcon,
  Assignment as TaskIcon,
  Warning as SosIcon,
  CheckCircle as CompleteIcon,
} from '@mui/icons-material';
import { useTaskStore } from '../../stores/taskStore';
import { Task } from '../../types';

interface Notification {
  id: string;
  type: 'deadline' | 'sos' | 'completed';
  title: string;
  message: string;
  task?: Task;
  severity: 'error' | 'warning' | 'info' | 'success';
  autoHideDuration?: number;
}

export const NotificationManager: React.FC = () => {
  const { tasks } = useTaskStore();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [lastCheckedTasks, setLastCheckedTasks] = useState<Task[]>([]);

  // 通知を追加
  const addNotification = (notification: Omit<Notification, 'id'>) => {
    const newNotification: Notification = {
      ...notification,
      id: Date.now().toString(),
    };
    setNotifications(prev => [...prev, newNotification]);
  };

  // 通知を削除
  const removeNotification = (id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  };

  // タスクの変更をチェックして通知を生成
  useEffect(() => {
    if (lastCheckedTasks.length === 0) {
      setLastCheckedTasks(tasks);
      return;
    }

    const currentTime = new Date();
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);

    // 新しくSOSフラグが立ったタスクをチェック
    tasks.forEach(currentTask => {
      const previousTask = lastCheckedTasks.find(t => t.id === currentTask.id);

      // SOS発信の通知
      if (currentTask.sosFlag && (!previousTask || !previousTask.sosFlag)) {
        addNotification({
          type: 'sos',
          title: 'SOS発信',
          message: `${currentTask.title}でSOSが発信されました`,
          task: currentTask,
          severity: 'error',
          autoHideDuration: 10000,
        });
      }

      // タスク完了の通知
      if (currentTask.status === 'completed' &&
          previousTask && previousTask.status !== 'completed') {
        addNotification({
          type: 'completed',
          title: 'タスク完了',
          message: `${currentTask.title}が完了しました`,
          task: currentTask,
          severity: 'success',
          autoHideDuration: 5000,
        });
      }
    });

    setLastCheckedTasks(tasks);
  }, [tasks, lastCheckedTasks]);

  // 期限チェック（定期実行）
  useEffect(() => {
    const checkDeadlines = () => {
      const now = new Date();
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);

      tasks.forEach(task => {
        if (task.isDeleted || task.status === 'completed') return;

        const taskEndDate = new Date(task.endDate);
        const taskEndDay = new Date(taskEndDate.getFullYear(), taskEndDate.getMonth(), taskEndDate.getDate());

        // 今日が期限のタスク
        if (taskEndDay.getTime() === today.getTime()) {
          addNotification({
            type: 'deadline',
            title: '期限当日',
            message: `${task.title}の期限は今日です`,
            task,
            severity: 'error',
            autoHideDuration: 8000,
          });
        }
        // 明日が期限のタスク
        else if (taskEndDay.getTime() === tomorrow.getTime()) {
          addNotification({
            type: 'deadline',
            title: '期限明日',
            message: `${task.title}の期限は明日です`,
            task,
            severity: 'warning',
            autoHideDuration: 6000,
          });
        }
      });
    };

    // 初回実行
    checkDeadlines();

    // 1時間ごとにチェック
    const interval = setInterval(checkDeadlines, 60 * 60 * 1000);

    return () => clearInterval(interval);
  }, [tasks]);

  // 通知アイコンを取得
  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'deadline':
        return <TaskIcon />;
      case 'sos':
        return <SosIcon />;
      case 'completed':
        return <CompleteIcon />;
      default:
        return <TaskIcon />;
    }
  };

  // 優先度を取得（重要な通知から順に表示）
  const getPriority = (type: string) => {
    switch (type) {
      case 'sos':
        return 3;
      case 'deadline':
        return 2;
      case 'completed':
        return 1;
      default:
        return 0;
    }
  };

  // 通知を優先度でソート
  const sortedNotifications = [...notifications].sort(
    (a, b) => getPriority(b.type) - getPriority(a.type)
  );

  return (
    <>
      {sortedNotifications.map((notification, index) => (
        <Snackbar
          key={notification.id}
          open={true}
          autoHideDuration={notification.autoHideDuration || 6000}
          onClose={() => removeNotification(notification.id)}
          anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
          sx={{
            mt: index * 8, // 複数通知を縦に並べる
          }}
        >
          <Alert
            severity={notification.severity}
            onClose={() => removeNotification(notification.id)}
            sx={{
              width: 400,
              '& .MuiAlert-message': {
                width: '100%',
              },
            }}
            icon={getNotificationIcon(notification.type)}
            action={
              <IconButton
                size="small"
                onClick={() => removeNotification(notification.id)}
                sx={{ color: 'inherit' }}
              >
                <CloseIcon fontSize="small" />
              </IconButton>
            }
          >
            <AlertTitle>{notification.title}</AlertTitle>
            <Typography variant="body2" sx={{ mb: 1 }}>
              {notification.message}
            </Typography>
            {notification.task && (
              <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                <Chip
                  size="small"
                  label={`優先度: ${notification.task.priority === 'high' ? '高' : notification.task.priority === 'medium' ? '中' : '低'}`}
                  color={notification.task.priority === 'high' ? 'error' : notification.task.priority === 'medium' ? 'warning' : 'default'}
                />
                <Chip
                  size="small"
                  label={`期限: ${new Date(notification.task.endDate).toLocaleDateString('ja-JP')}`}
                  variant="outlined"
                />
                {notification.task.assignedUser && (
                  <Chip
                    size="small"
                    label={`担当: ${notification.task.assignedUser.name}`}
                    variant="outlined"
                  />
                )}
              </Box>
            )}
          </Alert>
        </Snackbar>
      ))}
    </>
  );
};