// メインレイアウトコンポーネント
import React, { useState } from 'react';
import {
  Box,
  AppBar,
  Toolbar,
  Typography,
  Drawer,
  IconButton,
  useTheme,
  useMediaQuery,
} from '@mui/material';
import {
  Menu as MenuIcon,
  ChevronLeft as ChevronLeftIcon,
} from '@mui/icons-material';
import { Header } from './Header';
import { Sidebar } from './Sidebar';

// ドロワーの幅
const DRAWER_WIDTH = 280;

interface MainLayoutProps {
  children: React.ReactNode;
}

export const MainLayout: React.FC<MainLayoutProps> = ({ children }) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const [mobileOpen, setMobileOpen] = useState(false);
  const [desktopOpen, setDesktopOpen] = useState(false);

  // モバイルでのドロワー開閉
  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen);
  };

  // デスクトップでのドロワー開閉
  const handleDesktopDrawerToggle = () => {
    setDesktopOpen(!desktopOpen);
  };

  return (
    <Box sx={{ display: 'flex' }}>
      {/* ヘッダー */}
      <Header
        drawerWidth={DRAWER_WIDTH}
        isDrawerOpen={isMobile ? mobileOpen : desktopOpen}
        onDrawerToggle={isMobile ? handleDrawerToggle : handleDesktopDrawerToggle}
      />

      {/* サイドバー - モバイル用 */}
      {isMobile && (
        <Drawer
          variant="temporary"
          open={mobileOpen}
          onClose={handleDrawerToggle}
          ModalProps={{
            keepMounted: true, // モバイルでのパフォーマンス向上
          }}
          sx={{
            display: { xs: 'block', md: 'none' },
            '& .MuiDrawer-paper': {
              boxSizing: 'border-box',
              width: DRAWER_WIDTH,
            },
          }}
        >
          <Sidebar onNavigate={handleDrawerToggle} />
        </Drawer>
      )}

      {/* サイドバー - デスクトップ用 */}
      {!isMobile && (
        <Drawer
          variant="temporary"
          open={desktopOpen}
          onClose={handleDesktopDrawerToggle}
          sx={{
            display: { xs: 'none', md: 'block' },
            '& .MuiDrawer-paper': {
              boxSizing: 'border-box',
              width: DRAWER_WIDTH,
            },
          }}
        >
          <Sidebar onNavigate={handleDesktopDrawerToggle} />
        </Drawer>
      )}

      {/* メインコンテンツエリア */}
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          width: '100%',
          minHeight: '100vh',
          backgroundColor: theme.palette.grey[50],
          transition: theme.transitions.create(['width', 'margin'], {
            easing: theme.transitions.easing.sharp,
            duration: theme.transitions.duration.leavingScreen,
          }),
        }}
      >
        {/* ヘッダーの高さ分のスペース */}
        <Toolbar />

        {/* ページコンテンツ */}
        <Box sx={{ p: 3 }}>
          {children}
        </Box>
      </Box>
    </Box>
  );
};