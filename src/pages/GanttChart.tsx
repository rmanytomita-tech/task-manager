// ガントチャート画面コンポーネント
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
  Tooltip,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
} from '@mui/material';
import {
  ZoomIn as ZoomInIcon,
  ZoomOut as ZoomOutIcon,
  Today as TodayIcon,
  ViewWeek as WeekIcon,
  ViewModule as MonthIcon,
  Fullscreen as FullscreenIcon,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../stores/authStore';
import { useTaskStore } from '../stores/taskStore';
import { Task } from '../types';
import { getStatusColor, getStatusLabel, getPriorityLabel } from '../utils/taskUtils';
import { formatDateToShort } from '../utils/dateUtils';

type ViewMode = 'week' | 'month' | '3month';

export const GanttChart: React.FC = () => {
  console.log('=== GANTT CHART PAGE LOADED ===');
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const { tasks, categories } = useTaskStore();

  // ビュー設定
  const [viewMode, setViewMode] = useState<ViewMode>('month');
  const [showMyTasks, setShowMyTasks] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  // 現在の日付を基準とした表示範囲
  const today = new Date();
  const [currentDate, setCurrentDate] = useState(today);

  // フィルタリングされたタスク
  const filteredTasks = useMemo(() => {
    let filtered = tasks.filter(task => !task.isDeleted);

    // マイタスクフィルター
    if (showMyTasks && user) {
      filtered = filtered.filter(task => task.assignedUserId === user.id);
    }

    // カテゴリフィルター
    if (selectedCategory !== 'all') {
      filtered = filtered.filter(task => task.categoryId === selectedCategory);
    }

    // 日付範囲でフィルタリング
    const startRange = new Date(currentDate);
    const endRange = new Date(currentDate);

    switch (viewMode) {
      case 'week':
        startRange.setDate(currentDate.getDate() - 7);
        endRange.setDate(currentDate.getDate() + 21); // 4週間表示
        break;
      case 'month':
        startRange.setMonth(currentDate.getMonth() - 1);
        endRange.setMonth(currentDate.getMonth() + 2); // 3ヶ月表示
        break;
      case '3month':
        startRange.setMonth(currentDate.getMonth() - 1);
        endRange.setMonth(currentDate.getMonth() + 5); // 6ヶ月表示
        break;
    }

    filtered = filtered.filter(task => {
      const taskStart = new Date(task.startDate);
      const taskEnd = new Date(task.endDate);
      return taskStart <= endRange && taskEnd >= startRange;
    });

    return filtered.sort((a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime());
  }, [tasks, user, showMyTasks, selectedCategory, viewMode, currentDate]);

  // ガントチャートの表示範囲を計算
  const getDateRange = () => {
    const start = new Date(currentDate);
    const end = new Date(currentDate);

    switch (viewMode) {
      case 'week':
        start.setDate(currentDate.getDate() - 7);
        end.setDate(currentDate.getDate() + 21);
        break;
      case 'month':
        start.setMonth(currentDate.getMonth() - 1);
        end.setMonth(currentDate.getMonth() + 2);
        break;
      case '3month':
        start.setMonth(currentDate.getMonth() - 1);
        end.setMonth(currentDate.getMonth() + 5);
        break;
    }

    return { start, end };
  };

  // 日付のグリッドを生成
  const generateDateGrid = () => {
    const { start, end } = getDateRange();
    const dates = [];
    const current = new Date(start);

    while (current <= end) {
      dates.push(new Date(current));
      current.setDate(current.getDate() + 1);
    }

    return dates;
  };

  const dateGrid = generateDateGrid();

  // タスクの位置とサイズを計算
  const calculateTaskPosition = (task: Task) => {
    const { start } = getDateRange();
    const taskStart = new Date(task.startDate);
    const taskEnd = new Date(task.endDate);

    const startDiff = Math.max(0, Math.floor((taskStart.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)));
    const duration = Math.max(1, Math.floor((taskEnd.getTime() - taskStart.getTime()) / (1000 * 60 * 60 * 24)) + 1);
    const maxDays = dateGrid.length;

    const left = (startDiff / maxDays) * 100;
    const width = Math.min((duration / maxDays) * 100, 100 - left);

    return { left: `${left}%`, width: `${width}%` };
  };

  // 今日の位置を計算
  const calculateTodayPosition = () => {
    const { start } = getDateRange();
    const todayDiff = Math.floor((today.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
    const maxDays = dateGrid.length;
    return (todayDiff / maxDays) * 100;
  };

  const todayPosition = calculateTodayPosition();

  return (
    <Box>
      {/* ページヘッダー */}
      <Box sx={{ mb: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Box>
          <Typography variant="h4" component="h1" gutterBottom>
            ガントチャート
          </Typography>
          <Typography variant="body1" color="text.secondary">
            全{filteredTasks.length}件のタスクをタイムライン表示しています
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Tooltip title="今日に移動">
            <IconButton onClick={() => setCurrentDate(new Date())}>
              <TodayIcon />
            </IconButton>
          </Tooltip>
          <Tooltip title="全画面表示">
            <IconButton>
              <FullscreenIcon />
            </IconButton>
          </Tooltip>
        </Box>
      </Box>

      {/* 制御パネル */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Box sx={{
            display: 'grid',
            gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', md: 'repeat(4, 1fr)' },
            gap: 2,
            alignItems: 'center'
          }}>
            {/* 表示モード */}
            <FormControl size="small">
              <InputLabel>表示期間</InputLabel>
              <Select
                value={viewMode}
                onChange={(e) => setViewMode(e.target.value as ViewMode)}
                label="表示期間"
              >
                <MenuItem value="week">4週間</MenuItem>
                <MenuItem value="month">3ヶ月</MenuItem>
                <MenuItem value="3month">6ヶ月</MenuItem>
              </Select>
            </FormControl>

            {/* カテゴリフィルター */}
            <FormControl size="small">
              <InputLabel>カテゴリ</InputLabel>
              <Select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
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

            {/* マイタスクフィルター */}
            <Button
              variant={showMyTasks ? 'contained' : 'outlined'}
              onClick={() => setShowMyTasks(!showMyTasks)}
              size="small"
            >
              マイタスクのみ
            </Button>

            {/* 日付ナビゲーション */}
            <Box sx={{ display: 'flex', gap: 1, justifyContent: 'flex-end' }}>
              <Button
                size="small"
                onClick={() => {
                  const newDate = new Date(currentDate);
                  if (viewMode === 'week') {
                    newDate.setDate(currentDate.getDate() - 7);
                  } else if (viewMode === 'month') {
                    newDate.setMonth(currentDate.getMonth() - 1);
                  } else {
                    newDate.setMonth(currentDate.getMonth() - 3);
                  }
                  setCurrentDate(newDate);
                }}
              >
                ← 前
              </Button>
              <Button
                size="small"
                onClick={() => {
                  const newDate = new Date(currentDate);
                  if (viewMode === 'week') {
                    newDate.setDate(currentDate.getDate() + 7);
                  } else if (viewMode === 'month') {
                    newDate.setMonth(currentDate.getMonth() + 1);
                  } else {
                    newDate.setMonth(currentDate.getMonth() + 3);
                  }
                  setCurrentDate(newDate);
                }}
              >
                次 →
              </Button>
            </Box>
          </Box>
        </CardContent>
      </Card>

      {/* ガントチャート本体 */}
      <Card>
        <CardContent sx={{ p: 1 }}>
          {/* 日付ヘッダー */}
          <Box sx={{ display: 'flex', borderBottom: '2px solid #e0e0e0', pb: 1, mb: 2 }}>
            {/* タスク名列 */}
            <Box sx={{ width: '250px', flexShrink: 0, pr: 2, fontWeight: 600, fontSize: '0.875rem' }}>
              タスク名
            </Box>
            {/* 日付グリッドヘッダー */}
            <Box sx={{ flex: 1, display: 'flex', position: 'relative', minHeight: '40px' }}>
              {/* 今日のライン */}
              {todayPosition >= 0 && todayPosition <= 100 && (
                <Box
                  sx={{
                    position: 'absolute',
                    left: `${todayPosition}%`,
                    top: 0,
                    bottom: 0,
                    width: '2px',
                    backgroundColor: 'error.main',
                    zIndex: 10,
                  }}
                />
              )}
              {/* 日付表示（サンプリング） */}
              {dateGrid.filter((_, index) => index % Math.max(1, Math.floor(dateGrid.length / 10)) === 0).map((date, index) => (
                <Box
                  key={index}
                  sx={{
                    position: 'absolute',
                    left: `${(dateGrid.indexOf(date) / dateGrid.length) * 100}%`,
                    fontSize: '0.75rem',
                    color: 'text.secondary',
                    transform: 'translateX(-50%)',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {formatDateToShort(date)}
                </Box>
              ))}
            </Box>
          </Box>

          {/* タスク行 */}
          <Box>
            {filteredTasks.length === 0 ? (
              <Box sx={{ textAlign: 'center', py: 4 }}>
                <Typography variant="body1" color="text.secondary">
                  表示するタスクがありません
                </Typography>
              </Box>
            ) : (
              filteredTasks.map((task) => {
                const category = categories.find(c => c.id === task.categoryId);
                const position = calculateTaskPosition(task);

                return (
                  <Box
                    key={task.id}
                    sx={{
                      display: 'flex',
                      alignItems: 'center',
                      minHeight: '48px',
                      borderBottom: '1px solid #f0f0f0',
                      '&:hover': { backgroundColor: 'action.hover' },
                    }}
                  >
                    {/* タスク情報列 */}
                    <Box sx={{ width: '250px', flexShrink: 0, pr: 2 }}>
                      <Typography variant="body2" sx={{ fontWeight: 500, mb: 0.5 }}>
                        {task.title}
                      </Typography>
                      <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap' }}>
                        <Chip
                          size="small"
                          label={getStatusLabel(task.status)}
                          sx={{
                            backgroundColor: getStatusColor(task.status),
                            color: 'white',
                            fontSize: '0.625rem',
                            height: '20px',
                          }}
                        />
                        <Chip
                          size="small"
                          label={getPriorityLabel(task.priority)}
                          color={task.priority === 'high' ? 'error' : task.priority === 'medium' ? 'warning' : 'default'}
                          variant={task.priority === 'low' ? 'outlined' : 'filled'}
                          sx={{ fontSize: '0.625rem', height: '20px' }}
                        />
                        {category && (
                          <Chip
                            size="small"
                            label={category.name}
                            variant="outlined"
                            sx={{ fontSize: '0.625rem', height: '20px' }}
                          />
                        )}
                      </Box>
                    </Box>

                    {/* ガントバー */}
                    <Box sx={{ flex: 1, position: 'relative', height: '32px' }}>
                      {/* 背景グリッド */}
                      <Box
                        sx={{
                          position: 'absolute',
                          top: 0,
                          left: 0,
                          right: 0,
                          bottom: 0,
                          backgroundImage: 'repeating-linear-gradient(to right, transparent, transparent 10%, #f0f0f0 10%, #f0f0f0 10.5%)',
                        }}
                      />

                      {/* タスクバー */}
                      <Tooltip
                        title={`${task.title} (${formatDateToShort(task.startDate)} - ${formatDateToShort(task.endDate)}) - クリックで詳細表示`}
                      >
                        <Box
                          onClick={() => {
                            console.log('Navigating to task detail:', task.id);
                            navigate(`/tasks?edit=${task.id}`);
                          }}
                          sx={{
                            position: 'absolute',
                            top: '6px',
                            height: '20px',
                            ...position,
                            backgroundColor: getStatusColor(task.status),
                            borderRadius: '10px',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            px: 1,
                            opacity: task.status === 'completed' ? 0.7 : 1,
                            border: task.sosFlag ? '2px solid #f44336' : 'none',
                            boxSizing: 'border-box',
                            '&:hover': {
                              opacity: 0.8,
                              transform: 'translateY(-1px)',
                              boxShadow: '0 2px 4px rgba(0,0,0,0.2)',
                            },
                          }}
                        >
                          <Typography
                            variant="caption"
                            sx={{
                              color: 'white',
                              fontSize: '0.65rem',
                              fontWeight: 500,
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                              whiteSpace: 'nowrap',
                            }}
                          >
                            {task.title}
                          </Typography>
                        </Box>
                      </Tooltip>
                    </Box>
                  </Box>
                );
              })
            )}
          </Box>
        </CardContent>
      </Card>
    </Box>
  );
};