const express = require('express');
const { PrismaClient } = require('@prisma/client');
const { z } = require('zod');
const teamsNotificationService = require('../services/teamsNotificationService');
const { authenticate } = require('../middleware/auth');

const router = express.Router();
const prisma = new PrismaClient();

// バリデーションスキーマ
const createTaskSchema = z.object({
  title: z.string().min(1, 'タスク名は必須です'),
  startDate: z.string().datetime(),
  endDate: z.string().datetime(),
  assignedUserId: z.string(),
  relatedUserIds: z.array(z.string()).optional(), // 複数担当者
  categoryId: z.string(),
  priority: z.enum(['HIGH', 'MEDIUM', 'LOW']).default('MEDIUM'),
  urgency: z.number().int().min(1).max(5).default(3),
  clientName: z.string().optional(),
  projectName: z.string().optional(),
  color: z.string().optional(), // タスクの色
  memo: z.string().optional(),
  sosFlag: z.boolean().default(false),
  sosComment: z.string().optional(),
});

const updateTaskSchema = createTaskSchema.partial();

// タスク一覧取得
router.get('/', authenticate, async (req, res) => {
  try {
    const {
      assignedUserId,
      categoryId,
      status,
      priority,
      sosFlag,
      startDate,
      endDate
    } = req.query;

    const where = {
      isDeleted: false,
      ...(assignedUserId && { assignedUserId }),
      ...(categoryId && { categoryId }),
      ...(status && { status }),
      ...(priority && { priority }),
      ...(sosFlag !== undefined && { sosFlag: sosFlag === 'true' }),
      ...(startDate && endDate && {
        startDate: { gte: new Date(startDate) },
        endDate: { lte: new Date(endDate) },
      }),
    };

    const tasks = await prisma.task.findMany({
      where,
      include: {
        assignedUser: {
          select: { id: true, name: true, email: true }
        },
        category: {
          select: { id: true, name: true }
        },
        relatedUsers: {
          select: { id: true, name: true, email: true }
        },
      },
      orderBy: [
        { sosFlag: 'desc' },
        { urgency: 'desc' },
        { endDate: 'asc' },
      ],
    });

    res.json({
      success: true,
      data: tasks,
    });
  } catch (error) {
    console.error('タスク取得エラー:', error);
    res.status(500).json({
      success: false,
      message: 'タスクの取得に失敗しました',
      error: error.message,
    });
  }
});

// タスク詳細取得
router.get('/:id', authenticate, async (req, res) => {
  try {
    const { id } = req.params;

    const task = await prisma.task.findUnique({
      where: { id },
      include: {
        assignedUser: {
          select: { id: true, name: true, email: true }
        },
        category: {
          select: { id: true, name: true }
        },
        relatedUsers: {
          select: { id: true, name: true, email: true }
        },
        sosNotifications: {
          where: { isResolved: false },
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    if (!task || task.isDeleted) {
      return res.status(404).json({
        success: false,
        message: 'タスクが見つかりません',
      });
    }

    res.json({
      success: true,
      data: task,
    });
  } catch (error) {
    console.error('タスク詳細取得エラー:', error);
    res.status(500).json({
      success: false,
      message: 'タスクの取得に失敗しました',
      error: error.message,
    });
  }
});

// タスク作成
router.post('/', authenticate, async (req, res) => {
  try {
    const validatedData = createTaskSchema.parse(req.body);
    const { relatedUserIds, ...taskData } = validatedData;

    const task = await prisma.task.create({
      data: {
        ...taskData,
        startDate: new Date(validatedData.startDate),
        endDate: new Date(validatedData.endDate),
        ...(relatedUserIds && relatedUserIds.length > 0 && {
          relatedUsers: {
            connect: relatedUserIds.map(id => ({ id }))
          }
        }),
      },
      include: {
        assignedUser: {
          select: { id: true, name: true, email: true }
        },
        category: {
          select: { id: true, name: true }
        },
        relatedUsers: {
          select: { id: true, name: true, email: true }
        },
      },
    });

    // Teams通知送信
    try {
      await teamsNotificationService.notifyTaskCreated(task, task.assignedUser, task.category);
    } catch (notificationError) {
      console.error('Teams通知送信エラー:', notificationError);
    }

    res.status(201).json({
      success: true,
      data: task,
      message: 'タスクが作成されました',
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        message: 'バリデーションエラー',
        errors: error.errors,
      });
    }

    console.error('タスク作成エラー:', error);
    res.status(500).json({
      success: false,
      message: 'タスクの作成に失敗しました',
      error: error.message,
    });
  }
});

// タスク更新
router.put('/:id', authenticate, async (req, res) => {
  try {
    const { id } = req.params;
    const validatedData = updateTaskSchema.parse(req.body);
    const { relatedUserIds, ...taskData } = validatedData;

    const updateData = {
      ...taskData,
      ...(validatedData.startDate && { startDate: new Date(validatedData.startDate) }),
      ...(validatedData.endDate && { endDate: new Date(validatedData.endDate) }),
      ...(relatedUserIds !== undefined && {
        relatedUsers: {
          set: relatedUserIds.map(id => ({ id }))
        }
      }),
    };

    const task = await prisma.task.update({
      where: { id },
      data: updateData,
      include: {
        assignedUser: {
          select: { id: true, name: true, email: true }
        },
        category: {
          select: { id: true, name: true }
        },
        relatedUsers: {
          select: { id: true, name: true, email: true }
        },
      },
    });

    // タスク完了時のTeams通知
    if (updateData.status === 'COMPLETED') {
      try {
        await teamsNotificationService.notifyTaskCompleted(task, task.assignedUser, task.category);
      } catch (notificationError) {
        console.error('Teams通知送信エラー:', notificationError);
      }
    }

    res.json({
      success: true,
      data: task,
      message: 'タスクが更新されました',
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
        message: 'タスクが見つかりません',
      });
    }

    console.error('タスク更新エラー:', error);
    res.status(500).json({
      success: false,
      message: 'タスクの更新に失敗しました',
      error: error.message,
    });
  }
});

// タスク削除（論理削除）
router.delete('/:id', authenticate, async (req, res) => {
  try {
    const { id } = req.params;

    const task = await prisma.task.update({
      where: { id },
      data: {
        isDeleted: true,
        updatedAt: new Date(),
      },
    });

    res.json({
      success: true,
      message: 'タスクが削除されました',
    });
  } catch (error) {
    if (error.code === 'P2025') {
      return res.status(404).json({
        success: false,
        message: 'タスクが見つかりません',
      });
    }

    console.error('タスク削除エラー:', error);
    res.status(500).json({
      success: false,
      message: 'タスクの削除に失敗しました',
      error: error.message,
    });
  }
});

// SOS発信/解除
router.patch('/:id/sos', authenticate, async (req, res) => {
  try {
    const { id } = req.params;
    const { sosFlag, sosComment } = req.body;

    const task = await prisma.task.update({
      where: { id },
      data: {
        sosFlag,
        sosComment: sosFlag ? sosComment : null,
        updatedAt: new Date(),
      },
    });

    // SOS通知作成/解除
    if (sosFlag) {
      await prisma.sOSNotification.create({
        data: {
          taskId: id,
          userId: task.assignedUserId,
          message: sosComment,
        },
      });

      // Teams SOS通知送信
      try {
        const user = await prisma.user.findUnique({
          where: { id: task.assignedUserId },
          select: { id: true, name: true, email: true }
        });
        await teamsNotificationService.notifySOSAlert(task, user);
      } catch (notificationError) {
        console.error('Teams SOS通知送信エラー:', notificationError);
      }
    } else {
      await prisma.sOSNotification.updateMany({
        where: {
          taskId: id,
          isResolved: false,
        },
        data: {
          isResolved: true,
          resolvedAt: new Date(),
        },
      });
    }

    res.json({
      success: true,
      data: task,
      message: sosFlag ? 'SOSが発信されました' : 'SOSが解除されました',
    });
  } catch (error) {
    console.error('SOS更新エラー:', error);
    res.status(500).json({
      success: false,
      message: 'SOSの更新に失敗しました',
      error: error.message,
    });
  }
});

module.exports = router;