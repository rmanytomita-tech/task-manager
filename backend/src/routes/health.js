const express = require('express');

const router = express.Router();

// 基本ヘルスチェック
router.get('/', (req, res) => {
  res.json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    env: process.env.NODE_ENV,
    message: 'Schedule API Server is running!',
  });
});

// データベース接続チェック（後で実装）
router.get('/db', async (req, res) => {
  res.json({
    status: 'OK',
    message: 'Database connection check - to be implemented',
  });
});

module.exports = router;