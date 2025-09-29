#!/bin/bash

# デプロイスクリプト
# VPSでの初回セットアップとデプロイを自動化

set -e

echo "🚀 スケジュール管理システム - VPSデプロイスクリプト"
echo "=============================================="

# 設定
APP_NAME="schedule-backend"
APP_DIR="/opt/schedule"
BACKUP_DIR="/opt/backups/schedule"
NGINX_CONF="/etc/nginx/sites-available/schedule"
NGINX_ENABLED="/etc/nginx/sites-enabled/schedule"

# 引数チェック
if [ "$#" -ne 1 ]; then
    echo "使用方法: $0 [setup|deploy|rollback]"
    exit 1
fi

# 関数定義
setup_system() {
    echo "📦 システム依存関係をインストール中..."

    # パッケージ更新
    sudo apt update && sudo apt upgrade -y

    # 必要なパッケージをインストール
    sudo apt install -y curl git nginx postgresql postgresql-contrib

    # Node.js 18.x インストール
    curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
    sudo apt install -y nodejs

    # Docker インストール
    curl -fsSL https://get.docker.com -o get-docker.sh
    sudo sh get-docker.sh
    sudo usermod -aG docker $USER

    # Docker Compose インストール
    sudo curl -L "https://github.com/docker/compose/releases/download/v2.21.0/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
    sudo chmod +x /usr/local/bin/docker-compose

    # PM2 インストール
    sudo npm install -g pm2

    # ディレクトリ作成
    sudo mkdir -p $APP_DIR $BACKUP_DIR
    sudo chown -R $USER:$USER $APP_DIR $BACKUP_DIR

    echo "✅ システムセットアップ完了"
}

deploy_app() {
    echo "🔄 アプリケーションをデプロイ中..."

    # バックアップ作成
    if [ -d "$APP_DIR" ]; then
        echo "📦 既存版をバックアップ中..."
        sudo cp -r $APP_DIR $BACKUP_DIR/$(date +%Y%m%d_%H%M%S)
    fi

    # アプリケーションコードをコピー
    echo "📁 アプリケーションファイルをコピー中..."
    sudo rsync -av --exclude=node_modules --exclude=.git ./ $APP_DIR/

    # 所有者変更
    sudo chown -R $USER:$USER $APP_DIR

    # 依存関係インストール
    echo "📦 依存関係をインストール中..."
    cd $APP_DIR
    npm ci --only=production

    # 環境変数設定
    if [ ! -f "$APP_DIR/.env" ]; then
        echo "⚠️  .envファイルが見つかりません。テンプレートからコピーしています..."
        cp .env.example .env
        echo "🔧 $APP_DIR/.env を編集してください"
    fi

    # データベースマイグレーション
    echo "🗃️ データベースマイグレーション実行中..."
    npx prisma generate
    npx prisma migrate deploy

    # PM2でアプリケーション起動
    echo "🚀 アプリケーションを起動中..."
    pm2 stop $APP_NAME || true
    pm2 delete $APP_NAME || true
    pm2 start ecosystem.config.js --env production
    pm2 save

    # Nginxの設定が存在しない場合は設定
    if [ ! -f "$NGINX_CONF" ]; then
        echo "⚙️ Nginx設定中..."
        sudo cp nginx.conf $NGINX_CONF
        sudo ln -sf $NGINX_CONF $NGINX_ENABLED
        sudo nginx -t && sudo systemctl reload nginx
    fi

    echo "✅ デプロイ完了"
    echo "🌐 アプリケーションは以下でアクセス可能です:"
    echo "   API: http://$(hostname -I | awk '{print $1}'):3002"
    echo "   Nginx: http://$(hostname -I | awk '{print $1}')"
}

rollback() {
    echo "↩️ ロールバック中..."

    # 最新のバックアップを取得
    LATEST_BACKUP=$(ls -1t $BACKUP_DIR | head -n 1)

    if [ -z "$LATEST_BACKUP" ]; then
        echo "❌ バックアップが見つかりません"
        exit 1
    fi

    echo "📦 $LATEST_BACKUP にロールバック中..."

    # アプリケーション停止
    pm2 stop $APP_NAME

    # バックアップから復元
    sudo rsync -av $BACKUP_DIR/$LATEST_BACKUP/ $APP_DIR/
    sudo chown -R $USER:$USER $APP_DIR

    # アプリケーション再起動
    cd $APP_DIR
    pm2 start ecosystem.config.js --env production

    echo "✅ ロールバック完了"
}

show_status() {
    echo "📊 システム状態"
    echo "=============="

    echo "📦 PM2 プロセス:"
    pm2 status

    echo ""
    echo "🗃️ PostgreSQL 状態:"
    sudo systemctl status postgresql --no-pager -l

    echo ""
    echo "🌐 Nginx 状態:"
    sudo systemctl status nginx --no-pager -l

    echo ""
    echo "💾 ディスク使用量:"
    df -h $APP_DIR

    echo ""
    echo "📈 メモリ使用量:"
    free -h
}

# メイン処理
case "$1" in
    "setup")
        setup_system
        ;;
    "deploy")
        deploy_app
        ;;
    "rollback")
        rollback
        ;;
    "status")
        show_status
        ;;
    *)
        echo "❌ 無効なコマンド: $1"
        echo "使用方法: $0 [setup|deploy|rollback|status]"
        exit 1
        ;;
esac

echo "🎉 操作完了!"