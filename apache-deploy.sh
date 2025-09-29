#!/bin/bash

# Apache用デプロイスクリプト
echo "🚀 Apache用スケジュール管理システム デプロイスクリプト"
echo "=============================================="

# Node.js インストール確認・実行
setup_nodejs() {
    echo "📦 Node.js インストール中..."

    # Node.js がインストールされているか確認
    if ! command -v node &> /dev/null; then
        echo "Node.js をインストールしています..."
        curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
        sudo apt-get install -y nodejs
    else
        echo "✅ Node.js は既にインストール済みです"
        echo "バージョン: $(node --version)"
    fi
}

# Apache設定
setup_apache() {
    echo "🌐 Apache設定中..."

    # mod_rewrite と mod_proxy を有効化
    sudo a2enmod rewrite
    sudo a2enmod proxy
    sudo a2enmod proxy_http

    # Apacheサイト設定をコピー
    sudo cp backend/apache-schedule.conf /etc/apache2/sites-available/
    sudo a2ensite apache-schedule
    sudo a2dissite 000-default

    # Apache再起動
    sudo systemctl reload apache2
}

# PostgreSQL設定
setup_database() {
    echo "🗄️ PostgreSQL設定中..."

    if ! command -v psql &> /dev/null; then
        echo "PostgreSQL をインストールしています..."
        sudo apt install -y postgresql postgresql-contrib
        sudo systemctl start postgresql
        sudo systemctl enable postgresql
    else
        echo "✅ PostgreSQL は既にインストール済みです"
    fi
}

# React アプリビルド
build_react() {
    echo "⚛️ React アプリをビルド中..."

    # 依存関係インストール
    npm install

    # 本番ビルド
    npm run build

    # Apache document root にデプロイ
    sudo mkdir -p /var/www/html/schedule
    sudo cp -r dist/* /var/www/html/schedule/
    sudo chown -R www-data:www-data /var/www/html/schedule
}

# Node.js バックエンド設定
setup_backend() {
    echo "🔧 Node.js バックエンド設定中..."

    # バックエンドディレクトリに移動
    cd backend

    # 依存関係インストール
    npm install

    # 環境変数ファイル作成
    if [ ! -f .env ]; then
        cp .env.example .env
        echo "⚠️ .env ファイルを編集してください:"
        echo "   - DATABASE_URL"
        echo "   - JWT_SECRET"
        echo "   - その他必要な設定"
    fi

    # PM2の代わりにsystemd serviceを作成
    create_systemd_service

    cd ..
}

# systemd サービス作成
create_systemd_service() {
    echo "🔄 systemd サービス作成中..."

    sudo tee /etc/systemd/system/schedule-api.service > /dev/null <<EOF
[Unit]
Description=Schedule API Server
After=network.target

[Service]
Type=simple
User=www-data
WorkingDirectory=/var/www/schedule-api
ExecStart=/usr/bin/node src/server.js
Restart=on-failure
Environment=NODE_ENV=production
Environment=PORT=3002

[Install]
WantedBy=multi-user.target
EOF

    # サービス有効化
    sudo systemctl daemon-reload
    sudo systemctl enable schedule-api
}

# メイン実行
case "$1" in
    "setup")
        setup_nodejs
        setup_apache
        setup_database
        ;;
    "deploy")
        build_react
        setup_backend

        # バックエンドファイルをコピー
        sudo mkdir -p /var/www/schedule-api
        sudo cp -r backend/* /var/www/schedule-api/
        sudo chown -R www-data:www-data /var/www/schedule-api

        # データベースマイグレーション（手動実行が必要）
        echo "🔧 データベース設定を完了してください:"
        echo "   sudo -u postgres psql"
        echo "   CREATE DATABASE schedule_db;"
        echo "   CREATE USER schedule_user WITH PASSWORD 'your_password';"
        echo "   GRANT ALL PRIVILEGES ON DATABASE schedule_db TO schedule_user;"
        echo ""
        echo "   cd /var/www/schedule-api"
        echo "   sudo -u www-data npx prisma migrate deploy"
        echo "   sudo -u www-data npx prisma db seed"
        echo ""
        echo "   sudo systemctl start schedule-api"
        ;;
    "start")
        sudo systemctl start schedule-api
        sudo systemctl status schedule-api
        ;;
    "stop")
        sudo systemctl stop schedule-api
        ;;
    "restart")
        sudo systemctl restart schedule-api
        sudo systemctl status schedule-api
        ;;
    "status")
        sudo systemctl status schedule-api
        sudo systemctl status apache2
        ;;
    *)
        echo "使用方法: $0 {setup|deploy|start|stop|restart|status}"
        echo ""
        echo "setup   - システムの初期設定（Node.js、Apache、PostgreSQL）"
        echo "deploy  - アプリケーションのデプロイ"
        echo "start   - APIサーバー開始"
        echo "stop    - APIサーバー停止"
        echo "restart - APIサーバー再起動"
        echo "status  - サービス状況確認"
        exit 1
        ;;
esac

echo "✅ 処理完了!"