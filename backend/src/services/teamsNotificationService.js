// Microsoft Teams 通知サービス (Power Automate Webhook)
const axios = require('axios');

class TeamsNotificationService {
  constructor() {
    // Power Automate WebhookのURL（環境変数で管理）
    this.webhookUrl = process.env.TEAMS_WEBHOOK_URL || '';
  }

  /**
   * Teams に通知を送信する基本メソッド
   */
  async sendNotification(title, message, color = '0078d4', facts = []) {
    if (!this.webhookUrl) {
      console.warn('Teams Webhook URL が設定されていません');
      return;
    }

    // 記事に基づく正しいペイロード形式
    const payload = {
      type: "message",
      attachments: [
        {
          contentType: "application/vnd.microsoft.card.adaptive",
          content: {
            "$schema": "http://adaptivecards.io/schemas/adaptive-card.json",
            type: "AdaptiveCard",
            version: "1.2",
            body: [
              {
                type: "TextBlock",
                text: title,
                weight: "Bolder",
                size: "Medium",
                color: color === 'ff0000' ? 'Attention' : color === '00ff00' ? 'Good' : 'Default'
              },
              {
                type: "TextBlock",
                text: message,
                wrap: true
              },
              ...(facts.length > 0 ? [{
                type: "FactSet",
                facts: facts.map(fact => ({
                  title: fact.name,
                  value: fact.value
                }))
              }] : [])
            ]
          }
        }
      ]
    };

    try {
      console.log('🔍 送信ペイロード:', JSON.stringify(payload, null, 2));
      await axios.post(this.webhookUrl, payload, {
        headers: {
          'Content-Type': 'application/json'
        }
      });
      console.log(`✅ Teams通知送信成功: ${title}`);
    } catch (error) {
      console.error('❌ Teams通知送信失敗:', error.message);
      if (error.response) {
        console.error('❌ レスポンス:', error.response.status, error.response.data);
      }
    }
  }

  /**
   * 新しいタスク作成通知
   */
  async notifyTaskCreated(task, assignedUser, category) {
    const priorityEmoji = {
      'HIGH': '🔴',
      'MEDIUM': '🟡',
      'LOW': '🟢'
    };

    const facts = [
      { name: "タスク名", value: task.title },
      { name: "担当者", value: assignedUser ? assignedUser.name : '未設定' },
      { name: "カテゴリ", value: category ? category.name : 'その他' },
      { name: "期限", value: new Date(task.endDate).toLocaleDateString('ja-JP') },
      { name: "優先度", value: `${task.priority} ${priorityEmoji[task.priority] || '⚪'}` },
      { name: "緊急度", value: `${task.urgency}/5` }
    ];

    if (task.clientName) {
      facts.push({ name: "クライアント", value: task.clientName });
    }
    if (task.projectName) {
      facts.push({ name: "プロジェクト", value: task.projectName });
    }

    await this.sendNotification(
      '📋 新しいタスクが作成されました',
      `${assignedUser ? assignedUser.name : '担当者未設定'}さんに新しいタスクが割り当てられました`,
      '0078d4', // Microsoft Blue
      facts
    );
  }

  /**
   * SOS発信通知
   */
  async notifySOSAlert(task, user) {
    const urgencyColor = task.urgency >= 4 ? 'ff0000' : task.urgency >= 3 ? 'ff6600' : 'ffcc00';

    const facts = [
      { name: "🆘 タスク名", value: task.title },
      { name: "📞 発信者", value: user ? user.name : '不明' },
      { name: "⏰ 期限", value: new Date(task.endDate).toLocaleDateString('ja-JP') },
      { name: "🔥 緊急度", value: `${task.urgency}/5` },
      { name: "📝 状況", value: task.sosComment || '詳細なし' }
    ];

    if (task.clientName) {
      facts.push({ name: "🏢 クライアント", value: task.clientName });
    }

    await this.sendNotification(
      '🚨 SOS発信：緊急支援が必要です！',
      `${user ? user.name : '担当者'}さんが緊急支援を要請しています`,
      urgencyColor,
      facts
    );
  }

  /**
   * タスク完了通知
   */
  async notifyTaskCompleted(task, user, category) {
    const facts = [
      { name: "✅ 完了タスク", value: task.title },
      { name: "👤 完了者", value: user ? user.name : '不明' },
      { name: "📂 カテゴリ", value: category ? category.name : 'その他' },
      { name: "📅 完了日", value: new Date().toLocaleDateString('ja-JP') }
    ];

    if (task.clientName) {
      facts.push({ name: "🏢 クライアント", value: task.clientName });
    }

    await this.sendNotification(
      '🎉 タスクが完了しました',
      `お疲れ様でした！タスクが正常に完了されました`,
      '00ff00', // Green
      facts
    );
  }

  /**
   * 期限間近通知
   */
  async notifyDeadlineApproaching(task, user, daysLeft) {
    const urgencyColor = daysLeft <= 1 ? 'ff0000' : daysLeft <= 3 ? 'ff6600' : 'ffcc00';

    const facts = [
      { name: "⚠️ タスク名", value: task.title },
      { name: "👤 担当者", value: user ? user.name : '不明' },
      { name: "📅 期限", value: new Date(task.endDate).toLocaleDateString('ja-JP') },
      { name: "⏱️ 残り日数", value: `${daysLeft}日` },
      { name: "📊 進捗", value: task.status === 'IN_PROGRESS' ? '進行中' : '未着手' }
    ];

    await this.sendNotification(
      '⏰ タスクの期限が近づいています',
      `${daysLeft}日後に期限を迎えるタスクがあります`,
      urgencyColor,
      facts
    );
  }

  /**
   * 週次サマリー通知
   */
  async notifyWeeklySummary(summary) {
    const facts = [
      { name: "📊 今週完了", value: `${summary.completed}件` },
      { name: "🚧 進行中", value: `${summary.inProgress}件` },
      { name: "📋 未着手", value: `${summary.notStarted}件` },
      { name: "🆘 SOS発信中", value: `${summary.sosAlerts}件` },
      { name: "⚠️ 期限超過", value: `${summary.overdue}件` }
    ];

    await this.sendNotification(
      '📈 週次進捗サマリー',
      `今週のプロジェクト進捗をお知らせします`,
      '0078d4',
      facts
    );
  }

  /**
   * テスト通知
   */
  async sendTestNotification() {
    if (!this.webhookUrl) {
      console.warn('Teams Webhook URL が設定されていません');
      return;
    }

    // Power Automateが期待するattachments配列を提供
    const payload = {
      attachments: [
        {
          contentType: "application/vnd.microsoft.card.adaptive",
          content: {
            type: "AdaptiveCard",
            version: "1.3",
            body: [
              {
                type: "TextBlock",
                text: "🧪 Teams連携テスト",
                weight: "Bolder",
                size: "Medium",
                color: "Good"
              },
              {
                type: "TextBlock",
                text: "スケジュール管理システムからのテスト通知です",
                wrap: true
              }
            ]
          }
        }
      ]
    };

    try {
      await axios.post(this.webhookUrl, payload, {
        headers: {
          'Content-Type': 'application/json'
        }
      });
      console.log(`✅ Teams通知送信成功: 🧪 Teams連携テスト`);
    } catch (error) {
      console.error('❌ Teams通知送信失敗:', error.message);
    }
  }
}

module.exports = new TeamsNotificationService();