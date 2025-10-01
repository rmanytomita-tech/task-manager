// タスク管理画面コンポーネント
import React, { useState, useMemo, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  IconButton,
  Chip,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Alert,
  Badge,
  Menu,
  MenuItem,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Select,
  FormControl,
  InputLabel,
  OutlinedInput,
  InputAdornment,
  Tooltip,
  Fab,
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Search as SearchIcon,
  FilterList as FilterIcon,
  Warning as SOSIcon,
  MoreVert as MoreIcon,
  PlayArrow as StartIcon,
  Pause as PauseIcon,
  CheckCircle as CompleteIcon,
  Clear as ClearIcon,
} from '@mui/icons-material';
import { useAuthStore } from '../stores/authStore';
import { useTaskStore } from '../stores/taskStore';
import { Task } from '../types';
import { getStatusColor, getStatusLabel, getPriorityLabel, sortTasksByUrgency } from '../utils/taskUtils';
import { formatDateToShort, formatDateToJapanese } from '../utils/dateUtils';
import { TaskForm } from '../components/Tasks/TaskForm';

export const Tasks: React.FC = () => {
  const { user } = useAuthStore();
  const { tasks, categories, updateTask, deleteTask, toggleSOS, loadTasks, loadCategories, isLoading } = useTaskStore();

  // データ読み込み
  useEffect(() => {
    loadTasks();
    loadCategories();
  }, [loadTasks, loadCategories]);

  // フィルタ・検索状態
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<Task['status'] | 'all'>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [priorityFilter, setPriorityFilter] = useState<Task['priority'] | 'all'>('all');
  const [showMyTasks, setShowMyTasks] = useState(false);

  // UI状態
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [sosDialogOpen, setSosDialogOpen] = useState(false);
  const [sosDialogTask, setSosDialogTask] = useState<Task | null>(null); // SOS専用のタスク状態
  const [sosComment, setSosComment] = useState('');
  const [taskFormOpen, setTaskFormOpen] = useState(false);
  const [taskFormMode, setTaskFormMode] = useState<'create' | 'edit'>('create');

  // フィルタされたタスク一覧
  const filteredTasks = useMemo(() => {
    let filtered = tasks.filter(task => !task.isDeleted);

    // 検索フィルタ
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(task =>
        task.title.toLowerCase().includes(term) ||
        task.clientName?.toLowerCase().includes(term) ||
        task.projectName?.toLowerCase().includes(term) ||
        task.memo?.toLowerCase().includes(term)
      );
    }

    // ステータスフィルタ
    if (statusFilter !== 'all') {
      filtered = filtered.filter(task => task.status === statusFilter);
    }

    // カテゴリフィルタ
    if (categoryFilter !== 'all') {
      filtered = filtered.filter(task => task.categoryId === categoryFilter);
    }

    // 優先度フィルタ
    if (priorityFilter !== 'all') {
      filtered = filtered.filter(task => task.priority === priorityFilter);
    }

    // マイタスクフィルタ
    if (showMyTasks && user) {
      filtered = filtered.filter(task => task.assignedUserId === user.id);
    }

    // 緊急度順にソート
    return sortTasksByUrgency(filtered);
  }, [tasks, searchTerm, statusFilter, categoryFilter, priorityFilter, showMyTasks, user]);

  // メニューハンドラ
  const handleMenuClick = (event: React.MouseEvent<HTMLElement>, task: Task) => {
    setAnchorEl(event.currentTarget);
    setSelectedTask(task);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
    setSelectedTask(null);
  };

  // ステータス更新
  const handleStatusChange = (task: Task, newStatus: Task['status']) => {
    updateTask(task.id, { status: newStatus });
    handleMenuClose();
  };

  // SOS機能
  const handleSOSClick = () => {
    setSosDialogTask(selectedTask); // 専用状態にタスクを保存
    setSosDialogOpen(true);
    handleMenuClose();
  };

  const handleSOSSubmit = () => {
    if (sosDialogTask) {
      toggleSOS(sosDialogTask.id, sosComment);
      setSosComment('');
      setSosDialogOpen(false);
      setSosDialogTask(null);
    }
  };

  // 削除機能
  const handleDeleteClick = () => {
    setDeleteDialogOpen(true);
    handleMenuClose();
  };

  const handleDeleteConfirm = () => {
    if (selectedTask) {
      deleteTask(selectedTask.id);
      setDeleteDialogOpen(false);
      setSelectedTask(null);
    }
  };

  // タスクフォーム機能
  const handleNewTaskClick = () => {
    setTaskFormMode('create');
    setSelectedTask(null);
    setTaskFormOpen(true);
  };

  const handleEditTaskClick = () => {
    setTaskFormMode('edit');
    setTaskFormOpen(true);
    setAnchorEl(null); // メニューだけ閉じる（selectedTaskは保持）
  };

  const handleTaskFormClose = () => {
    setTaskFormOpen(false);
    setSelectedTask(null);
  };

  return (
    <Box>
      {/* ページヘッダー */}
      <Box sx={{ mb: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Box>
          <Typography variant="h4" component="h1" gutterBottom>
            タスク管理
          </Typography>
          <Typography variant="body1" color="text.secondary">
            全{filteredTasks.length}件のタスクが表示されています
          </Typography>
        </Box>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          size="large"
          onClick={handleNewTaskClick}
        >
          新規タスク作成
        </Button>
      </Box>

      {/* フィルタ・検索エリア */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Box sx={{
            display: 'grid',
            gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', md: 'repeat(4, 1fr)' },
            gap: 2,
            mb: 2
          }}>
            {/* 検索 */}
            <TextField
              placeholder="タスク検索..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon />
                  </InputAdornment>
                ),
                endAdornment: searchTerm && (
                  <InputAdornment position="end">
                    <IconButton
                      size="small"
                      onClick={() => setSearchTerm('')}
                    >
                      <ClearIcon />
                    </IconButton>
                  </InputAdornment>
                ),
              }}
              size="small"
            />

            {/* ステータスフィルタ */}
            <FormControl size="small">
              <InputLabel>ステータス</InputLabel>
              <Select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as Task['status'] | 'all')}
                label="ステータス"
              >
                <MenuItem value="all">すべて</MenuItem>
                <MenuItem value="not_started">未着手</MenuItem>
                <MenuItem value="in_progress">進行中</MenuItem>
                <MenuItem value="completed">完了</MenuItem>
              </Select>
            </FormControl>

            {/* カテゴリフィルタ */}
            <FormControl size="small">
              <InputLabel>カテゴリ</InputLabel>
              <Select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
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

            {/* 優先度フィルタ */}
            <FormControl size="small">
              <InputLabel>優先度</InputLabel>
              <Select
                value={priorityFilter}
                onChange={(e) => setPriorityFilter(e.target.value as Task['priority'] | 'all')}
                label="優先度"
              >
                <MenuItem value="all">すべて</MenuItem>
                <MenuItem value="high">高</MenuItem>
                <MenuItem value="medium">中</MenuItem>
                <MenuItem value="low">低</MenuItem>
              </Select>
            </FormControl>
          </Box>

          {/* マイタスクフィルタ */}
          <Box>
            <Button
              variant={showMyTasks ? 'contained' : 'outlined'}
              onClick={() => setShowMyTasks(!showMyTasks)}
              size="small"
            >
              マイタスクのみ表示
            </Button>
          </Box>
        </CardContent>
      </Card>

      {/* タスク一覧テーブル */}
      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>タスク名</TableCell>
              <TableCell>ステータス</TableCell>
              <TableCell>優先度</TableCell>
              <TableCell>緊急度</TableCell>
              <TableCell>期間</TableCell>
              <TableCell>担当者</TableCell>
              <TableCell>カテゴリ</TableCell>
              <TableCell>アクション</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {filteredTasks.map((task) => {
              const category = categories.find(c => c.id === task.categoryId);
              return (
                <TableRow
                  key={task.id}
                  sx={{
                    '&:hover': { backgroundColor: 'action.hover' },
                    backgroundColor: task.sosFlag ? 'error.light' : 'inherit',
                    opacity: task.status === 'completed' ? 0.7 : 1,
                  }}
                >
                  <TableCell>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Typography
                        variant="body2"
                        sx={{
                          fontWeight: task.sosFlag ? 600 : 400,
                          textDecoration: task.status === 'completed' ? 'line-through' : 'none',
                        }}
                      >
                        {task.title}
                      </Typography>
                      {task.sosFlag && (
                        <Badge badgeContent="SOS" color="error">
                          <SOSIcon color="error" fontSize="small" />
                        </Badge>
                      )}
                    </Box>
                    {(task.clientName || task.projectName) && (
                      <Typography variant="caption" color="text.secondary">
                        {task.clientName} {task.projectName && `- ${task.projectName}`}
                      </Typography>
                    )}
                  </TableCell>

                  <TableCell>
                    <Chip
                      size="small"
                      label={getStatusLabel(task.status)}
                      sx={{
                        backgroundColor: getStatusColor(task.status),
                        color: 'white',
                        fontWeight: 500,
                      }}
                    />
                  </TableCell>

                  <TableCell>
                    <Chip
                      size="small"
                      label={getPriorityLabel(task.priority)}
                      color={task.priority === 'high' ? 'error' : task.priority === 'medium' ? 'warning' : 'default'}
                      variant={task.priority === 'low' ? 'outlined' : 'filled'}
                    />
                  </TableCell>

                  <TableCell>
                    <Typography variant="body2" color="text.secondary">
                      {task.urgency}/5
                    </Typography>
                  </TableCell>

                  <TableCell>
                    <Typography variant="body2">
                      {formatDateToShort(task.startDate)} - {formatDateToShort(task.endDate)}
                    </Typography>
                  </TableCell>

                  <TableCell>
                    <Typography variant="body2">
                      {/* 後で担当者名を取得 */}
                      {task.assignedUserId}
                    </Typography>
                  </TableCell>

                  <TableCell>
                    <Typography variant="body2">
                      {category?.name || 'その他'}
                    </Typography>
                  </TableCell>

                  <TableCell>
                    <IconButton
                      size="small"
                      onClick={(e) => handleMenuClick(e, task)}
                    >
                      <MoreIcon />
                    </IconButton>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>

        {filteredTasks.length === 0 && (
          <Box sx={{ p: 4, textAlign: 'center' }}>
            <Typography variant="body1" color="text.secondary">
              条件に該当するタスクが見つかりませんでした
            </Typography>
          </Box>
        )}
      </TableContainer>

      {/* アクションメニュー */}
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleMenuClose}
      >
        <MenuItem onClick={handleEditTaskClick}>
          <EditIcon sx={{ mr: 1 }} />
          編集
        </MenuItem>
        <MenuItem onClick={() => handleStatusChange(selectedTask!, 'in_progress')} disabled={selectedTask?.status === 'in_progress'}>
          <StartIcon sx={{ mr: 1 }} />
          開始
        </MenuItem>
        <MenuItem onClick={() => handleStatusChange(selectedTask!, 'completed')} disabled={selectedTask?.status === 'completed'}>
          <CompleteIcon sx={{ mr: 1 }} />
          完了
        </MenuItem>
        <MenuItem onClick={handleSOSClick}>
          <SOSIcon sx={{ mr: 1 }} />
          {selectedTask?.sosFlag ? 'SOS解除' : 'SOS発信'}
        </MenuItem>
        <MenuItem onClick={handleDeleteClick} sx={{ color: 'error.main' }}>
          <DeleteIcon sx={{ mr: 1 }} />
          削除
        </MenuItem>
      </Menu>

      {/* SOS発信/解除ダイアログ */}
      <Dialog
        open={sosDialogOpen}
        onClose={() => {
          setSosDialogOpen(false);
          setSosDialogTask(null);
          setSosComment('');
        }}
      >
        <DialogTitle>
          {sosDialogTask?.sosFlag ? 'SOS解除' : 'SOS発信'}
        </DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            タスク: {sosDialogTask?.title}
          </Typography>
          {!sosDialogTask?.sosFlag && (
            <TextField
              autoFocus
              multiline
              rows={3}
              fullWidth
              label="コメント（任意）"
              value={sosComment}
              onChange={(e) => setSosComment(e.target.value)}
              placeholder="困っている内容や必要な支援を記入してください"
            />
          )}
          {sosDialogTask?.sosFlag && (
            <Alert severity="warning">
              このタスクのSOSを解除しますか？
            </Alert>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => {
            setSosDialogOpen(false);
            setSosDialogTask(null);
            setSosComment('');
          }}>
            キャンセル
          </Button>
          <Button
            onClick={handleSOSSubmit}
            variant="contained"
            color={sosDialogTask?.sosFlag ? 'primary' : 'error'}
          >
            {sosDialogTask?.sosFlag ? '解除' : '発信'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* 削除確認ダイアログ */}
      <Dialog open={deleteDialogOpen} onClose={() => setDeleteDialogOpen(false)}>
        <DialogTitle>タスク削除確認</DialogTitle>
        <DialogContent>
          <Typography>
            「{selectedTask?.title}」を削除しますか？
          </Typography>
          <Alert severity="info" sx={{ mt: 2 }}>
            削除したタスクは3ヶ月間保管され、管理者によって復元可能です。
          </Alert>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialogOpen(false)}>
            キャンセル
          </Button>
          <Button
            onClick={handleDeleteConfirm}
            variant="contained"
            color="error"
          >
            削除
          </Button>
        </DialogActions>
      </Dialog>

      {/* タスク作成・編集フォーム */}
      <TaskForm
        open={taskFormOpen}
        onClose={handleTaskFormClose}
        task={selectedTask || undefined}
        mode={taskFormMode}
      />
    </Box>
  );
};