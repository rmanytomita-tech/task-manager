// ログイン画面コンポーネント
import React, { useState } from 'react';
import {
  Box,
  Card,
  CardContent,
  TextField,
  Button,
  Typography,
  Alert,
  CircularProgress,
  Container,
  Avatar,
  Link,
  Divider,
} from '@mui/material';
import {
  LockOutlined as LockOutlinedIcon,
  Dashboard as DashboardIcon,
} from '@mui/icons-material';
import { useForm, Controller } from 'react-hook-form';
import { useAuthStore } from '../stores/authStore';
import { authApi } from '../utils/apiClient';

// フォームデータの型定義
interface LoginFormData {
  email: string;
  password: string;
}

export const Login: React.FC = () => {
  const { login, setLoading, isLoading } = useAuthStore();
  const [error, setError] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // React Hook Formの設定
  const { control, handleSubmit, formState: { errors } } = useForm<LoginFormData>({
    defaultValues: {
      email: '',
      password: '',
    },
  });

  // ログイン処理
  const onSubmit = async (data: LoginFormData) => {
    try {
      setIsSubmitting(true);
      setError('');
      setLoading(true);

      // API呼び出し（現在はモックデータでテスト）
      const response = await authApi.login(data.email, data.password);

      if (response.success && response.data) {
        // 成功時: トークンを保存してユーザー情報を設定
        localStorage.setItem('auth-token', response.data.token);
        login(response.data.user);

        // ダッシュボードにリダイレクト（後でReact Routerで実装）
        window.location.href = '/';
      } else {
        // エラー時
        setError(response.error || 'ログインに失敗しました');
      }
    } catch (err: any) {
      console.error('Login error:', err);
      setError('ネットワークエラーが発生しました');
    } finally {
      setIsSubmitting(false);
      setLoading(false);
    }
  };


  return (
    <Container component="main" maxWidth="xs">
      <Box
        sx={{
          minHeight: '100vh',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          px: 2,
        }}
      >
        <Card
          sx={{
            width: '100%',
            maxWidth: 400,
            boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)',
            backdropFilter: 'blur(10px)',
            border: '1px solid rgba(255, 255, 255, 0.2)',
          }}
        >
          <CardContent sx={{ p: 4 }}>
            {/* ヘッダー */}
            <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', mb: 3 }}>
              <Box
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 1,
                  mb: 2,
                }}
              >
                <Box
                  sx={{
                    width: 48,
                    height: 48,
                    backgroundColor: '#1976d2',
                    borderRadius: '50%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <DashboardIcon sx={{ color: 'white', fontSize: 28 }} />
                </Box>
              </Box>
              <Typography component="h1" variant="h5" sx={{ fontWeight: 600, mb: 1 }}>
                社内スケジュール管理システム
              </Typography>
              <Typography variant="body2" color="text.secondary" align="center">
                アカウント情報を入力してログインしてください
              </Typography>
            </Box>

            {/* エラーメッセージ */}
            {error && (
              <Alert severity="error" sx={{ mb: 2 }}>
                {error}
              </Alert>
            )}

            {/* ログインフォーム */}
            <form onSubmit={handleSubmit(onSubmit)}>
              <Controller
                name="email"
                control={control}
                rules={{
                  required: 'メールアドレスを入力してください',
                  pattern: {
                    value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                    message: '有効なメールアドレスを入力してください',
                  },
                }}
                render={({ field }) => (
                  <TextField
                    {...field}
                    margin="normal"
                    required
                    fullWidth
                    id="email"
                    label="メールアドレス"
                    name="email"
                    autoComplete="email"
                    autoFocus
                    error={!!errors.email}
                    helperText={errors.email?.message}
                    disabled={isSubmitting}
                  />
                )}
              />

              <Controller
                name="password"
                control={control}
                rules={{
                  required: 'パスワードを入力してください',
                  minLength: {
                    value: 6,
                    message: 'パスワードは6文字以上で入力してください',
                  },
                }}
                render={({ field }) => (
                  <TextField
                    {...field}
                    margin="normal"
                    required
                    fullWidth
                    name="password"
                    label="パスワード"
                    type="password"
                    id="password"
                    autoComplete="current-password"
                    error={!!errors.password}
                    helperText={errors.password?.message}
                    disabled={isSubmitting}
                  />
                )}
              />

              <Button
                type="submit"
                fullWidth
                variant="contained"
                sx={{
                  mt: 3,
                  mb: 2,
                  py: 1.5,
                  fontSize: '1rem',
                  fontWeight: 600,
                }}
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <CircularProgress size={24} color="inherit" />
                ) : (
                  'ログイン'
                )}
              </Button>
            </form>

            {/* アカウント情報 */}
            <Divider sx={{ my: 2 }}>
              <Typography variant="body2" color="text.secondary">
                アカウント情報
              </Typography>
            </Divider>

            <Box sx={{
              backgroundColor: 'rgba(0, 0, 0, 0.03)',
              borderRadius: 1,
              p: 2,
              mb: 2
            }}>
              <Typography variant="body2" sx={{ fontWeight: 600, mb: 1, color: 'primary.main' }}>
                管理者アカウント
              </Typography>
              <Typography variant="body2" sx={{ fontFamily: 'monospace', fontSize: '0.9rem' }}>
                Email: admin@schedule.local<br />
                Password: Admin@2025!
              </Typography>
            </Box>

            <Box sx={{
              backgroundColor: 'rgba(0, 0, 0, 0.03)',
              borderRadius: 1,
              p: 2
            }}>
              <Typography variant="body2" sx={{ fontWeight: 600, mb: 1, color: 'success.main' }}>
                デモアカウント
              </Typography>
              <Typography variant="body2" sx={{ fontFamily: 'monospace', fontSize: '0.9rem' }}>
                Email: demo@schedule.local<br />
                Password: Demo@2025!
              </Typography>
            </Box>

            {/* パスワードリセットリンク */}
            <Box sx={{ textAlign: 'center', mt: 3 }}>
              <Link href="#" variant="body2" color="primary">
                パスワードをお忘れですか？
              </Link>
            </Box>
          </CardContent>
        </Card>

      </Box>
    </Container>
  );
};