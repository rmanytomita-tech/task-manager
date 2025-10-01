const express = require('express');
const { PrismaClient } = require('@prisma/client');
const { authenticate } = require('../middleware/auth');

const router = express.Router();
const prisma = new PrismaClient();

// SOS通知一覧取得
router.get('/', authenticate, async (req, res) => {
  try {
    const { resolved } = req.query;

    const where = {};
    if (resolved !== undefined) {
      where.isResolved = resolved === 'true';
    }

    const sosNotifications = await prisma.sOSNotification.findMany({
      where,
      include: {
        task: {
          select: {
            id: true,
            title: true,
            startDate: true,
            endDate: true,
            priority: true,
            urgency: true,
            assignedUser: {
              select: { id: true, name: true, email: true }
            },
            category: {
              select: { id: true, name: true }
            }
          }
        },
        user: {
          select: { id: true, name: true, email: true }
        }
      },
      orderBy: [
        { isResolved: 'asc' },
        { createdAt: 'desc' }
      ],
    });

    res.json({
      success: true,
      data: sosNotifications,
    });
  } catch (error) {
    console.error('SOS通知取得エラー:', error);
    res.status(500).json({
      success: false,
      message: 'SOS通知の取得に失敗しました',
      error: error.message,
    });
  }
});

// SOS通知解決
router.patch('/:id/resolve', authenticate, async (req, res) => {
  try {
    const { id } = req.params;
    const { resolverComment } = req.body;

    const sosNotification = await prisma.sOSNotification.update({
      where: { id },
      data: {
        isResolved: true,
        resolvedAt: new Date(),
        // resolverComment, // 必要に応じてスキーマに追加
      },
      include: {
        task: {
          select: {
            id: true,
            title: true,
            assignedUser: {
              select: { id: true, name: true }
            }
          }
        },
        user: {
          select: { id: true, name: true }
        }
      }
    });

    // タスクのSOSフラグも解除
    await prisma.task.update({
      where: { id: sosNotification.taskId },
      data: {
        sosFlag: false,
        sosComment: null,
      }
    });

    res.json({
      success: true,
      data: sosNotification,
      message: 'SOS通知が解決されました',
    });
  } catch (error) {
    if (error.code === 'P2025') {
      return res.status(404).json({
        success: false,
        message: 'SOS通知が見つかりません',
      });
    }

    console.error('SOS解決エラー:', error);
    res.status(500).json({
      success: false,
      message: 'SOS通知の解決に失敗しました',
      error: error.message,
    });
  }
});

// SOS統計取得
router.get('/stats', authenticate, async (req, res) => {
  try {
    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

    // 全体のSOS統計
    const totalSOS = await prisma.sOSNotification.count();
    const activeSOS = await prisma.sOSNotification.count({
      where: { isResolved: false }
    });
    const monthlySOS = await prisma.sOSNotification.count({
      where: {
        createdAt: { gte: monthStart }
      }
    });

    // ユーザー別SOS統計
    const userStats = await prisma.sOSNotification.groupBy({
      by: ['userId'],
      _count: {
        id: true
      },
      where: {
        createdAt: { gte: monthStart }
      }
    });

    const userStatsWithNames = await Promise.all(
      userStats.map(async (stat) => {
        const user = await prisma.user.findUnique({
          where: { id: stat.userId },
          select: { name: true }
        });
        return {
          userId: stat.userId,
          userName: user?.name || '不明',
          sosCount: stat._count.id
        };
      })
    );

    // カテゴリ別SOS統計
    const categoryStats = await prisma.sOSNotification.findMany({
      where: {
        createdAt: { gte: monthStart }
      },
      include: {
        task: {
          select: {
            category: {
              select: { id: true, name: true }
            }
          }
        }
      }
    });

    const categoryStatsMap = {};
    categoryStats.forEach(sos => {
      const categoryName = sos.task.category.name;
      categoryStatsMap[categoryName] = (categoryStatsMap[categoryName] || 0) + 1;
    });

    const categoryStatsArray = Object.entries(categoryStatsMap).map(([name, count]) => ({
      categoryName: name,
      sosCount: count
    }));

    res.json({
      success: true,
      data: {
        overview: {
          totalSOS,
          activeSOS,
          monthlySOS,
        },
        userStats: userStatsWithNames,
        categoryStats: categoryStatsArray,
      }
    });
  } catch (error) {
    console.error('SOS統計取得エラー:', error);
    res.status(500).json({
      success: false,
      message: 'SOS統計の取得に失敗しました',
      error: error.message,
    });
  }
});

module.exports = router;