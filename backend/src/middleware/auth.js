const jwt = require('jsonwebtoken');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

// JWT認証ミドルウェア
const authenticate = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');

    if (!token) {
      return res.status(401).json({
        success: false,
        message: '認証が必要です',
      });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        department: true,
      }
    });

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'ユーザーが見つかりません',
      });
    }

    req.user = user;
    next();
  } catch (error) {
    console.error('認証エラー:', error);
    res.status(401).json({
      success: false,
      message: '無効なトークンです',
    });
  }
};

// 管理者権限チェックミドルウェア
const requireAdmin = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      message: '認証が必要です',
    });
  }

  if (req.user.role !== 'ADMIN') {
    return res.status(403).json({
      success: false,
      message: '管理者権限が必要です',
    });
  }

  next();
};

module.exports = { authenticate, requireAdmin };
