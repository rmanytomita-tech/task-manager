const express = require('express');
const { PrismaClient } = require('@prisma/client');
const { z } = require('zod');
const { authenticate } = require('../middleware/auth');

const router = express.Router();
const prisma = new PrismaClient();

// バリデーションスキーマ
const createCategorySchema = z.object({
  name: z.string().min(1, 'カテゴリ名は必須です'),
  creatorId: z.string(),
});

// カテゴリ一覧取得
router.get('/', authenticate, async (req, res) => {
  try {
    const categories = await prisma.category.findMany({
      include: {
        creator: {
          select: { id: true, name: true }
        },
        _count: {
          select: {
            tasks: {
              where: { isDeleted: false }
            }
          }
        }
      },
      orderBy: { createdAt: 'asc' },
    });

    res.json({
      success: true,
      data: categories,
    });
  } catch (error) {
    console.error('カテゴリ取得エラー:', error);
    res.status(500).json({
      success: false,
      message: 'カテゴリの取得に失敗しました',
      error: error.message,
    });
  }
});

// カテゴリ作成
router.post('/', authenticate, async (req, res) => {
  try {
    const validatedData = createCategorySchema.parse(req.body);

    // 重複チェック
    const existingCategory = await prisma.category.findUnique({
      where: { name: validatedData.name }
    });

    if (existingCategory) {
      return res.status(400).json({
        success: false,
        message: 'このカテゴリ名は既に使用されています',
      });
    }

    const category = await prisma.category.create({
      data: validatedData,
      include: {
        creator: {
          select: { id: true, name: true }
        }
      }
    });

    res.status(201).json({
      success: true,
      data: category,
      message: 'カテゴリが作成されました',
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        message: 'バリデーションエラー',
        errors: error.errors,
      });
    }

    console.error('カテゴリ作成エラー:', error);
    res.status(500).json({
      success: false,
      message: 'カテゴリの作成に失敗しました',
      error: error.message,
    });
  }
});

// カテゴリ削除
router.delete('/:id', authenticate, async (req, res) => {
  try {
    const { id } = req.params;

    // 使用中のカテゴリかチェック
    const taskCount = await prisma.task.count({
      where: {
        categoryId: id,
        isDeleted: false,
      }
    });

    if (taskCount > 0) {
      return res.status(400).json({
        success: false,
        message: 'このカテゴリは使用中のため削除できません',
      });
    }

    await prisma.category.delete({
      where: { id }
    });

    res.json({
      success: true,
      message: 'カテゴリが削除されました',
    });
  } catch (error) {
    if (error.code === 'P2025') {
      return res.status(404).json({
        success: false,
        message: 'カテゴリが見つかりません',
      });
    }

    console.error('カテゴリ削除エラー:', error);
    res.status(500).json({
      success: false,
      message: 'カテゴリの削除に失敗しました',
      error: error.message,
    });
  }
});

module.exports = router;