// サイドナビゲーションコンポーネント
import React from 'react';
import {
  Box,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Toolbar,
  Typography,
  Divider,
  Chip,
  Badge,
} from '@mui/material';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  Dashboard as DashboardIcon,
  ViewKanban as KanbanIcon,
  BarChart as GanttIcon,
  People as PeopleIcon,
  Assessment as ReportIcon,
  Settings as SettingsIcon,
  Add as AddIcon,
  Search as SearchIcon,
  Assignment as TaskIcon,
  Warning as SosIcon,
  TrendingUp as LoadMeterIcon,
  Category as CategoryIcon,
} from '@mui/icons-material';
import { useAuthStore } from '../../stores/authStore';
import { useTaskStore } from '../../stores/taskStore';

// ナビゲーションアイテムの型定義
interface NavItem {
  id: string;
  label: string;
  icon: React.ReactElement;
  path: string;
  badge?: number;
  adminOnly?: boolean;
}

interface SidebarProps {
  onNavigate?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ onNavigate }) => {
  const { user } = useAuthStore();
  const { tasks, sosNotifications } = useTaskStore();
  const navigate = useNavigate();
  const location = useLocation();

  console.log('Sidebar - current location:', location.pathname);

  // 未解決のSOS件数を計算
  const sosCount = sosNotifications.filter(n => !n.isResolved).length;

  // 今日期限のタスク数を計算
  const todayTasks = tasks.filter(task => {
    if (task.isDeleted) return false;
    const today = new Date().toDateString();
    return new Date(task.endDate).toDateString() === today;
  }).length;

  // ナビゲーションメニューの定義
  const navigationItems: NavItem[] = [
    {
      id: 'dashboard',
      label: 'ダッシュボード',
      icon: <DashboardIcon />,
      path: '/',
      badge: todayTasks,
    },
    {
      id: 'tasks',
      label: 'タスク管理',
      icon: <TaskIcon />,
      path: '/tasks',
    },
    {
      id: 'gantt',
      label: 'ガントチャート',
      icon: <GanttIcon />,
      path: '/gantt',
    },
    {
      id: 'kanban',
      label: 'ステータスボード',
      icon: <KanbanIcon />,
      path: '/kanban',
    },
    {
      id: 'team-load',
      label: 'チーム負荷メーター',
      icon: <LoadMeterIcon />,
      path: '/team-load',
    },
  ];

  const quickActions: NavItem[] = [
    {
      id: 'add-task',
      label: 'タスク追加',
      icon: <AddIcon />,
      path: '/tasks/new',
    },
    {
      id: 'search',
      label: 'タスク検索',
      icon: <SearchIcon />,
      path: '/search',
    },
    {
      id: 'sos-list',
      label: 'SOS一覧',
      icon: <SosIcon />,
      path: '/sos',
      badge: sosCount,
    },
  ];

  const adminItems: NavItem[] = [
    {
      id: 'users',
      label: 'ユーザー管理',
      icon: <PeopleIcon />,
      path: '/admin/users',
      adminOnly: true,
    },
    {
      id: 'categories',
      label: 'カテゴリ管理',
      icon: <CategoryIcon />,
      path: '/admin/categories',
      adminOnly: true,
    },
    {
      id: 'reports',
      label: 'レポート',
      icon: <ReportIcon />,
      path: '/reports',
      adminOnly: true,
    },
    {
      id: 'settings',
      label: 'システム設定',
      icon: <SettingsIcon />,
      path: '/admin/settings',
      adminOnly: true,
    },
  ];

  // ナビゲーションアイテムをレンダリング
  const renderNavItems = (items: NavItem[]) => {
    return items
      .filter(item => !item.adminOnly || user?.role === 'admin')
      .map((item) => {
        const isActive = location.pathname === item.path;
        return (
          <ListItem key={item.id} disablePadding>
            <ListItemButton
              onClick={() => {
                console.log('Navigating to:', item.path);
                navigate(item.path);
                onNavigate?.();
              }}
              sx={{
                minHeight: 48,
                px: 2.5,
                '&:hover': {
                  backgroundColor: 'rgba(25, 118, 210, 0.08)',
                },
                backgroundColor: isActive ? 'rgba(25, 118, 210, 0.12)' : 'transparent',
                '& .MuiListItemIcon-root': {
                  color: isActive ? '#1976d2' : 'text.secondary',
                },
                '& .MuiListItemText-primary': {
                  color: isActive ? '#1976d2' : 'text.primary',
                  fontWeight: isActive ? 600 : 400,
                },
              }}
            >
              <ListItemIcon
                sx={{
                  minWidth: 0,
                  mr: 3,
                  justifyContent: 'center',
                  color: 'text.secondary',
                }}
              >
                {item.badge && item.badge > 0 ? (
                  <Badge badgeContent={item.badge} color="error">
                    {item.icon}
                  </Badge>
                ) : (
                  item.icon
                )}
              </ListItemIcon>
              <ListItemText
                primary={item.label}
                sx={{
                  '& .MuiListItemText-primary': {
                    fontSize: '0.875rem',
                    fontWeight: 500,
                  },
                }}
              />
            </ListItemButton>
          </ListItem>
        );
      });
  };

  return (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      {/* ロゴエリア */}
      <Toolbar
        sx={{
          backgroundColor: '#f5f5f5',
          borderBottom: '1px solid #e0e0e0',
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Box
            sx={{
              width: 32,
              height: 32,
              backgroundColor: '#1976d2',
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <DashboardIcon sx={{ color: 'white', fontSize: 20 }} />
          </Box>
          <Typography variant="h6" noWrap sx={{ fontSize: '1rem', fontWeight: 600 }}>
            Schedule
          </Typography>
        </Box>
      </Toolbar>

      {/* ナビゲーションメニュー */}
      <Box sx={{ overflow: 'auto', flexGrow: 1 }}>
        {/* メイン機能 */}
        <Box sx={{ px: 2, py: 1 }}>
          <Typography
            variant="overline"
            sx={{
              fontSize: '0.75rem',
              fontWeight: 600,
              color: 'text.secondary',
              letterSpacing: 1,
            }}
          >
            メイン機能
          </Typography>
        </Box>
        <List sx={{ py: 0 }}>
          {renderNavItems(navigationItems)}
        </List>

        <Divider sx={{ my: 1 }} />

        {/* クイックアクション */}
        <Box sx={{ px: 2, py: 1 }}>
          <Typography
            variant="overline"
            sx={{
              fontSize: '0.75rem',
              fontWeight: 600,
              color: 'text.secondary',
              letterSpacing: 1,
            }}
          >
            クイックアクション
          </Typography>
        </Box>
        <List sx={{ py: 0 }}>
          {renderNavItems(quickActions)}
        </List>

        {/* 管理者機能 */}
        {user?.role === 'admin' && (
          <>
            <Divider sx={{ my: 1 }} />
            <Box sx={{ px: 2, py: 1 }}>
              <Typography
                variant="overline"
                sx={{
                  fontSize: '0.75rem',
                  fontWeight: 600,
                  color: 'text.secondary',
                  letterSpacing: 1,
                }}
              >
                管理者機能
              </Typography>
            </Box>
            <List sx={{ py: 0 }}>
              {renderNavItems(adminItems)}
            </List>
          </>
        )}
      </Box>

      {/* フッター */}
      <Box sx={{ p: 2, borderTop: '1px solid #e0e0e0' }}>
        {user && (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Chip
              label={user.role === 'admin' ? '管理者' : 'ユーザー'}
              size="small"
              color={user.role === 'admin' ? 'primary' : 'default'}
              sx={{ fontSize: '0.75rem' }}
            />
            <Typography variant="caption" color="text.secondary" noWrap>
              {user.name}
            </Typography>
          </Box>
        )}
      </Box>
    </Box>
  );
};