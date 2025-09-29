// SOS一覧・管理画面コンポーネント
import React, { useState, useMemo } from 'react';
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
  IconButton,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Alert,
  Avatar,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  ListItemSecondaryAction,
  Badge,
  Tooltip,
} from '@mui/material';
import {
  Warning as WarningIcon,
  CheckCircle as ResolveIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Assignment as TaskIcon,
  Person as PersonIcon,
  Schedule as ScheduleIcon,
  PriorityHigh as PriorityIcon,
  Comment as CommentIcon,
  NotificationImportant as UrgentIcon,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../stores/authStore';
import { useTaskStore } from '../stores/taskStore';
import { getSOSTasks, getStatusColor, getStatusLabel, getPriorityLabel } from '../utils/taskUtils';
import { formatDateToShort, getRelativeTime } from '../utils/dateUtils';

type FilterStatus = 'all' | 'active' | 'resolved';
type SortBy = 'created' | 'priority' | 'deadline' | 'urgency';

// SOS解決ダイアログコンポーネント
interface ResolveSOSDialogProps {
  open: boolean;
  taskId: string | null;
  onClose: () => void;
  onResolve: (taskId: string, comment: string) => void;
}

const ResolveSOSDialog: React.FC<ResolveSOSDialogProps> = ({
  open,
  taskId,
  onClose,
  onResolve
}) => {
  const [comment, setComment] = useState('');

  const handleResolve = () => {
    if (taskId) {
      onResolve(taskId, comment);
      setComment('');
      onClose();
    }
  };

  const handleClose = () => {
    setComment('');
    onClose();
  };

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
      <DialogTitle>
        SOS解決
      </DialogTitle>
      <DialogContent>
        <Typography variant="body2" color="text.secondary" paragraph>
          このSOSを解決済みとしてマークします。解決内容や対応方法をコメントに記録してください。
        </Typography>
        <TextField
          autoFocus
          margin="dense"
          label="解決コメント"
          multiline
          rows={4}
          fullWidth
          variant="outlined"
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          placeholder="どのように解決したか、今後の対策など..."
        />
      </DialogContent>
      <DialogActions>
        <Button onClick={handleClose}>キャンセル</Button>
        <Button onClick={handleResolve} variant="contained" color="primary">
          解決完了
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export const SOSList: React.FC = () => {
  console.log('=== SOS LIST PAGE LOADED ===');
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const { tasks, categories, updateTask } = useTaskStore();

  // フィルター・ソート設定
  const [filterStatus, setFilterStatus] = useState<FilterStatus>('active');
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [sortBy, setSortBy] = useState<SortBy>('urgency');
  const [resolveDialog, setResolveDialog] = useState<{
    open: boolean;
    taskId: string | null;
  }>({ open: false, taskId: null });

  // SOSタスクの取得とフィルタリング
  const filteredSOSTasks = useMemo(() => {
    let sosTasks = getSOSTasks(tasks);

    // ステータスフィルター
    if (filterStatus === 'active') {
      sosTasks = sosTasks.filter(task => task.sosFlag);
    } else if (filterStatus === 'resolved') {
      sosTasks = sosTasks.filter(task => !task.sosFlag);
    }

    // カテゴリフィルター
    if (filterCategory !== 'all') {
      sosTasks = sosTasks.filter(task => task.categoryId === filterCategory);
    }

    // ソート
    sosTasks.sort((a, b) => {
      switch (sortBy) {
        case 'created':
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        case 'priority':
          const priorityOrder = { high: 3, medium: 2, low: 1 };
          return priorityOrder[b.priority] - priorityOrder[a.priority];
        case 'deadline':
          return new Date(a.endDate).getTime() - new Date(b.endDate).getTime();
        case 'urgency':
          return b.urgency - a.urgency;
        default:
          return 0;
      }
    });

    return sosTasks;
  }, [tasks, filterStatus, filterCategory, sortBy]);

  // 統計情報
  const stats = useMemo(() => {
    const allSOSTasks = getSOSTasks(tasks);
    const activeSOSCount = allSOSTasks.filter(task => task.sosFlag).length;
    const resolvedSOSCount = allSOSTasks.filter(task => !task.sosFlag).length;
    const highPriorityCount = allSOSTasks.filter(task => task.sosFlag && task.priority === 'high').length;
    const overdueCount = allSOSTasks.filter(task =>
      task.sosFlag && new Date(task.endDate) < new Date()
    ).length;

    return {
      total: allSOSTasks.length,
      active: activeSOSCount,
      resolved: resolvedSOSCount,
      highPriority: highPriorityCount,
      overdue: overdueCount,
    };
  }, [tasks]);

  // SOS解決処理
  const handleResolveTask = (taskId: string, comment: string) => {
    updateTask(taskId, {
      sosFlag: false,
      sosComment: comment ? `[解決] ${comment}` : '[解決] 対応完了',
    });
  };

  // SOSを再発信
  const handleReactivateSOS = (taskId: string) => {
    updateTask(taskId, {
      sosFlag: true,
      sosComment: '[再発信] 再度支援が必要です',
    });
  };

  return (
    <Box>
      {/* ページヘッダー */}
      <Box sx={{ mb: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Box>
          <Typography variant="h4" component="h1" gutterBottom>
            SOS管理
          </Typography>
          <Typography variant="body1" color="text.secondary">
            チーム全体のSOS状況を確認し、適切な支援を行いましょう
          </Typography>
        </Box>
        <Button
          variant="contained"
          color="primary"
          onClick={() => navigate('/tasks/new')}
        >
          新規タスク作成
        </Button>
      </Box>

      {/* 統計情報カード */}
      <Box sx={{
        display: 'grid',
        gridTemplateColumns: {
          xs: '1fr',
          sm: 'repeat(2, 1fr)',
          md: 'repeat(5, 1fr)'
        },
        gap: 2,
        mb: 3
      }}>
        <Card>
          <CardContent sx={{ textAlign: 'center' }}>
            <Typography variant="h4" color="primary.main">
              {stats.total}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              総SOS件数
            </Typography>
          </CardContent>
        </Card>
        <Card>
          <CardContent sx={{ textAlign: 'center' }}>
            <Typography variant="h4" color="error.main">
              {stats.active}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              未解決
            </Typography>
          </CardContent>
        </Card>
        <Card>
          <CardContent sx={{ textAlign: 'center' }}>
            <Typography variant="h4" color="success.main">
              {stats.resolved}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              解決済み
            </Typography>
          </CardContent>
        </Card>
        <Card>
          <CardContent sx={{ textAlign: 'center' }}>
            <Typography variant="h4" color="warning.main">
              {stats.highPriority}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              高優先度
            </Typography>
          </CardContent>
        </Card>
        <Card>
          <CardContent sx={{ textAlign: 'center' }}>
            <Typography variant="h4" color="error.main">
              {stats.overdue}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              期限切れ
            </Typography>
          </CardContent>
        </Card>
      </Box>

      {/* 緊急警告 */}
      {stats.overdue > 0 && (
        <Alert severity="error" sx={{ mb: 3 }}>
          <Typography variant="subtitle2" gutterBottom>
            緊急対応が必要です
          </Typography>
          {stats.overdue}件のSOSタスクが期限を過ぎています。至急対応してください。
        </Alert>
      )}

      {/* フィルター・ソートコントロール */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Box sx={{
            display: 'grid',
            gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', md: 'repeat(4, 1fr)' },
            gap: 2,
            alignItems: 'center'
          }}>
            <FormControl size="small">
              <InputLabel>ステータス</InputLabel>
              <Select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value as FilterStatus)}
                label="ステータス"
              >
                <MenuItem value="all">すべて</MenuItem>
                <MenuItem value="active">未解決</MenuItem>
                <MenuItem value="resolved">解決済み</MenuItem>
              </Select>
            </FormControl>

            <FormControl size="small">
              <InputLabel>カテゴリ</InputLabel>
              <Select
                value={filterCategory}
                onChange={(e) => setFilterCategory(e.target.value)}
                label="カテゴリ"
              >
                <MenuItem value="all">すべて</MenuItem>
                {categories.map((category) => (
                  <MenuItem key={category.id} value={category.id}>
                    {category.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <FormControl size="small">
              <InputLabel>並び順</InputLabel>
              <Select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as SortBy)}
                label="並び順"
              >
                <MenuItem value="urgency">緊急度順</MenuItem>
                <MenuItem value="deadline">期限順</MenuItem>
                <MenuItem value="priority">優先度順</MenuItem>
                <MenuItem value="created">作成日順</MenuItem>
              </Select>
            </FormControl>

            <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
              <Typography variant="body2" color="text.secondary">
                {filteredSOSTasks.length}件表示中
              </Typography>
            </Box>
          </Box>
        </CardContent>
      </Card>

      {/* SOSリスト */}
      <Card>
        <CardContent>
          {filteredSOSTasks.length === 0 ? (
            <Box sx={{ textAlign: 'center', py: 4 }}>
              <WarningIcon sx={{ fontSize: 48, color: 'text.disabled', mb: 2 }} />
              <Typography variant="h6" color="text.secondary" gutterBottom>
                {filterStatus === 'active' ? 'アクティブなSOSはありません' :
                 filterStatus === 'resolved' ? '解決済みのSOSはありません' :
                 'SOSはありません'}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {filterStatus === 'active' && 'チームの状況は良好です！'}
              </Typography>
            </Box>
          ) : (
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>タスク情報</TableCell>
                    <TableCell align="center">担当者</TableCell>
                    <TableCell align="center">緊急度</TableCell>
                    <TableCell align="center">期限</TableCell>
                    <TableCell align="center">SOSコメント</TableCell>
                    <TableCell align="center">アクション</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {filteredSOSTasks.map((task) => {
                    const category = categories.find(c => c.id === task.categoryId);
                    const isOverdue = new Date(task.endDate) < new Date();

                    return (
                      <TableRow key={task.id} hover>
                        <TableCell>
                          <Box>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                              <Typography variant="body2" fontWeight={500}>
                                {task.title}
                              </Typography>
                              {task.sosFlag && (
                                <Badge badgeContent="SOS" color="error" />
                              )}
                            </Box>
                            <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                              <Chip
                                size="small"
                                label={getStatusLabel(task.status)}
                                sx={{
                                  backgroundColor: getStatusColor(task.status),
                                  color: 'white',
                                  fontSize: '0.625rem',
                                }}
                              />
                              <Chip
                                size="small"
                                label={getPriorityLabel(task.priority)}
                                color={task.priority === 'high' ? 'error' :
                                       task.priority === 'medium' ? 'warning' : 'default'}
                                sx={{ fontSize: '0.625rem' }}
                              />
                              {category && (
                                <Chip
                                  size="small"
                                  label={category.name}
                                  variant="outlined"
                                  sx={{ fontSize: '0.625rem' }}
                                />
                              )}
                            </Box>
                          </Box>
                        </TableCell>

                        <TableCell align="center">
                          <Avatar sx={{ width: 32, height: 32, fontSize: '0.875rem', mx: 'auto' }}>
                            {task.assignedUserId?.charAt(0) || '?'}
                          </Avatar>
                        </TableCell>

                        <TableCell align="center">
                          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 1 }}>
                            <Typography variant="body2" fontWeight={500}>
                              {task.urgency}
                            </Typography>
                            {task.urgency >= 4 && (
                              <UrgentIcon color="error" fontSize="small" />
                            )}
                          </Box>
                        </TableCell>

                        <TableCell align="center">
                          <Box>
                            <Typography
                              variant="body2"
                              color={isOverdue ? 'error.main' : 'text.primary'}
                              fontWeight={isOverdue ? 600 : 400}
                            >
                              {formatDateToShort(task.endDate)}
                            </Typography>
                            <Typography variant="caption" color={isOverdue ? 'error' : 'text.secondary'}>
                              {getRelativeTime(task.endDate)}
                            </Typography>
                          </Box>
                        </TableCell>

                        <TableCell align="center" sx={{ maxWidth: 200 }}>
                          {task.sosComment ? (
                            <Tooltip title={task.sosComment}>
                              <Typography
                                variant="body2"
                                sx={{
                                  overflow: 'hidden',
                                  textOverflow: 'ellipsis',
                                  whiteSpace: 'nowrap',
                                  maxWidth: 180
                                }}
                              >
                                {task.sosComment}
                              </Typography>
                            </Tooltip>
                          ) : (
                            <Typography variant="body2" color="text.secondary">
                              コメントなし
                            </Typography>
                          )}
                        </TableCell>

                        <TableCell align="center">
                          <Box sx={{ display: 'flex', gap: 0.5, justifyContent: 'center' }}>
                            <Tooltip title="タスク詳細">
                              <IconButton
                                size="small"
                                onClick={() => navigate(`/tasks?edit=${task.id}`)}
                              >
                                <EditIcon />
                              </IconButton>
                            </Tooltip>
                            {task.sosFlag ? (
                              <Tooltip title="SOS解決">
                                <IconButton
                                  size="small"
                                  color="success"
                                  onClick={() => setResolveDialog({ open: true, taskId: task.id })}
                                >
                                  <ResolveIcon />
                                </IconButton>
                              </Tooltip>
                            ) : (
                              <Tooltip title="SOS再発信">
                                <IconButton
                                  size="small"
                                  color="error"
                                  onClick={() => handleReactivateSOS(task.id)}
                                >
                                  <WarningIcon />
                                </IconButton>
                              </Tooltip>
                            )}
                          </Box>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </CardContent>
      </Card>

      {/* SOS解決ダイアログ */}
      <ResolveSOSDialog
        open={resolveDialog.open}
        taskId={resolveDialog.taskId}
        onClose={() => setResolveDialog({ open: false, taskId: null })}
        onResolve={handleResolveTask}
      />
    </Box>
  );
};