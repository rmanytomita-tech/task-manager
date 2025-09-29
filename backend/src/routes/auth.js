const express = require('express');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { PrismaClient } = require('@prisma/client');
const { z } = require('zod');

const router = express.Router();
const prisma = new PrismaClient();

// バリデーションスキーマ
const loginSchema = z.object({
  email: z.string().email('有効なメールアドレスを入力してください'),
  password: z.string().min(1, 'パスワードは必須です'),
});

const registerSchema = z.object({
  email: z.string().email('有効なメールアドレスを入力してください'),
  password: z.string().min(6, 'パスワードは6文字以上で入力してください'),
  name: z.string().min(1, '名前は必須です'),
  department: z.string().optional(),
});

// JWT生成
const generateToken = (user) => {
  return jwt.sign(
    {
      userId: user.id,
      email: user.email,
      role: user.role,
    },
    process.env.JWT_SECRET,
    { expiresIn: '24h' }
  );
};

// ログイン
router.post('/login', async (req, res) => {
  try {
    const { email, password } = loginSchema.parse(req.body);


    // データベースからユーザー検索
    const user = await prisma.user.findUnique({
      where: { email },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        department: true,
        createdAt: true,
        password: true,
      }
    });

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'メールアドレスまたはパスワードが正しくありません',
      });
    }

    // パスワード認証
    const isValidPassword = await bcrypt.compare(password, user.password);
    if (!isValidPassword) {
      return res.status(401).json({
        success: false,
        message: 'メールアドレスまたはパスワードが正しくありません',
      });
    }

    // 最終ログイン時刻を更新
    await prisma.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() },
    });

    // パスワードをレスポンスから除外
    const { password: _, ...userWithoutPassword } = user;

    const token = generateToken(userWithoutPassword);

    res.json({
      success: true,
      data: {
        user: userWithoutPassword,
        token,
      },
      message: 'ログインしました',
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        message: 'バリデーションエラー',
        errors: error.errors,
      });
    }

    console.error('ログインエラー:', error);
    res.status(500).json({
      success: false,
      message: 'ログインに失敗しました',
      error: error.message,
    });
  }
});

// ユーザー登録（管理者用）
router.post('/register', async (req, res) => {
  try {
    const { email, password, name, department } = registerSchema.parse(req.body);

    // メールアドレスの重複チェック
    const existingUser = await prisma.user.findUnique({
      where: { email }
    });

    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'このメールアドレスは既に使用されています',
      });
    }

    // パスワードハッシュ化
    const hashedPassword = await bcrypt.hash(password, 12);

    // ユーザー作成
    const user = await prisma.user.create({
      data: {
        email,
        name,
        department,
        password: hashedPassword,
      },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        department: true,
        createdAt: true,
      }
    });

    res.status(201).json({
      success: true,
      data: user,
      message: 'ユーザーが作成されました',
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        message: 'バリデーションエラー',
        errors: error.errors,
      });
    }

    console.error('ユーザー作成エラー:', error);
    res.status(500).json({
      success: false,
      message: 'ユーザーの作成に失敗しました',
      error: error.message,
    });
  }
});

// トークン検証
router.get('/verify', async (req, res) => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');

    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'トークンが提供されていません',
      });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);


    // データベースからユーザー情報取得
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        department: true,
        createdAt: true,
      }
    });

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'ユーザーが見つかりません',
      });
    }

    res.json({
      success: true,
      data: user,
    });
  } catch (error) {
    console.error('トークン検証エラー:', error);
    res.status(401).json({
      success: false,
      message: '無効なトークンです',
    });
  }
});

module.exports = router;