// ユーザー管理画面（管理者専用）
import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Alert,
  Fab,
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Person as PersonIcon,
  AdminPanelSettings as AdminIcon,
} from '@mui/icons-material';
import { useForm, Controller } from 'react-hook-form';
import { useAuthStore } from '../stores/authStore';
import { userApi } from '../utils/apiClient';
import { User } from '../types';

interface UserFormData {
  name: string;
  email: string;
  password: string;
  role: 'ADMIN' | 'USER';
  department?: string;
}

export const UserManagement: React.FC = () => {
  const { user } = useAuthStore();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);

  const { control, handleSubmit, reset, formState: { errors } } = useForm<UserFormData>();

  // ユーザー一覧読み込み
  const loadUsers = async () => {
    try {
      setLoading(true);
      const response = await userApi.getUsers();
      if (response.success && response.data) {
        setUsers(response.data);
      } else {
        setError(response.error || 'ユーザーの取得に失敗しました');
      }
    } catch (err: any) {
      setError(err.message || 'ユーザーの取得に失敗しました');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadUsers();
  }, []);

  // ユーザー追加・編集
  const handleSaveUser = async (data: UserFormData) => {
    try {
      setLoading(true);

      if (editingUser) {
        // 編集
        const response = await userApi.updateUser(editingUser.id, data);
        if (response.success) {
          await loadUsers();
          setDialogOpen(false);
          setEditingUser(null);
          reset();
        } else {
          setError(response.error || 'ユーザーの更新に失敗しました');
        }
      } else {
        // 新規追加
        const response = await userApi.createUser(data);
        if (response.success) {
          await loadUsers();
          setDialogOpen(false);
          reset();
        } else {
          setError(response.error || 'ユーザーの作成に失敗しました');
        }
      }
    } catch (err: any) {
      setError(err.message || 'ユーザーの保存に失敗しました');
    } finally {
      setLoading(false);
    }
  };

  // ユーザー削除
  const handleDeleteUser = async () => {
    if (!selectedUser) return;

    try {
      setLoading(true);
      const response = await userApi.deleteUser(selectedUser.id);
      if (response.success) {
        await loadUsers();
        setDeleteDialogOpen(false);
        setSelectedUser(null);
      } else {
        setError(response.error || 'ユーザーの削除に失敗しました');
      }
    } catch (err: any) {
      setError(err.message || 'ユーザーの削除に失敗しました');
    } finally {
      setLoading(false);
    }
  };

  // ダイアログ開閉
  const handleAddUser = () => {
    setEditingUser(null);
    reset();
    setDialogOpen(true);
  };

  const handleEditUser = (user: User) => {
    setEditingUser(user);
    reset({
      name: user.name,
      email: user.email,
      password: '', // 編集時はパスワード空欄
      role: user.role.toUpperCase() as 'ADMIN' | 'USER',
      department: user.department || '',
    });
    setDialogOpen(true);
  };

  const handleDeleteClick = (user: User) => {
    setSelectedUser(user);
    setDeleteDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setDialogOpen(false);
    setEditingUser(null);
    reset();
  };

  // 管理者権限チェック
  if (user?.role.toLowerCase() !== 'admin') {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="error">
          この機能は管理者のみアクセス可能です。
        </Alert>
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      {/* ヘッダー */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" component="h1">
          ユーザー管理
        </Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={handleAddUser}
          disabled={loading}
        >
          ユーザー追加
        </Button>
      </Box>

      {/* エラー表示 */}
      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {/* ユーザー一覧 */}
      <Card>
        <CardContent>
          <TableContainer component={Paper}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>ユーザー名</TableCell>
                  <TableCell>メールアドレス</TableCell>
                  <TableCell>役割</TableCell>
                  <TableCell>部署</TableCell>
                  <TableCell>作成日</TableCell>
                  <TableCell>最終ログイン</TableCell>
                  <TableCell align="center">操作</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {users.map((userData) => (
                  <TableRow key={userData.id}>
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        {userData.role.toLowerCase() === 'admin' ? (
                          <AdminIcon color="primary" />
                        ) : (
                          <PersonIcon color="action" />
                        )}
                        {userData.name}
                      </Box>
                    </TableCell>
                    <TableCell>{userData.email}</TableCell>
                    <TableCell>
                      <Chip
                        label={userData.role.toLowerCase() === 'admin' ? '管理者' : '一般ユーザー'}
                        color={userData.role.toLowerCase() === 'admin' ? 'primary' : 'default'}
                        size="small"
                      />
                    </TableCell>
                    <TableCell>{userData.department || '-'}</TableCell>
                    <TableCell>
                      {new Date(userData.createdAt).toLocaleDateString('ja-JP')}
                    </TableCell>
                    <TableCell>
                      {userData.lastLoginAt
                        ? new Date(userData.lastLoginAt).toLocaleDateString('ja-JP')
                        : '未ログイン'
                      }
                    </TableCell>
                    <TableCell align="center">
                      <IconButton
                        size="small"
                        onClick={() => handleEditUser(userData)}
                        disabled={loading}
                      >
                        <EditIcon />
                      </IconButton>
                      <IconButton
                        size="small"
                        onClick={() => handleDeleteClick(userData)}
                        disabled={loading || userData.id === user?.id} // 自分自身は削除不可
                        color="error"
                      >
                        <DeleteIcon />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>

            {users.length === 0 && !loading && (
              <Box sx={{ p: 4, textAlign: 'center' }}>
                <Typography variant="body1" color="text.secondary">
                  ユーザーが見つかりませんでした
                </Typography>
              </Box>
            )}
          </TableContainer>
        </CardContent>
      </Card>

      {/* ユーザー追加・編集ダイアログ */}
      <Dialog open={dialogOpen} onClose={handleCloseDialog} maxWidth="sm" fullWidth>
        <DialogTitle>
          {editingUser ? 'ユーザー編集' : 'ユーザー追加'}
        </DialogTitle>
        <form onSubmit={handleSubmit(handleSaveUser)}>
          <DialogContent>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3, pt: 1 }}>
              {/* 名前 */}
              <Controller
                name="name"
                control={control}
                rules={{ required: '名前は必須です' }}
                render={({ field }) => (
                  <TextField
                    {...field}
                    label="ユーザー名"
                    error={!!errors.name}
                    helperText={errors.name?.message}
                    disabled={loading}
                  />
                )}
              />

              {/* メールアドレス */}
              <Controller
                name="email"
                control={control}
                rules={{
                  required: 'メールアドレスは必須です',
                  pattern: {
                    value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                    message: '有効なメールアドレスを入力してください',
                  },
                }}
                render={({ field }) => (
                  <TextField
                    {...field}
                    label="メールアドレス"
                    type="email"
                    error={!!errors.email}
                    helperText={errors.email?.message}
                    disabled={loading}
                  />
                )}
              />

              {/* パスワード */}
              <Controller
                name="password"
                control={control}
                rules={{
                  required: editingUser ? false : 'パスワードは必須です',
                  minLength: {
                    value: 6,
                    message: 'パスワードは6文字以上で入力してください',
                  },
                }}
                render={({ field }) => (
                  <TextField
                    {...field}
                    label={editingUser ? 'パスワード（変更する場合のみ入力）' : 'パスワード'}
                    type="password"
                    error={!!errors.password}
                    helperText={errors.password?.message}
                    disabled={loading}
                  />
                )}
              />

              {/* 役割 */}
              <Controller
                name="role"
                control={control}
                rules={{ required: '役割を選択してください' }}
                render={({ field }) => (
                  <FormControl error={!!errors.role} disabled={loading}>
                    <InputLabel>役割</InputLabel>
                    <Select {...field} label="役割">
                      <MenuItem value="USER">一般ユーザー</MenuItem>
                      <MenuItem value="ADMIN">管理者</MenuItem>
                    </Select>
                    {errors.role && (
                      <Typography variant="caption" color="error" sx={{ ml: 2, mt: 0.5 }}>
                        {errors.role.message}
                      </Typography>
                    )}
                  </FormControl>
                )}
              />

              {/* 部署 */}
              <Controller
                name="department"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    label="部署（任意）"
                    disabled={loading}
                  />
                )}
              />
            </Box>
          </DialogContent>
          <DialogActions>
            <Button onClick={handleCloseDialog} disabled={loading}>
              キャンセル
            </Button>
            <Button type="submit" variant="contained" disabled={loading}>
              {editingUser ? '更新' : '作成'}
            </Button>
          </DialogActions>
        </form>
      </Dialog>

      {/* 削除確認ダイアログ */}
      <Dialog open={deleteDialogOpen} onClose={() => setDeleteDialogOpen(false)}>
        <DialogTitle>ユーザー削除確認</DialogTitle>
        <DialogContent>
          <Typography>
            「{selectedUser?.name}」を削除しますか？
          </Typography>
          <Alert severity="warning" sx={{ mt: 2 }}>
            この操作は元に戻せません。ユーザーに関連するタスクの担当者も変更される可能性があります。
          </Alert>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialogOpen(false)} disabled={loading}>
            キャンセル
          </Button>
          <Button
            onClick={handleDeleteUser}
            variant="contained"
            color="error"
            disabled={loading}
          >
            削除
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};