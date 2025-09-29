// メインアプリケーションコンポーネント
import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import { CssBaseline } from '@mui/material';
import { useAuthStore } from './stores/authStore';
import { MainLayout } from './components/Layout/MainLayout';
import { Login } from './pages/Login';
import { Dashboard } from './pages/Dashboard';
import { Tasks } from './pages/Tasks';
import { GanttChart } from './pages/GanttChart';
import { TeamLoad } from './pages/TeamLoad';
import { SOSList } from './pages/SOSList';
import { UserManagement } from './pages/UserManagement';
import { CategoryManagement } from './pages/CategoryManagement';
import { ErrorBoundary } from './components/ErrorBoundary';
import { NotificationManager } from './components/Notifications/NotificationManager';

// Material-UIテーマの設定
const theme = createTheme({
  palette: {
    primary: {
      main: '#1976d2',
    },
    secondary: {
      main: '#dc004e',
    },
    background: {
      default: '#f5f5f5',
    },
  },
  typography: {
    fontFamily: [
      '-apple-system',
      'BlinkMacSystemFont',
      '"Segoe UI"',
      'Roboto',
      '"Helvetica Neue"',
      'Arial',
      'sans-serif',
    ].join(','),
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          textTransform: 'none',
        },
      },
    },
  },
});

// 認証が必要なルートを保護するコンポーネント
const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated } = useAuthStore();
  console.log('ProtectedRoute - isAuthenticated:', isAuthenticated);

  return isAuthenticated ? <>{children}</> : <Navigate to="/login" replace />;
};

// 認証済みユーザーをダッシュボードにリダイレクトするコンポーネント
const PublicRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated } = useAuthStore();

  return !isAuthenticated ? <>{children}</> : <Navigate to="/" replace />;
};

function App() {
  console.log('App component rendering...');
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <NotificationManager />
      <Router>
        <Routes>
          {/* パブリックルート（未認証時のみアクセス可能） */}
          <Route path="/login" element={
            <PublicRoute>
              <Login />
            </PublicRoute>
          } />

          {/* プロテクトルート（認証必須） */}
          <Route path="/" element={
            <ProtectedRoute>
              <MainLayout>
                <Dashboard />
              </MainLayout>
            </ProtectedRoute>
          } />

          <Route path="/tasks" element={
            <ProtectedRoute>
              <MainLayout>
                <ErrorBoundary>
                  <Tasks />
                </ErrorBoundary>
              </MainLayout>
            </ProtectedRoute>
          } />

          <Route path="/tasks/new" element={
            <ProtectedRoute>
              <MainLayout>
                <ErrorBoundary>
                  <Tasks />
                </ErrorBoundary>
              </MainLayout>
            </ProtectedRoute>
          } />

          <Route path="/sos" element={
            <ProtectedRoute>
              <MainLayout>
                <ErrorBoundary>
                  <SOSList />
                </ErrorBoundary>
              </MainLayout>
            </ProtectedRoute>
          } />

          <Route path="/gantt" element={
            <ProtectedRoute>
              <MainLayout>
                <ErrorBoundary>
                  <GanttChart />
                </ErrorBoundary>
              </MainLayout>
            </ProtectedRoute>
          } />

          <Route path="/team-load" element={
            <ProtectedRoute>
              <MainLayout>
                <ErrorBoundary>
                  <TeamLoad />
                </ErrorBoundary>
              </MainLayout>
            </ProtectedRoute>
          } />

          {/* 管理者専用ルート */}
          <Route path="/admin/users" element={
            <ProtectedRoute>
              <MainLayout>
                <ErrorBoundary>
                  <UserManagement />
                </ErrorBoundary>
              </MainLayout>
            </ProtectedRoute>
          } />

          <Route path="/admin/categories" element={
            <ProtectedRoute>
              <MainLayout>
                <ErrorBoundary>
                  <CategoryManagement />
                </ErrorBoundary>
              </MainLayout>
            </ProtectedRoute>
          } />

          {/* 404ページ - 存在しないルートは全てダッシュボードにリダイレクト */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Router>
    </ThemeProvider>
  );
}

export default App;
