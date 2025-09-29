// ダッシュボード画面コンポーネント
import React, { useEffect, useState } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Chip,
  Button,
  Avatar,
  Paper,
  LinearProgress,
  Alert,
  Divider,
  IconButton,
  Badge,
} from '@mui/material';
import {
  Assignment as AssignmentIcon,
  Schedule as ScheduleIcon,
  Warning as WarningIcon,
  TrendingUp as TrendingUpIcon,
  Warning as SOSIcon,
  Add as AddIcon,
  PlayArrow as PlayArrowIcon,
  CheckCircle as CheckCircleIcon,
  Edit as EditIcon,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../stores/authStore';
import { useTaskStore } from '../stores/taskStore';
import { getTodayTasks, getOverdueTasks, getSOSTasks, getUserTasks, calculateUserLoad } from '../utils/taskUtils';
import { formatDateToShort, getRelativeTime } from '../utils/dateUtils';

// 統計情報カードコンポーネント
interface StatCardProps {
  title: string;
  value: number;
  icon: React.ReactElement;
  color: 'primary' | 'secondary' | 'error' | 'warning' | 'info' | 'success';
  description?: string;
}

const StatCard: React.FC<StatCardProps> = ({ title, value, icon, color, description }) => (
  <Card sx={{ height: '100%' }}>
    <CardContent>
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
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

export const Dashboard: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const { tasks, sosNotifications, categories } = useTaskStore();

  // 自分のタスクを取得
  const myTasks = user ? getUserTasks(tasks, user.id) : [];
  const todayTasks = getTodayTasks(myTasks);
  const overdueTasks = getOverdueTasks(myTasks);
  const sosTasks = getSOSTasks(tasks); // 全体のSOS（チーム状況用）

  // 自分のタスク統計を計算
  const completedTasks = myTasks.filter(task => task.status === 'completed').length;
  const inProgressTasks = myTasks.filter(task => task.status === 'in_progress').length;
  const notStartedTasks = myTasks.filter(task => task.status === 'not_started').length;

  // 負荷状況を計算
  const userLoad = user ? calculateUserLoad(tasks, user.id, user.name) : null;

  return (
    <Box>
      {/* ページヘッダー */}
      <Box sx={{ mb: 3 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          ダッシュボード
        </Typography>
        <Typography variant="body1" color="text.secondary">
          {user?.name}さん、お疲れさまです。今日のタスク状況をご確認ください。
        </Typography>
      </Box>

      {/* 統計情報カード */}
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
          title="今日の期限"
          value={todayTasks.length}
          icon={<ScheduleIcon />}
          color="info"
          description="本日期限のタスク"
        />
        <StatCard
          title="期限切れ"
          value={overdueTasks.length}
          icon={<WarningIcon />}
          color="error"
          description="対応が必要"
        />
        <StatCard
          title="進行中"
          value={inProgressTasks}
          icon={<PlayArrowIcon />}
          color="warning"
          description="作業中のタスク"
        />
        <StatCard
          title="SOS"
          value={sosTasks.length}
          icon={<SOSIcon />}
          color="error"
          description="チーム全体"
        />
      </Box>

      <Box sx={{
        display: 'grid',
        gridTemplateColumns: { xs: '1fr', md: '2fr 1fr' },
        gap: 3
      }}>
        {/* 左カラム */}
        <Box>
          {/* 今日のタスク */}
          <Card sx={{ mb: 3 }}>
            <CardContent>
              <Box sx={{ display: 'flex', justifyContent: 'between', alignItems: 'center', mb: 2 }}>
                <Typography variant="h6" component="h2">
                  今日の期限タスク
                </Typography>
                <Button
                  variant="outlined"
                  size="small"
                  startIcon={<AddIcon />}
                  sx={{ ml: 'auto' }}
                  onClick={() => {
                    console.log('Navigating to tasks/new');
                    navigate('/tasks/new');
                  }}
                >
                  タスク追加
                </Button>
              </Box>

              {todayTasks.length === 0 ? (
                <Box sx={{ textAlign: 'center', py: 4 }}>
                  <CheckCircleIcon sx={{ fontSize: 48, color: 'success.main', mb: 1 }} />
                  <Typography variant="body1" color="text.secondary">
                    今日期限のタスクはありません
                  </Typography>
                </Box>
              ) : (
                <List>
                  {todayTasks.map((task, index) => (
                    <React.Fragment key={task.id}>
                      <ListItem
                        secondaryAction={
                          <Box sx={{ display: 'flex', gap: 1 }}>
                            {task.sosFlag && (
                              <Badge badgeContent="SOS" color="error">
                                <SOSIcon color="error" />
                              </Badge>
                            )}
                            <IconButton
                              size="small"
                              onClick={() => {
                                console.log('Navigating to edit task:', task.id);
                                navigate(`/tasks?edit=${task.id}`);
                              }}
                            >
                              <EditIcon />
                            </IconButton>
                          </Box>
                        }
                      >
                        <ListItemIcon>
                          <AssignmentIcon color={task.status === 'completed' ? 'success' : 'primary'} />
                        </ListItemIcon>
                        <ListItemText
                          primary={task.title}
                          secondary={
                            <Box sx={{ display: 'flex', gap: 1, mt: 1 }}>
                              <Chip
                                size="small"
                                label={task.priority === 'high' ? '高' : task.priority === 'medium' ? '中' : '低'}
                                color={task.priority === 'high' ? 'error' : task.priority === 'medium' ? 'warning' : 'default'}
                              />
                              <Chip
                                size="small"
                                label={categories.find(c => c.id === task.categoryId)?.name || 'その他'}
                                variant="outlined"
                              />
                            </Box>
                          }
                        />
                      </ListItem>
                      {index < todayTasks.length - 1 && <Divider />}
                    </React.Fragment>
                  ))}
                </List>
              )}
            </CardContent>
          </Card>

          {/* 期限切れタスク */}
          {overdueTasks.length > 0 && (
            <Card sx={{ mb: 3 }}>
              <CardContent>
                <Typography variant="h6" component="h2" sx={{ mb: 2, color: 'error.main' }}>
                  期限切れタスク
                </Typography>
                <Alert severity="warning" sx={{ mb: 2 }}>
                  以下のタスクは期限を過ぎています。優先的に対応してください。
                </Alert>
                <List>
                  {overdueTasks.slice(0, 5).map((task, index) => (
                    <React.Fragment key={task.id}>
                      <ListItem
                        secondaryAction={
                          <Box sx={{ display: 'flex', gap: 1 }}>
                            {task.sosFlag && (
                              <Badge badgeContent="SOS" color="error">
                                <SOSIcon color="error" />
                              </Badge>
                            )}
                            <IconButton
                              size="small"
                              onClick={() => {
                                console.log('Navigating to edit task:', task.id);
                                navigate(`/tasks?edit=${task.id}`);
                              }}
                            >
                              <EditIcon />
                            </IconButton>
                          </Box>
                        }
                      >
                        <ListItemIcon>
                          <WarningIcon color="error" />
                        </ListItemIcon>
                        <ListItemText
                          primary={task.title}
                          secondary={
                            <Box>
                              <Typography variant="body2" color="error">
                                期限: {formatDateToShort(task.endDate)} ({getRelativeTime(task.endDate)})
                              </Typography>
                              <Box sx={{ display: 'flex', gap: 1, mt: 1 }}>
                                <Chip
                                  size="small"
                                  label={task.priority === 'high' ? '高' : task.priority === 'medium' ? '中' : '低'}
                                  color={task.priority === 'high' ? 'error' : task.priority === 'medium' ? 'warning' : 'default'}
                                />
                              </Box>
                            </Box>
                          }
                        />
                      </ListItem>
                      {index < Math.min(overdueTasks.length, 5) - 1 && <Divider />}
                    </React.Fragment>
                  ))}
                </List>
              </CardContent>
            </Card>
          )}
        </Box>

        {/* 右カラム */}
        <Box>
          {/* 自分の負荷状況 */}
          {userLoad && (
            <Card sx={{ mb: 3 }}>
              <CardContent>
                <Typography variant="h6" component="h2" sx={{ mb: 2 }}>
                  あなたの負荷状況
                </Typography>
                <Box sx={{ mb: 2 }}>
                  <Typography variant="body2" color="text.secondary" gutterBottom>
                    今週のタスク数
                  </Typography>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Typography variant="h5" component="div">
                      {userLoad.weeklyTaskCount}
                    </Typography>
                    <Chip
                      size="small"
                      label={userLoad.loadLevel === 'light' ? '余裕' : userLoad.loadLevel === 'normal' ? '適正' : '過負荷'}
                      color={userLoad.loadLevel === 'light' ? 'success' : userLoad.loadLevel === 'normal' ? 'warning' : 'error'}
                    />
                  </Box>
                  <LinearProgress
                    variant="determinate"
                    value={Math.min((userLoad.weeklyTaskCount / 5) * 100, 100)}
                    color={userLoad.loadLevel === 'light' ? 'success' : userLoad.loadLevel === 'normal' ? 'warning' : 'error'}
                    sx={{ mt: 1 }}
                  />
                </Box>
                <Typography variant="body2" color="text.secondary">
                  今月: {userLoad.monthlyTaskCount}タスク
                </Typography>
              </CardContent>
            </Card>
          )}

          {/* タスク進捗 */}
          <Card sx={{ mb: 3 }}>
            <CardContent>
              <Typography variant="h6" component="h2" sx={{ mb: 2 }}>
                タスク進捗
              </Typography>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Typography variant="body2">完了済み</Typography>
                  <Chip size="small" label={completedTasks} color="success" />
                </Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Typography variant="body2">進行中</Typography>
                  <Chip size="small" label={inProgressTasks} color="warning" />
                </Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Typography variant="body2">未着手</Typography>
                  <Chip size="small" label={notStartedTasks} color="default" />
                </Box>
              </Box>
            </CardContent>
          </Card>

          {/* チームSOS状況 */}
          {sosTasks.length > 0 && (
            <Card>
              <CardContent>
                <Typography variant="h6" component="h2" sx={{ mb: 2, color: 'error.main' }}>
                  チームSOS状況
                </Typography>
                <Alert severity="error" sx={{ mb: 2 }}>
                  {sosTasks.length}件のタスクでSOSが発信されています
                </Alert>
                <List dense>
                  {sosTasks.slice(0, 3).map((task) => (
                    <ListItem key={task.id} disablePadding>
                      <ListItemIcon>
                        <SOSIcon color="error" fontSize="small" />
                      </ListItemIcon>
                      <ListItemText
                        primary={task.title}
                        primaryTypographyProps={{ fontSize: '0.875rem' }}
                        secondary={task.sosComment}
                        secondaryTypographyProps={{ fontSize: '0.75rem' }}
                      />
                    </ListItem>
                  ))}
                </List>
                {sosTasks.length > 3 && (
                  <Button
                    fullWidth
                    variant="outlined"
                    size="small"
                    sx={{ mt: 1 }}
                    onClick={() => {
                      console.log('Navigating to SOS list');
                      navigate('/sos');
                    }}
                  >
                    すべて見る (+{sosTasks.length - 3}件)
                  </Button>
                )}
              </CardContent>
            </Card>
          )}
        </Box>
      </Box>
    </Box>
  );
};