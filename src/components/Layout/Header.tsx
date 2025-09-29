// ヘッダーコンポーネント
import React, { useState } from 'react';
import {
  AppBar,
  Toolbar,
  IconButton,
  Typography,
  Badge,
  Menu,
  MenuItem,
  Avatar,
  Box,
  Chip,
  Divider,
} from '@mui/material';
import {
  Menu as MenuIcon,
  Notifications as NotificationsIcon,
  AccountCircle,
  Dashboard as DashboardIcon,
  Logout as LogoutIcon,
  Settings as SettingsIcon,
  Warning as SOSIcon,
} from '@mui/icons-material';
import { useAuthStore } from '../../stores/authStore';
import { useTaskStore } from '../../stores/taskStore';

interface HeaderProps {
  drawerWidth: number;
  isDrawerOpen: boolean;
  onDrawerToggle: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  drawerWidth,
  isDrawerOpen,
  onDrawerToggle,
}) => {
  const { user, logout } = useAuthStore();
  const { sosNotifications } = useTaskStore();

  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [notificationAnchor, setNotificationAnchor] = useState<null | HTMLElement>(null);

  // SOSの未解決通知数を計算
  const unreadSosCount = sosNotifications.filter(n => !n.isResolved).length;

  // ユーザーメニュー開閉
  const handleMenu = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  // 通知メニュー開閉
  const handleNotificationMenu = (event: React.MouseEvent<HTMLElement>) => {
    setNotificationAnchor(event.currentTarget);
  };

  const handleNotificationClose = () => {
    setNotificationAnchor(null);
  };

  // ログアウト処理
  const handleLogout = () => {
    logout();
    handleClose();
    // ログインページにリダイレクト（後でReact Routerで実装）
    window.location.href = '/login';
  };

  return (
    <AppBar
      position="fixed"
      sx={{
        width: {
          md: isDrawerOpen ? `calc(100% - ${drawerWidth}px)` : '100%'
        },
        ml: {
          md: isDrawerOpen ? `${drawerWidth}px` : 0
        },
        zIndex: (theme) => theme.zIndex.drawer + 1,
        backgroundColor: '#1976d2',
      }}
    >
      <Toolbar>
        {/* メニューボタン */}
        <IconButton
          color="inherit"
          aria-label="toggle drawer"
          edge="start"
          onClick={onDrawerToggle}
          sx={{ mr: 2 }}
        >
          <MenuIcon />
        </IconButton>

        {/* アプリケーション名 */}
        <Typography variant="h6" noWrap component="div" sx={{ flexGrow: 1 }}>
          社内スケジュール管理システム
        </Typography>

        {/* 右側のアクション */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          {/* SOS通知アイコン */}
          <IconButton
            color="inherit"
            onClick={handleNotificationMenu}
            sx={{
              '&:hover': {
                backgroundColor: 'rgba(255, 255, 255, 0.1)',
              },
            }}
          >
            <Badge badgeContent={unreadSosCount} color="error">
              <NotificationsIcon />
            </Badge>
          </IconButton>

          {/* ユーザー情報 */}
          {user && (
            <>
              <Box sx={{ display: { xs: 'none', sm: 'flex' }, alignItems: 'center', gap: 1 }}>
                <Chip
                  label={user.role === 'admin' ? '管理者' : 'ユーザー'}
                  size="small"
                  color={user.role === 'admin' ? 'secondary' : 'default'}
                  variant="outlined"
                  sx={{ color: 'white', borderColor: 'rgba(255, 255, 255, 0.5)' }}
                />
                <Typography variant="body2" sx={{ color: 'rgba(255, 255, 255, 0.9)' }}>
                  {user.name}
                </Typography>
              </Box>

              <IconButton
                size="large"
                aria-label="account of current user"
                aria-controls="menu-appbar"
                aria-haspopup="true"
                onClick={handleMenu}
                color="inherit"
                sx={{
                  '&:hover': {
                    backgroundColor: 'rgba(255, 255, 255, 0.1)',
                  },
                }}
              >
                <Avatar
                  sx={{
                    width: 32,
                    height: 32,
                    backgroundColor: 'rgba(255, 255, 255, 0.2)',
                    fontSize: '0.875rem'
                  }}
                >
                  {user.name.charAt(0)}
                </Avatar>
              </IconButton>
            </>
          )}
        </Box>

        {/* ユーザーメニュー */}
        <Menu
          id="menu-appbar"
          anchorEl={anchorEl}
          anchorOrigin={{
            vertical: 'bottom',
            horizontal: 'right',
          }}
          keepMounted
          transformOrigin={{
            vertical: 'top',
            horizontal: 'right',
          }}
          open={Boolean(anchorEl)}
          onClose={handleClose}
        >
          {user && (
            <Box sx={{ px: 2, py: 1, minWidth: 200 }}>
              <Typography variant="subtitle2" color="text.secondary">
                {user.name}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {user.email}
              </Typography>
            </Box>
          )}
          <Divider />
          <MenuItem onClick={handleClose}>
            <DashboardIcon sx={{ mr: 1 }} />
            ダッシュボード
          </MenuItem>
          <MenuItem onClick={handleClose}>
            <SettingsIcon sx={{ mr: 1 }} />
            設定
          </MenuItem>
          <Divider />
          <MenuItem onClick={handleLogout}>
            <LogoutIcon sx={{ mr: 1 }} />
            ログアウト
          </MenuItem>
        </Menu>

        {/* SOS通知メニュー */}
        <Menu
          anchorEl={notificationAnchor}
          anchorOrigin={{
            vertical: 'bottom',
            horizontal: 'right',
          }}
          keepMounted
          transformOrigin={{
            vertical: 'top',
            horizontal: 'right',
          }}
          open={Boolean(notificationAnchor)}
          onClose={handleNotificationClose}
        >
          <Box sx={{ px: 2, py: 1, minWidth: 300 }}>
            <Typography variant="subtitle2" color="text.secondary">
              SOS通知
            </Typography>
          </Box>
          <Divider />
          {sosNotifications.length === 0 ? (
            <MenuItem disabled>
              <Typography variant="body2" color="text.secondary">
                通知はありません
              </Typography>
            </MenuItem>
          ) : (
            sosNotifications
              .filter(n => !n.isResolved)
              .slice(0, 5) // 最新5件まで表示
              .map((notification) => (
                <MenuItem key={notification.id} onClick={handleNotificationClose}>
                  <Box>
                    <Typography variant="body2">
                      タスクでSOSが発信されました
                    </Typography>
                    {notification.message && (
                      <Typography variant="caption" color="text.secondary">
                        {notification.message}
                      </Typography>
                    )}
                  </Box>
                </MenuItem>
              ))
          )}
        </Menu>
      </Toolbar>
    </AppBar>
  );
};