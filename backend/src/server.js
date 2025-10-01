const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3001;

// ミドルウェア設定
app.use(helmet());

// CORS設定
const allowedOrigins = [
  'http://localhost:3000',
  'http://localhost:3001',
];

// 本番環境のフロントエンドURLを追加
if (process.env.FRONTEND_URL) {
  allowedOrigins.push(process.env.FRONTEND_URL);
}

app.use(cors({
  origin: allowedOrigins,
  credentials: true,
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ルーター設定
const healthRoutes = require('./routes/health');
const authRoutes = require('./routes/auth');
const taskRoutes = require('./routes/tasks');
const categoryRoutes = require('./routes/categories');
const userRoutes = require('./routes/users');
const sosRoutes = require('./routes/sos');

app.use('/api/health', healthRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/tasks', taskRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/users', userRoutes);
app.use('/api/sos', sosRoutes);


// エラーハンドリングミドルウェア
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    success: false,
    message: 'サーバーエラーが発生しました',
    error: process.env.NODE_ENV === 'development' ? err.message : undefined,
  });
});

// 404ハンドラー
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    message: 'エンドポイントが見つかりません',
  });
});

// サーバー起動
app.listen(PORT, () => {
  console.log(`🚀 Schedule API Server running on port ${PORT}`);
  console.log(`📊 Environment: ${process.env.NODE_ENV}`);
  console.log(`🌐 CORS enabled for: ${allowedOrigins.join(', ')}`);
});