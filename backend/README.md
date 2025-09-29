# スケジュール管理システム - バックエンドAPI

Microsoft Teams連携機能付きのタスク管理システムのバックエンドAPIです。

## 🚀 VPSデプロイ手順

### 1. 初回セットアップ

```bash
# VPSにファイルをアップロード後
./deploy.sh setup
```

このコマンドで以下がインストールされます：
- Node.js 18.x
- PostgreSQL
- Docker & Docker Compose
- Nginx
- PM2

### 2. アプリケーションデプロイ

```bash
./deploy.sh deploy
```

### 3. 環境変数設定

デプロイ後、`.env`ファイルを編集してください：

```bash
sudo nano /opt/schedule/.env
```

必須設定項目：
```env
# データベース（本番用に変更）
DATABASE_URL="postgresql://your_user:your_password@localhost:5432/schedule_db"

# JWT秘密鍵（強力なものに変更）
JWT_SECRET="your-very-secure-secret-key-here"

# フロントエンドURL（本番ドメインに変更）
FRONTEND_URL="https://your-domain.com"

# Teams Webhook URL
TEAMS_WEBHOOK_URL="your-teams-webhook-url"
```

### 4. データベースセットアップ

```bash
cd /opt/schedule
sudo -u postgres psql

# PostgreSQL内で実行
CREATE DATABASE schedule_db;
CREATE USER schedule_user WITH PASSWORD 'secure_password_here';
GRANT ALL PRIVILEGES ON DATABASE schedule_db TO schedule_user;
\q

# マイグレーション実行
npx prisma migrate deploy
npx prisma db seed
```

## 🔧 運用コマンド

```bash
# アプリケーション状態確認
./deploy.sh status

# アプリケーション再デプロイ
./deploy.sh deploy

# ロールバック
./deploy.sh rollback

# PM2でのプロセス管理
pm2 status
pm2 logs schedule-backend
pm2 restart schedule-backend
```

## 🐳 Docker使用の場合

```bash
# Docker Compose起動
docker-compose up -d

# ログ確認
docker-compose logs -f backend

# コンテナ再起動
docker-compose restart backend
```

## 🌐 アクセスURL

- API: `http://your-vps-ip:3002`
- API経由（Nginx）: `http://your-vps-ip/api`
- ヘルスチェック: `http://your-vps-ip:3002/api/health`

## 📊 監視

- アプリケーションログ: `/opt/schedule/logs/`
- PM2ログ: `pm2 logs`
- Nginx ログ: `/var/log/nginx/`
- PostgreSQL ログ: `/var/log/postgresql/`

## 🔐 セキュリティ

### ファイアウォール設定
```bash
# UFW有効化
sudo ufw enable

# 必要なポートを開放
sudo ufw allow 22    # SSH
sudo ufw allow 80    # HTTP
sudo ufw allow 443   # HTTPS
sudo ufw allow 3002  # API（開発時のみ）
```

### SSL証明書（Let's Encrypt）
```bash
# Certbot インストール
sudo apt install certbot python3-certbot-nginx

# SSL証明書取得
sudo certbot --nginx -d your-domain.com
```

## 🚨 トラブルシューティング

### よくある問題

1. **ポート3002が使用中**
```bash
sudo lsof -i :3002
pm2 delete schedule-backend
```

2. **データベース接続エラー**
```bash
sudo systemctl status postgresql
sudo systemctl restart postgresql
```

3. **Teams通知が送信されない**
- `.env`のTeams Webhook URLを確認
- ログで詳細エラーを確認: `pm2 logs schedule-backend`

4. **Prismaマイグレーションエラー**
```bash
npx prisma migrate reset
npx prisma migrate deploy
```

## 📝 API仕様

主要なエンドポイント：

```
GET    /api/health          - ヘルスチェック
GET    /api/tasks           - タスク一覧取得
POST   /api/tasks           - タスク作成
PUT    /api/tasks/:id       - タスク更新
DELETE /api/tasks/:id       - タスク削除
PATCH  /api/tasks/:id/sos   - SOS発信/解除
GET    /api/users           - ユーザー一覧
GET    /api/categories      - カテゴリ一覧
```

## 🔄 更新手順

1. コードをVPSにアップロード
2. `./deploy.sh deploy` 実行
3. 必要に応じてデータベースマイグレーション

---

## ⚡ 高速デプロイコマンド

```bash
# ワンライナーでの完全デプロイ
curl -fsSL https://your-repo/deploy.sh | bash -s setup && \
./deploy.sh deploy
```