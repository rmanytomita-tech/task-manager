const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');

const prisma = new PrismaClient();

async function main() {
  // 既存データクリア
  console.log('🗑️ 既存データをクリア中...');
  await prisma.sOSNotification.deleteMany();
  await prisma.task.deleteMany();
  await prisma.user.deleteMany();
  await prisma.category.deleteMany();

  // セキュアなパスワード生成
  const adminPassword = await bcrypt.hash('Admin@2025!', 10);
  const demoPassword = await bcrypt.hash('Demo@2025!', 10);

  // 管理者アカウント作成
  console.log('👤 管理者アカウントを作成中...');
  const adminUser = await prisma.user.create({
    data: {
      id: 'admin_user',
      email: 'admin@schedule.local',
      name: '管理者',
      password: adminPassword,
      role: 'ADMIN',
      department: 'システム管理部',
    },
  });

  // デモアカウント作成
  console.log('👤 デモアカウントを作成中...');
  const demoUser = await prisma.user.create({
    data: {
      id: 'demo_user',
      email: 'demo@schedule.local',
      name: 'デモユーザー',
      password: demoPassword,
      role: 'USER',
      department: '営業部',
    },
  });

  // カテゴリ作成
  console.log('📂 カテゴリを作成中...');
  const categories = await Promise.all([
    prisma.category.create({
      data: {
        id: '1',
        name: '開発',
        creatorId: adminUser.id,
      },
    }),
    prisma.category.create({
      data: {
        id: '2',
        name: '営業',
        creatorId: adminUser.id,
      },
    }),
    prisma.category.create({
      data: {
        id: '3',
        name: '事務',
        creatorId: adminUser.id,
      },
    }),
    prisma.category.create({
      data: {
        id: '4',
        name: '企画',
        creatorId: adminUser.id,
      },
    }),
  ]);

  // サンプルタスク作成
  console.log('📋 サンプルタスクを作成中...');
  const tasks = await Promise.all([
    // 管理者のタスク
    prisma.task.create({
      data: {
        title: 'システム運用監視',
        startDate: new Date('2025-09-26'),
        endDate: new Date('2025-09-30'),
        assignedUserId: adminUser.id,
        categoryId: categories[0].id,
        priority: 'HIGH',
        urgency: 4,
        status: 'IN_PROGRESS',
        clientName: '社内システム',
        projectName: 'インフラ監視',
        memo: 'サーバー監視とセキュリティチェックを実施',
      },
    }),
    prisma.task.create({
      data: {
        title: 'ユーザーアカウント管理',
        startDate: new Date('2025-09-27'),
        endDate: new Date('2025-10-01'),
        assignedUserId: adminUser.id,
        categoryId: categories[2].id,
        priority: 'MEDIUM',
        urgency: 3,
        status: 'NOT_STARTED',
        memo: '新規ユーザーのアカウント作成とアクセス権設定',
      },
    }),
    // デモユーザーのタスク
    prisma.task.create({
      data: {
        title: '新規顧客開拓',
        startDate: new Date('2025-09-26'),
        endDate: new Date('2025-10-05'),
        assignedUserId: demoUser.id,
        categoryId: categories[1].id,
        priority: 'HIGH',
        urgency: 5,
        status: 'IN_PROGRESS',
        clientName: 'ABC商事',
        projectName: '年末キャンペーン',
        memo: 'Q4の売上目標達成に向けた新規開拓',
      },
    }),
    prisma.task.create({
      data: {
        title: '営業資料作成',
        startDate: new Date('2025-09-28'),
        endDate: new Date('2025-09-29'),
        assignedUserId: demoUser.id,
        categoryId: categories[1].id,
        priority: 'MEDIUM',
        urgency: 3,
        status: 'NOT_STARTED',
        clientName: 'XYZ企業',
        projectName: '提案書作成',
        memo: 'プレゼンテーション用の資料準備',
      },
    }),
    // SOSフラグ付きタスク（デモ用）
    prisma.task.create({
      data: {
        title: '緊急バグ修正',
        startDate: new Date('2025-09-26'),
        endDate: new Date('2025-09-27'),
        assignedUserId: demoUser.id,
        categoryId: categories[0].id,
        priority: 'HIGH',
        urgency: 5,
        status: 'IN_PROGRESS',
        sosFlag: true,
        sosComment: '本番環境でクリティカルなバグが発生。緊急対応が必要です。',
        clientName: '重要顧客',
        projectName: 'システム障害対応',
        memo: '影響範囲が大きく、即座の対応が求められます',
      },
    }),
  ]);

  // SOS通知作成（デモ用）
  await prisma.sOSNotification.create({
    data: {
      taskId: tasks[4].id,
      userId: demoUser.id,
      message: '本番環境でクリティカルなバグが発生。緊急対応が必要です。',
    },
  });

  console.log('✅ シードデータ作成完了!');
  console.log('');
  console.log('🔐 アカウント情報:');
  console.log('==================');
  console.log('📊 管理者アカウント:');
  console.log('   Email: admin@schedule.local');
  console.log('   Password: Admin@2025!');
  console.log('   権限: 管理者');
  console.log('');
  console.log('👤 デモアカウント:');
  console.log('   Email: demo@schedule.local');
  console.log('   Password: Demo@2025!');
  console.log('   権限: 一般ユーザー');
  console.log('');
  console.log('📋 作成されたデータ:');
  console.log(`   - ユーザー: 2名`);
  console.log(`   - カテゴリ: 4個`);
  console.log(`   - タスク: 5個`);
  console.log(`   - SOS通知: 1件`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });