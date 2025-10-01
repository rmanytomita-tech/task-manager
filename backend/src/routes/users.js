const express = require('express');
const bcrypt = require('bcrypt');
const { PrismaClient } = require('@prisma/client');
const { z } = require('zod');
const { authenticate, requireAdmin } = require('../middleware/auth');

const router = express.Router();
const prisma = new PrismaClient();

// バリデーションスキーマ
const createUserSchema = z.object({
  name: z.string().min(1, '名前は必須です'),
  email: z.string().email('有効なメールアドレスを入力してください'),
  password: z.string().min(6, 'パスワードは6文字以上で入力してください'),
  role: z.enum(['ADMIN', 'USER']).default('USER'),
  department: z.string().optional(),
});

const updateUserSchema = createUserSchema.partial();

// シンプルなユーザー一覧取得（認証済みユーザー全員がアクセス可能）
router.get('/list', authenticate, async (req, res) => {
  try {
    const users = await prisma.user.findMany({
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        department: true,
      },
      orderBy: { name: 'asc' },
    });

    res.json({
      success: true,
      data: users,
    });
  } catch (error) {
    console.error('ユーザー一覧取得エラー:', error);
    res.status(500).json({
      success: false,
      message: 'ユーザー一覧の取得に失敗しました',
      error: error.message,
    });
  }
});

// ユーザー一覧取得（管理者のみ - 詳細情報付き）
router.get('/', authenticate, requireAdmin, async (req, res) => {
  try {
    const users = await prisma.user.findMany({
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        department: true,
        createdAt: true,
        lastLoginAt: true,
        _count: {
          select: {
            assignedTasks: {
              where: { isDeleted: false }
            }
          }
        }
      },
      orderBy: { name: 'asc' },
    });

    res.json({
      success: true,
      data: users,
    });
  } catch (error) {
    console.error('ユーザー取得エラー:', error);
    res.status(500).json({
      success: false,
      message: 'ユーザーの取得に失敗しました',
      error: error.message,
    });
  }
});

// ユーザー詳細取得（管理者のみ）
router.get('/:id', authenticate, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;

    const user = await prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        department: true,
        createdAt: true,
        lastLoginAt: true,
      }
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'ユーザーが見つかりません',
      });
    }

    res.json({
      success: true,
      data: user,
    });
  } catch (error) {
    console.error('ユーザー詳細取得エラー:', error);
    res.status(500).json({
      success: false,
      message: 'ユーザーの取得に失敗しました',
      error: error.message,
    });
  }
});

// チーム負荷状況取得
router.get('/load/status', async (req, res) => {
  try {
    const now = new Date();
    const weekStart = new Date(now);
    weekStart.setDate(now.getDate() - now.getDay());
    weekStart.setHours(0, 0, 0, 0);

    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

    const users = await prisma.user.findMany({
      select: {
        id: true,
        name: true,
        assignedTasks: {
          where: {
            isDeleted: false,
            status: {
              in: ['NOT_STARTED', 'IN_PROGRESS']
            }
          },
          select: {
            id: true,
            startDate: true,
            endDate: true,
            urgency: true,
          }
        }
      }
    });

    const loadStatuses = users.map(user => {
      const weeklyTasks = user.assignedTasks.filter(task =>
        task.startDate <= new Date() && task.endDate >= weekStart
      );
      const monthlyTasks = user.assignedTasks.filter(task =>
        task.startDate <= new Date() && task.endDate >= monthStart
      );

      const weeklyTaskCount = weeklyTasks.length;
      const monthlyTaskCount = monthlyTasks.length;

      // 負荷レベル計算
      let loadLevel = 'light';
      if (weeklyTaskCount >= 10 || monthlyTaskCount >= 30) {
        loadLevel = 'heavy';
      } else if (weeklyTaskCount >= 5 || monthlyTaskCount >= 15) {
        loadLevel = 'normal';
      }

      return {
        userId: user.id,
        userName: user.name,
        weeklyTaskCount,
        monthlyTaskCount,
        loadLevel,
      };
    });

    res.json({
      success: true,
      data: loadStatuses,
    });
  } catch (error) {
    console.error('チーム負荷取得エラー:', error);
    res.status(500).json({
      success: false,
      message: 'チーム負荷の取得に失敗しました',
      error: error.message,
    });
  }
});

// ユーザー作成（管理者のみ）
router.post('/', authenticate, requireAdmin, async (req, res) => {
  try {
    const { email, password, name, department, role } = createUserSchema.parse(req.body);

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

    const user = await prisma.user.create({
      data: {
        email,
        name,
        department,
        role,
        password: hashedPassword,
      },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        department: true,
        createdAt: true,
        lastLoginAt: true,
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

// ユーザー更新（管理者のみ）
router.put('/:id', authenticate, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const validatedData = updateUserSchema.parse(req.body);

    // メールアドレスが変更される場合の重複チェック
    if (validatedData.email) {
      const existingUser = await prisma.user.findUnique({
        where: { email: validatedData.email }
      });

      if (existingUser && existingUser.id !== id) {
        return res.status(400).json({
          success: false,
          message: 'このメールアドレスは既に使用されています',
        });
      }
    }

    const user = await prisma.user.update({
      where: { id },
      data: validatedData,
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        department: true,
        createdAt: true,
        lastLoginAt: true,
      }
    });

    res.json({
      success: true,
      data: user,
      message: 'ユーザーが更新されました',
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        message: 'バリデーションエラー',
        errors: error.errors,
      });
    }

    if (error.code === 'P2025') {
      return res.status(404).json({
        success: false,
        message: 'ユーザーが見つかりません',
      });
    }

    console.error('ユーザー更新エラー:', error);
    res.status(500).json({
      success: false,
      message: 'ユーザーの更新に失敗しました',
      error: error.message,
    });
  }
});

// ユーザー削除（管理者のみ）
router.delete('/:id', authenticate, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;

    // 自分自身の削除を防ぐ
    if (id === req.user.id) {
      return res.status(400).json({
        success: false,
        message: '自分自身を削除することはできません',
      });
    }

    // 削除対象のユーザーが存在するかチェック
    const user = await prisma.user.findUnique({
      where: { id }
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'ユーザーが見つかりません',
      });
    }

    // 担当しているタスクの確認
    const assignedTasks = await prisma.task.count({
      where: {
        assignedUserId: id,
        isDeleted: false,
      }
    });

    if (assignedTasks > 0) {
      return res.status(400).json({
        success: false,
        message: `このユーザーは${assignedTasks}件のタスクを担当中のため削除できません。先にタスクの担当者を変更してください。`,
      });
    }

    await prisma.user.delete({
      where: { id }
    });

    res.json({
      success: true,
      message: 'ユーザーが削除されました',
    });
  } catch (error) {
    if (error.code === 'P2025') {
      return res.status(404).json({
        success: false,
        message: 'ユーザーが見つかりません',
      });
    }

    console.error('ユーザー削除エラー:', error);
    res.status(500).json({
      success: false,
      message: 'ユーザーの削除に失敗しました',
      error: error.message,
    });
  }
});

module.exports = router;