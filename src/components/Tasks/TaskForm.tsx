// タスク作成・編集フォームコンポーネント
import React, { useEffect, useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Box,
  Typography,
  Alert,
  Chip,
  Autocomplete,
  Grid,
  Switch,
  FormControlLabel,
  Divider,
} from '@mui/material';
// 日付ピッカーライブラリは後で追加予定
import { useForm, Controller } from 'react-hook-form';
import dayjs from 'dayjs';
import { useAuthStore } from '../../stores/authStore';
import { useTaskStore } from '../../stores/taskStore';
import { Task, TaskFormData, User } from '../../types';
import { taskApi, userApi } from '../../utils/apiClient';

interface TaskFormProps {
  open: boolean;
  onClose: () => void;
  task?: Task; // 編集時に渡される既存タスク
  mode: 'create' | 'edit';
}

// フォームのデフォルト値
const getDefaultValues = (task?: Task): TaskFormData => ({
  title: task?.title || '',
  startDate: task ? dayjs(task.startDate).format('YYYY-MM-DD') : dayjs().format('YYYY-MM-DD'),
  endDate: task ? dayjs(task.endDate).format('YYYY-MM-DD') : dayjs().add(1, 'day').format('YYYY-MM-DD'),
  assignedUserId: task?.assignedUserId || '',
  categoryId: task?.categoryId || '',
  priority: task?.priority || 'medium',
  urgency: task?.urgency || 3,
  clientName: task?.clientName || '',
  projectName: task?.projectName || '',
  relatedUsers: task?.relatedUsers || [],
  memo: task?.memo || '',
  sosFlag: task?.sosFlag || false,
  sosComment: task?.sosComment || '',
});

export const TaskForm: React.FC<TaskFormProps> = ({ open, onClose, task, mode }) => {
  const { user } = useAuthStore();
  const { categories, setError, loadTasks, loadCategories } = useTaskStore();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);

  const { control, handleSubmit, reset, formState: { errors }, watch } = useForm<TaskFormData>({
    defaultValues: getDefaultValues(task),
  });

  // ユーザー一覧を読み込み
  useEffect(() => {
    const loadUsers = async () => {
      try {
        const response = await userApi.getUserList();
        if (response.success && response.data) {
          setUsers(response.data);
        }
      } catch (error: any) {
        console.error('ユーザー取得エラー:', error);
      }
    };

    if (open) {
      loadUsers();
    }
  }, [open]);

  // ダイアログが開かれた時にフォームをリセット
  useEffect(() => {
    if (open) {
      reset(getDefaultValues(task));
    }
  }, [open, task, reset]);

  // 開始日と終了日の監視（終了日が開始日より前にならないように）
  const startDate = watch('startDate');
  const sosFlag = watch('sosFlag');

  // フォーム送信処理
  const onSubmit = async (data: TaskFormData) => {
    try {
      setLoading(true);

      // APIに送信するデータを準備（バックエンドの形式に合わせる）
      const taskData = {
        title: data.title,
        startDate: new Date(data.startDate).toISOString(),
        endDate: new Date(data.endDate).toISOString(),
        assignedUserId: data.assignedUserId || user?.id || '',
        categoryId: data.categoryId,
        priority: data.priority.toUpperCase() as 'HIGH' | 'MEDIUM' | 'LOW',
        urgency: data.urgency,
        clientName: data.clientName || undefined,
        projectName: data.projectName || undefined,
        memo: data.memo || undefined,
        sosFlag: data.sosFlag || false,
        sosComment: data.sosComment || undefined,
      };

      if (mode === 'create') {
        // 新規作成
        const response = await taskApi.createTask(taskData);
        if (response.success) {
          await loadTasks(); // タスク一覧を再取得
          onClose();
        } else {
          setError(response.error || 'タスクの作成に失敗しました');
        }
      } else {
        // 編集
        if (task) {
          const response = await taskApi.updateTask(task.id, taskData);
          if (response.success) {
            await loadTasks(); // タスク一覧を再取得
            onClose();
          } else {
            setError(response.error || 'タスクの更新に失敗しました');
          }
        }
      }
    } catch (error: any) {
      console.error('Task save error:', error);
      setError(error.message || 'タスクの保存に失敗しました');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    reset();
    onClose();
  };

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      maxWidth="md"
      fullWidth
    >
      <DialogTitle>
        {mode === 'create' ? '新規タスク作成' : 'タスク編集'}
      </DialogTitle>

      <form onSubmit={handleSubmit(onSubmit)}>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
              {/* 基本情報 */}
              <Box>
                <Typography variant="h6" gutterBottom>
                  基本情報
                </Typography>

                <Box sx={{ display: 'grid', gridTemplateColumns: '1fr', gap: 2 }}>
                  {/* タスク名 */}
                  <Controller
                    name="title"
                    control={control}
                    rules={{ required: 'タスク名は必須です' }}
                    render={({ field }) => (
                      <TextField
                        {...field}
                        label="タスク名 *"
                        error={!!errors.title}
                        helperText={errors.title?.message}
                        fullWidth
                      />
                    )}
                  />

                  {/* 期間 */}
                  <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 2 }}>
                    <Controller
                      name="startDate"
                      control={control}
                      rules={{ required: '開始日は必須です' }}
                      render={({ field }) => (
                        <TextField
                          {...field}
                          type="date"
                          label="開始日 *"
                          InputLabelProps={{ shrink: true }}
                          error={!!errors.startDate}
                          helperText={errors.startDate?.message}
                        />
                      )}
                    />

                    <Controller
                      name="endDate"
                      control={control}
                      rules={{
                        required: '終了日は必須です',
                        validate: (value) => {
                          if (startDate && value < startDate) {
                            return '終了日は開始日以降を選択してください';
                          }
                          return true;
                        },
                      }}
                      render={({ field }) => (
                        <TextField
                          {...field}
                          type="date"
                          label="終了日 *"
                          InputLabelProps={{ shrink: true }}
                          error={!!errors.endDate}
                          helperText={errors.endDate?.message}
                        />
                      )}
                    />
                  </Box>

                  {/* 担当者・カテゴリ */}
                  <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 2 }}>
                    <Controller
                      name="assignedUserId"
                      control={control}
                      rules={{ required: '担当者は必須です' }}
                      render={({ field }) => (
                        <FormControl error={!!errors.assignedUserId}>
                          <InputLabel>担当者 *</InputLabel>
                          <Select {...field} label="担当者 *">
                            {users.map((user) => (
                              <MenuItem key={user.id} value={user.id}>
                                {user.name}
                              </MenuItem>
                            ))}
                          </Select>
                          {errors.assignedUserId && (
                            <Typography variant="caption" color="error" sx={{ ml: 2 }}>
                              {errors.assignedUserId.message}
                            </Typography>
                          )}
                        </FormControl>
                      )}
                    />

                    <Controller
                      name="categoryId"
                      control={control}
                      rules={{ required: 'カテゴリは必須です' }}
                      render={({ field }) => (
                        <FormControl error={!!errors.categoryId}>
                          <InputLabel>カテゴリ *</InputLabel>
                          <Select {...field} label="カテゴリ *">
                            {categories.map((category) => (
                              <MenuItem key={category.id} value={category.id}>
                                {category.name}
                              </MenuItem>
                            ))}
                          </Select>
                          {errors.categoryId && (
                            <Typography variant="caption" color="error" sx={{ ml: 2 }}>
                              {errors.categoryId.message}
                            </Typography>
                          )}
                        </FormControl>
                      )}
                    />
                  </Box>

                  {/* 優先度・緊急度 */}
                  <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 2 }}>
                    <Controller
                      name="priority"
                      control={control}
                      render={({ field }) => (
                        <FormControl>
                          <InputLabel>優先度</InputLabel>
                          <Select {...field} label="優先度">
                            <MenuItem value="high">高</MenuItem>
                            <MenuItem value="medium">中</MenuItem>
                            <MenuItem value="low">低</MenuItem>
                          </Select>
                        </FormControl>
                      )}
                    />

                    <Controller
                      name="urgency"
                      control={control}
                      render={({ field }) => (
                        <FormControl>
                          <InputLabel>緊急度</InputLabel>
                          <Select {...field} label="緊急度">
                            {[1, 2, 3, 4, 5].map((level) => (
                              <MenuItem key={level} value={level}>
                                {level} {level === 1 && '(低)'} {level === 3 && '(普通)'} {level === 5 && '(高)'}
                              </MenuItem>
                            ))}
                          </Select>
                        </FormControl>
                      )}
                    />
                  </Box>
                </Box>
              </Box>

              {/* 詳細情報 */}
              <Box>
                <Typography variant="h6" gutterBottom>
                  詳細情報
                </Typography>

                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                  {/* クライアント・案件 */}
                  <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 2 }}>
                    <Controller
                      name="clientName"
                      control={control}
                      render={({ field }) => (
                        <TextField
                          {...field}
                          label="クライアント名"
                          placeholder="クライアント名を入力"
                        />
                      )}
                    />

                    <Controller
                      name="projectName"
                      control={control}
                      render={({ field }) => (
                        <TextField
                          {...field}
                          label="案件名"
                          placeholder="案件名を入力"
                        />
                      )}
                    />
                  </Box>

                  {/* メモ */}
                  <Controller
                    name="memo"
                    control={control}
                    render={({ field }) => (
                      <TextField
                        {...field}
                        label="メモ・備考"
                        multiline
                        rows={3}
                        placeholder="タスクの詳細や備考を入力"
                      />
                    )}
                  />
                </Box>
              </Box>

              {/* SOS設定 */}
              <Box>
                <Typography variant="h6" gutterBottom>
                  SOS設定
                </Typography>
                <Alert severity="info" sx={{ mb: 2 }}>
                  困った時はSOSを発信してチームに支援を求めましょう
                </Alert>

                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                  {/* SOSフラグ */}
                  <Controller
                    name="sosFlag"
                    control={control}
                    render={({ field }) => (
                      <FormControlLabel
                        control={
                          <Switch
                            {...field}
                            checked={field.value}
                            color="error"
                          />
                        }
                        label={
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <Typography variant="body2">
                              SOSを発信する
                            </Typography>
                            {field.value && (
                              <Chip size="small" label="SOS" color="error" />
                            )}
                          </Box>
                        }
                      />
                    )}
                  />

                  {/* SOSコメント */}
                  {sosFlag && (
                    <Controller
                      name="sosComment"
                      control={control}
                      render={({ field }) => (
                        <TextField
                          {...field}
                          label="SOSコメント"
                          multiline
                          rows={2}
                          placeholder="どのような支援が必要か具体的に記述してください"
                          helperText="例：技術的な問題で行き詰まっている、工数が足りない、仕様が不明確など"
                        />
                      )}
                    />
                  )}
                </Box>
              </Box>

              {/* 情報表示 */}
              {mode === 'edit' && task && (
                <Alert severity="info">
                  作成日: {dayjs(task.createdAt).format('YYYY年MM月DD日 HH:mm')}
                  {task.updatedAt.getTime() !== task.createdAt.getTime() && (
                    <>
                      <br />
                      最終更新: {dayjs(task.updatedAt).format('YYYY年MM月DD日 HH:mm')}
                    </>
                  )}
                </Alert>
              )}
            </Box>
        </DialogContent>

        <DialogActions>
          <Button onClick={handleClose} disabled={loading}>
            キャンセル
          </Button>
          <Button
            type="submit"
            variant="contained"
            disabled={loading}
          >
            {loading ? '保存中...' : mode === 'create' ? '作成' : '保存'}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
};