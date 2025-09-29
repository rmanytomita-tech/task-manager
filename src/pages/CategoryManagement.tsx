// カテゴリ管理画面（管理者専用）
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
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Alert,
} from '@mui/material';
import {
  Add as AddIcon,
  Delete as DeleteIcon,
  Category as CategoryIcon,
} from '@mui/icons-material';
import { useForm, Controller } from 'react-hook-form';
import { useAuthStore } from '../stores/authStore';
import { categoryApi } from '../utils/apiClient';
import { Category } from '../types';

interface CategoryFormData {
  name: string;
}

export const CategoryManagement: React.FC = () => {
  const { user } = useAuthStore();
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);

  const { control, handleSubmit, reset, formState: { errors } } = useForm<CategoryFormData>();

  // カテゴリ一覧読み込み
  const loadCategories = async () => {
    try {
      setLoading(true);
      const response = await categoryApi.getCategories();
      if (response.success && response.data) {
        setCategories(response.data);
      } else {
        setError(response.error || 'カテゴリの取得に失敗しました');
      }
    } catch (err: any) {
      setError(err.message || 'カテゴリの取得に失敗しました');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCategories();
  }, []);

  // カテゴリ作成
  const handleCreateCategory = async (data: CategoryFormData) => {
    try {
      setLoading(true);
      const response = await categoryApi.createCategory({
        ...data,
        creatorId: user!.id,
      });

      if (response.success) {
        await loadCategories();
        setDialogOpen(false);
        reset();
      } else {
        setError(response.error || 'カテゴリの作成に失敗しました');
      }
    } catch (err: any) {
      setError(err.message || 'カテゴリの作成に失敗しました');
    } finally {
      setLoading(false);
    }
  };

  // カテゴリ削除
  const handleDeleteCategory = async () => {
    if (!selectedCategory) return;

    try {
      setLoading(true);
      const response = await categoryApi.deleteCategory(selectedCategory.id);
      if (response.success) {
        await loadCategories();
        setDeleteDialogOpen(false);
        setSelectedCategory(null);
      } else {
        setError(response.error || 'カテゴリの削除に失敗しました');
      }
    } catch (err: any) {
      setError(err.message || 'カテゴリの削除に失敗しました');
    } finally {
      setLoading(false);
    }
  };

  // ダイアログ開閉
  const handleAddCategory = () => {
    reset();
    setDialogOpen(true);
  };

  const handleDeleteClick = (category: Category) => {
    setSelectedCategory(category);
    setDeleteDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setDialogOpen(false);
    reset();
  };

  // 管理者権限チェック
  if (user?.role !== 'admin') {
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
          カテゴリ管理
        </Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={handleAddCategory}
          disabled={loading}
        >
          カテゴリ追加
        </Button>
      </Box>

      {/* エラー表示 */}
      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {/* カテゴリ一覧 */}
      <Card>
        <CardContent>
          <TableContainer component={Paper}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>カテゴリ名</TableCell>
                  <TableCell>作成者</TableCell>
                  <TableCell>タスク数</TableCell>
                  <TableCell>作成日</TableCell>
                  <TableCell align="center">操作</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {categories.map((category) => (
                  <TableRow key={category.id}>
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <CategoryIcon color="primary" />
                        {category.name}
                      </Box>
                    </TableCell>
                    <TableCell>システム</TableCell>
                    <TableCell>0件</TableCell>
                    <TableCell>
                      {new Date(category.createdAt).toLocaleDateString('ja-JP')}
                    </TableCell>
                    <TableCell align="center">
                      <IconButton
                        size="small"
                        onClick={() => handleDeleteClick(category)}
                        disabled={loading}
                        color="error"
                        title="カテゴリを削除"
                      >
                        <DeleteIcon />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>

            {categories.length === 0 && !loading && (
              <Box sx={{ p: 4, textAlign: 'center' }}>
                <Typography variant="body1" color="text.secondary">
                  カテゴリが見つかりませんでした
                </Typography>
              </Box>
            )}
          </TableContainer>
        </CardContent>
      </Card>

      {/* カテゴリ追加ダイアログ */}
      <Dialog open={dialogOpen} onClose={handleCloseDialog} maxWidth="sm" fullWidth>
        <DialogTitle>
          カテゴリ追加
        </DialogTitle>
        <form onSubmit={handleSubmit(handleCreateCategory)}>
          <DialogContent>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3, pt: 1 }}>
              <Controller
                name="name"
                control={control}
                rules={{ required: 'カテゴリ名は必須です' }}
                render={({ field }) => (
                  <TextField
                    {...field}
                    label="カテゴリ名"
                    error={!!errors.name}
                    helperText={errors.name?.message}
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
              作成
            </Button>
          </DialogActions>
        </form>
      </Dialog>

      {/* 削除確認ダイアログ */}
      <Dialog open={deleteDialogOpen} onClose={() => setDeleteDialogOpen(false)}>
        <DialogTitle>カテゴリ削除確認</DialogTitle>
        <DialogContent>
          <Typography>
            「{selectedCategory?.name}」を削除しますか？
          </Typography>
          <Alert severity="warning" sx={{ mt: 2 }}>
            この操作は元に戻せません。
          </Alert>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialogOpen(false)} disabled={loading}>
            キャンセル
          </Button>
          <Button
            onClick={handleDeleteCategory}
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