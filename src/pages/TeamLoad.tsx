// チーム負荷状況画面コンポーネント
import React, { useState, useMemo, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip,
  LinearProgress,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Alert,
  Avatar,
  Divider,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Badge,
} from '@mui/material';
import {
  People as PeopleIcon,
  TrendingUp as TrendingUpIcon,
  Warning as WarningIcon,
  Assignment as AssignmentIcon,
  Schedule as ScheduleIcon,
  CheckCircle as CheckCircleIcon,
  Error as ErrorIcon,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../stores/authStore';
import { useTaskStore } from '../stores/taskStore';
import { calculateTeamLoad, getOverdueTasks, getSOSTasks } from '../utils/taskUtils';
import { formatDateToShort, getRelativeTime } from '../utils/dateUtils';
import { userApi } from '../utils/apiClient';

type ViewMode = 'overview' | 'detailed';

// 負荷レベルの日本語表示
const getLoadLevelLabel = (level: string) => {
  switch (level) {
    case 'light': return '余裕';
    case 'normal': return '適正';
    case 'heavy': return '過負荷';
    default: return '不明';
  }
};

// 負荷レベルの色
const getLoadLevelColor = (level: string) => {
  switch (level) {
    case 'light': return 'success';
    case 'normal': return 'warning';
    case 'heavy': return 'error';
    default: return 'default';
  }
};

// 統計カードコンポーネント
interface StatCardProps {
  title: string;
  value: number;
  icon: React.ReactElement;
  color: 'primary' | 'secondary' | 'error' | 'warning' | 'info' | 'success';
  description?: string;
}

const StatCard: React.FC<StatCardProps> = ({ title, value, icon, color, description }) => (
  <Card>
    <CardContent>
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <Box>
          <Typography color="text.secondary" gutterBottom variant="overline">
            {title}
          </Typography>
          <Typography variant="h4" component="div" color={`${color}.main`}>
            {value}
          </Typography>
          {description && (
            <Typography variant="body2" color="text.secondary">
              {description}
            </Typography>
          )}
        </Box>
        <Avatar sx={{ bgcolor: `${color}.light`, width: 56, height: 56 }}>
          {icon}
        </Avatar>
      </Box>
    </CardContent>
  </Card>
);

export const TeamLoad: React.FC = () => {
  console.log('=== TEAM LOAD PAGE LOADED ===');
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const { tasks, categories, loadTasks, loadCategories } = useTaskStore();

  // ビュー設定
  const [viewMode, setViewMode] = useState<ViewMode>('overview');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  // ユーザー一覧
  const [users, setUsers] = useState<any[]>([]);

  // データ読み込み
  useEffect(() => {
    loadTasks();
    loadCategories();
  }, [loadTasks, loadCategories]);

  // ユーザー一覧を取得
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
    loadUsers();
  }, []);

  // フィルタリングされたタスク
  const filteredTasks = useMemo(() => {
    let filtered = tasks.filter(task => !task.isDeleted);

    if (selectedCategory !== 'all') {
      filtered = filtered.filter(task => task.categoryId === selectedCategory);
    }

    return filtered;
  }, [tasks, selectedCategory]);

  // チーム負荷状況を計算
  const teamLoad = useMemo(() =>
    calculateTeamLoad(filteredTasks, users),
    [filteredTasks, users]
  );

  // 統計情報
  const overallStats = useMemo(() => {
    const overdueTasks = getOverdueTasks(filteredTasks);
    const sosTasks = getSOSTasks(filteredTasks);
    const heavyLoadUsers = teamLoad.filter(user => user.loadLevel === 'heavy');
    const totalActiveUsers = teamLoad.filter(user => user.weeklyTaskCount > 0);

    return {
      totalUsers: users.length,
      activeUsers: totalActiveUsers.length,
      heavyLoadUsers: heavyLoadUsers.length,
      overdueTasks: overdueTasks.length,
      sosTasks: sosTasks.length,
      averageWeeklyTasks: teamLoad.length > 0 ? teamLoad.reduce((sum, user) => sum + user.weeklyTaskCount, 0) / teamLoad.length : 0,
    };
  }, [filteredTasks, teamLoad, users]);

  // 負荷状況の警告
  const loadWarnings = useMemo(() => {
    const warnings = [];
    const heavyUsers = teamLoad.filter(user => user.loadLevel === 'heavy');
    const lightUsers = teamLoad.filter(user => user.loadLevel === 'light' && user.weeklyTaskCount === 0);

    if (heavyUsers.length > 0) {
      warnings.push(`${heavyUsers.length}名のメンバーが過負荷状態です`);
    }

    if (users.length > 0 && lightUsers.length > users.length / 2) {
      warnings.push('チーム全体のタスク配分を見直すことをお勧めします');
    }

    return warnings;
  }, [teamLoad, users]);

  return (
    <Box>
      {/* ページヘッダー */}
      <Box sx={{ mb: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Box>
          <Typography variant="h4" component="h1" gutterBottom>
            チーム負荷状況
          </Typography>
          <Typography variant="body1" color="text.secondary">
            メンバーのタスク負荷状況とチーム全体のバランスを確認できます
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Button
            variant={viewMode === 'overview' ? 'contained' : 'outlined'}
            onClick={() => setViewMode('overview')}
            size="small"
          >
            概要
          </Button>
          <Button
            variant={viewMode === 'detailed' ? 'contained' : 'outlined'}
            onClick={() => setViewMode('detailed')}
            size="small"
          >
            詳細
          </Button>
        </Box>
      </Box>

      {/* フィルター */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
            <FormControl size="small" sx={{ minWidth: 200 }}>
              <InputLabel>カテゴリフィルター</InputLabel>
              <Select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                label="カテゴリフィルター"
              >
                <MenuItem value="all">すべて</MenuItem>
                {categories.map((category) => (
                  <MenuItem key={category.id} value={category.id}>
                    {category.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Box>
        </CardContent>
      </Card>

      {/* 警告表示 */}
      {loadWarnings.length > 0 && (
        <Alert severity="warning" sx={{ mb: 3 }}>
          <Typography variant="subtitle2" gutterBottom>
            負荷状況の注意点
          </Typography>
          <ul style={{ margin: 0, paddingLeft: '1.5rem' }}>
            {loadWarnings.map((warning, index) => (
              <li key={index}>{warning}</li>
            ))}
          </ul>
        </Alert>
      )}

      {/* 統計カード */}
      <Box sx={{
        display: 'grid',
        gridTemplateColumns: {
          xs: '1fr',
          sm: 'repeat(2, 1fr)',
          md: 'repeat(4, 1fr)'
        },
        gap: 3,
        mb: 3
      }}>
        <StatCard
          title="総メンバー数"
          value={overallStats.totalUsers}
          icon={<PeopleIcon />}
          color="primary"
          description="チーム全体"
        />
        <StatCard
          title="稼働中"
          value={overallStats.activeUsers}
          icon={<TrendingUpIcon />}
          color="success"
          description="タスクを持つメンバー"
        />
        <StatCard
          title="過負荷"
          value={overallStats.heavyLoadUsers}
          icon={<WarningIcon />}
          color="error"
          description="注意が必要"
        />
        <StatCard
          title="SOS"
          value={overallStats.sosTasks}
          icon={<ErrorIcon />}
          color="error"
          description="緊急対応必要"
        />
      </Box>

      {viewMode === 'overview' ? (
        // 概要ビュー
        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '2fr 1fr' }, gap: 3 }}>
          {/* メイン表示エリア */}
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                メンバー別負荷状況
              </Typography>

              <TableContainer>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>メンバー</TableCell>
                      <TableCell align="center">今週</TableCell>
                      <TableCell align="center">今月</TableCell>
                      <TableCell align="center">負荷状況</TableCell>
                      <TableCell align="center">進捗</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {teamLoad.map((member) => {
                      const progressValue = member.weeklyTaskCount > 0
                        ? Math.min((member.weeklyTaskCount / 5) * 100, 100)
                        : 0;

                      return (
                        <TableRow key={member.userId} hover>
                          <TableCell>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                              <Avatar sx={{ width: 32, height: 32, fontSize: '0.875rem' }}>
                                {member.userName.charAt(0)}
                              </Avatar>
                              <Typography variant="body2" fontWeight={500}>
                                {member.userName}
                              </Typography>
                            </Box>
                          </TableCell>
                          <TableCell align="center">
                            <Typography variant="body2">
                              {member.weeklyTaskCount}件
                            </Typography>
                          </TableCell>
                          <TableCell align="center">
                            <Typography variant="body2">
                              {member.monthlyTaskCount}件
                            </Typography>
                          </TableCell>
                          <TableCell align="center">
                            <Chip
                              size="small"
                              label={getLoadLevelLabel(member.loadLevel)}
                              color={getLoadLevelColor(member.loadLevel) as any}
                              variant={member.loadLevel === 'light' ? 'outlined' : 'filled'}
                            />
                          </TableCell>
                          <TableCell align="center" sx={{ width: 120 }}>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                              <LinearProgress
                                variant="determinate"
                                value={progressValue}
                                color={
                                  member.loadLevel === 'heavy' ? 'error' :
                                  member.loadLevel === 'normal' ? 'warning' : 'success'
                                }
                                sx={{ flexGrow: 1, height: 6 }}
                              />
                              <Typography variant="caption" color="text.secondary">
                                {Math.round(progressValue)}%
                              </Typography>
                            </Box>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </TableContainer>
            </CardContent>
          </Card>

          {/* サイドパネル */}
          <Box>
            {/* チーム統計 */}
            <Card sx={{ mb: 3 }}>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  チーム統計
                </Typography>
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                    <Typography variant="body2">平均週次タスク数</Typography>
                    <Typography variant="body2" fontWeight={500}>
                      {overallStats.averageWeeklyTasks.toFixed(1)}件
                    </Typography>
                  </Box>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                    <Typography variant="body2">期限切れタスク</Typography>
                    <Chip
                      size="small"
                      label={`${overallStats.overdueTasks}件`}
                      color={overallStats.overdueTasks > 0 ? 'error' : 'success'}
                    />
                  </Box>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                    <Typography variant="body2">SOSタスク</Typography>
                    <Chip
                      size="small"
                      label={`${overallStats.sosTasks}件`}
                      color={overallStats.sosTasks > 0 ? 'error' : 'success'}
                    />
                  </Box>
                </Box>
              </CardContent>
            </Card>

            {/* 負荷分散推奨 */}
            {overallStats.heavyLoadUsers > 0 && (
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom color="error">
                    負荷分散推奨
                  </Typography>
                  <Typography variant="body2" color="text.secondary" paragraph>
                    以下のメンバーが過負荷状態です。タスクの再配分を検討してください。
                  </Typography>
                  <List dense>
                    {teamLoad
                      .filter(member => member.loadLevel === 'heavy')
                      .map((member) => (
                        <ListItem key={member.userId} disablePadding>
                          <ListItemIcon>
                            <WarningIcon color="error" fontSize="small" />
                          </ListItemIcon>
                          <ListItemText
                            primary={member.userName}
                            secondary={`${member.weeklyTaskCount}件のタスク`}
                            primaryTypographyProps={{ fontSize: '0.875rem' }}
                            secondaryTypographyProps={{ fontSize: '0.75rem' }}
                          />
                        </ListItem>
                      ))}
                  </List>
                  <Button
                    fullWidth
                    variant="outlined"
                    size="small"
                    sx={{ mt: 2 }}
                    onClick={() => navigate('/tasks')}
                  >
                    タスク管理で調整
                  </Button>
                </CardContent>
              </Card>
            )}
          </Box>
        </Box>
      ) : (
        // 詳細ビュー
        <Box sx={{
          display: 'grid',
          gridTemplateColumns: { xs: '1fr', md: 'repeat(2, 1fr)' },
          gap: 3
        }}>
          {teamLoad.map((member) => {
            const memberTasks = filteredTasks.filter(task => task.assignedUserId === member.userId);
            const completedTasks = memberTasks.filter(task => task.status === 'completed');
            const inProgressTasks = memberTasks.filter(task => task.status === 'in_progress');
            const overdueTasks = getOverdueTasks(memberTasks);

            return (
              <Box key={member.userId}>
                <Card>
                  <CardContent>
                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                        <Avatar>{member.userName.charAt(0)}</Avatar>
                        <Box>
                          <Typography variant="h6">
                            {member.userName}
                          </Typography>
                          <Chip
                            size="small"
                            label={getLoadLevelLabel(member.loadLevel)}
                            color={getLoadLevelColor(member.loadLevel) as any}
                          />
                        </Box>
                      </Box>
                    </Box>

                    <Divider sx={{ my: 2 }} />

                    <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 2, mb: 2 }}>
                      <Box sx={{ textAlign: 'center' }}>
                        <Typography variant="h4" color="primary.main">
                          {member.weeklyTaskCount}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          今週のタスク
                        </Typography>
                      </Box>
                      <Box sx={{ textAlign: 'center' }}>
                        <Typography variant="h4" color="secondary.main">
                          {member.monthlyTaskCount}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          今月のタスク
                        </Typography>
                      </Box>
                    </Box>

                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <Typography variant="body2">完了</Typography>
                        <Chip size="small" label={completedTasks.length} color="success" />
                      </Box>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <Typography variant="body2">進行中</Typography>
                        <Chip size="small" label={inProgressTasks.length} color="warning" />
                      </Box>
                      {overdueTasks.length > 0 && (
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <Typography variant="body2" color="error">期限切れ</Typography>
                          <Chip size="small" label={overdueTasks.length} color="error" />
                        </Box>
                      )}
                    </Box>

                    {member.weeklyTaskCount > 0 && (
                      <Box sx={{ mt: 2 }}>
                        <LinearProgress
                          variant="determinate"
                          value={Math.min((member.weeklyTaskCount / 5) * 100, 100)}
                          color={
                            member.loadLevel === 'heavy' ? 'error' :
                            member.loadLevel === 'normal' ? 'warning' : 'success'
                          }
                        />
                        <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5, display: 'block' }}>
                          週次負荷: {Math.min((member.weeklyTaskCount / 5) * 100, 100).toFixed(0)}%
                        </Typography>
                      </Box>
                    )}
                  </CardContent>
                </Card>
              </Box>
            );
          })}
        </Box>
      )}
    </Box>
  );
};