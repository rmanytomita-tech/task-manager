const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database...');

  // デフォルトユーザー作成
  const adminUser = await prisma.user.upsert({
    where: { email: 'admin@example.com' },
    update: {},
    create: {
      id: 'demo_admin',
      email: 'admin@example.com',
      name: '管理者ユーザー',
      role: 'ADMIN',
      department: 'システム部',
    },
  });

  const normalUser = await prisma.user.upsert({
    where: { email: 'user@example.com' },
    update: {},
    create: {
      id: 'demo_user',
      email: 'user@example.com',
      name: '一般ユーザー',
      role: 'USER',
      department: 'システム部',
    },
  });

  console.log('✓ Users created');

  // デフォルトカテゴリ作成
  const categories = [
    { id: '1', name: '開発', creatorId: adminUser.id },
    { id: '2', name: '営業', creatorId: adminUser.id },
    { id: '3', name: '事務', creatorId: adminUser.id },
    { id: '4', name: '企画', creatorId: adminUser.id },
  ];

  for (const categoryData of categories) {
    await prisma.category.upsert({
      where: { id: categoryData.id },
      update: {},
      create: categoryData,
    });
  }

  console.log('✓ Categories created');

  // サンプルタスク作成
  const tasks = [
    {
      id: 'task1',
      title: 'Webサイトのリニューアル作業',
      startDate: new Date(),
      endDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 1週間後
      assignedUserId: adminUser.id,
      categoryId: '1',
      priority: 'HIGH',
      urgency: 4,
      status: 'IN_PROGRESS',
      sosFlag: false,
      clientName: 'ABC株式会社',
      projectName: 'コーポレートサイト',
      memo: 'レスポンシブ対応が必要',
    },
    {
      id: 'task2',
      title: '月次売上レポート作成',
      startDate: new Date(),
      endDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000), // 3日後
      assignedUserId: normalUser.id,
      categoryId: '2',
      priority: 'MEDIUM',
      urgency: 3,
      status: 'NOT_STARTED',
      sosFlag: true,
      sosComment: 'データ取得方法がわからず困っています',
      clientName: 'DEF商事',
      projectName: '営業支援',
      memo: '前月比較が必要',
    },
    {
      id: 'task3',
      title: 'システム障害対応',
      startDate: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000), // 昨日
      endDate: new Date(), // 今日
      assignedUserId: adminUser.id,
      categoryId: '1',
      priority: 'HIGH',
      urgency: 5,
      status: 'COMPLETED',
      sosFlag: false,
      clientName: 'GHI技研',
      projectName: 'システム保守',
      memo: '緊急対応完了',
    },
    {
      id: 'task4',
      title: '新機能の仕様書作成',
      startDate: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000), // 明日
      endDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000), // 5日後
      assignedUserId: normalUser.id,
      categoryId: '4',
      priority: 'MEDIUM',
      urgency: 2,
      status: 'NOT_STARTED',
      sosFlag: false,
      clientName: 'JKL企業',
      projectName: '新システム開発',
      memo: '要件定義書を参考に作成',
    },
  ];

  for (const taskData of tasks) {
    await prisma.task.upsert({
      where: { id: taskData.id },
      update: {},
      create: taskData,
    });
  }

  console.log('✓ Tasks created');

  // SOSが発信されているタスクのSOS通知作成
  const sosTask = await prisma.task.findFirst({
    where: { sosFlag: true }
  });

  if (sosTask) {
    await prisma.sOSNotification.upsert({
      where: { id: `sos_${sosTask.id}_${Date.now()}` },
      update: {},
      create: {
        id: `sos_${sosTask.id}_${Date.now()}`,
        taskId: sosTask.id,
        userId: sosTask.assignedUserId,
        message: sosTask.sosComment,
      },
    });

    console.log('✓ SOS notification created');
  }

  console.log('🎉 Seeding completed!');
}

main()
  .catch((e) => {
    console.error('❌ Seeding failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });