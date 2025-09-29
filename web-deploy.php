<?php
/**
 * Web経由デプロイスクリプト
 * VPSのApache DocumentRoot (/var/www/html) に配置して実行
 */

// セキュリティ: 特定のIPからのみアクセス許可
$allowed_ips = ['YOUR_IP_HERE']; // あなたのIPアドレスに変更
if (!in_array($_SERVER['REMOTE_ADDR'], $allowed_ips) && $_SERVER['REMOTE_ADDR'] !== '127.0.0.1') {
    die('Access denied');
}

$action = $_GET['action'] ?? 'form';
$password = 'deploy2025!'; // デプロイパスワード

?>
<!DOCTYPE html>
<html>
<head>
    <title>Schedule App Deploy</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 40px; }
        .container { max-width: 800px; }
        .step { background: #f5f5f5; padding: 15px; margin: 10px 0; border-radius: 5px; }
        .success { background: #d4edda; color: #155724; }
        .error { background: #f8d7da; color: #721c24; }
        textarea { width: 100%; height: 200px; font-family: monospace; }
        input, button { padding: 10px; margin: 5px 0; }
        button { background: #007bff; color: white; border: none; border-radius: 3px; cursor: pointer; }
        button:hover { background: #0056b3; }
    </style>
</head>
<body>
    <div class="container">
        <h1>🚀 Schedule Management System Deploy</h1>

        <?php if ($action === 'form'): ?>
            <div class="step">
                <h2>Step 1: システム初期化</h2>
                <form method="post">
                    <input type="hidden" name="action" value="init">
                    <input type="password" name="password" placeholder="Deploy Password" required>
                    <button type="submit">Node.js + PostgreSQL インストール</button>
                </form>
            </div>

            <div class="step">
                <h2>Step 2: プロジェクトファイル作成</h2>
                <form method="post">
                    <input type="hidden" name="action" value="create_files">
                    <input type="password" name="password" placeholder="Deploy Password" required>
                    <button type="submit">プロジェクトファイル作成</button>
                </form>
            </div>

            <div class="step">
                <h2>Step 3: アプリケーションデプロイ</h2>
                <form method="post">
                    <input type="hidden" name="action" value="deploy">
                    <input type="password" name="password" placeholder="Deploy Password" required>
                    <button type="submit">アプリデプロイ実行</button>
                </form>
            </div>

            <div class="step">
                <h2>Step 4: サービス開始</h2>
                <form method="post">
                    <input type="hidden" name="action" value="start">
                    <input type="password" name="password" placeholder="Deploy Password" required>
                    <button type="submit">サービス開始</button>
                </form>
            </div>
        <?php endif; ?>

        <?php
        if ($_POST && $_POST['password'] === $password) {
            $action = $_POST['action'];

            echo "<div class='step'><h2>実行中: $action</h2><textarea readonly>";

            switch ($action) {
                case 'init':
                    // Node.js とPostgreSQL インストール
                    $commands = [
                        'sudo apt update && sudo apt upgrade -y',
                        'curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -',
                        'sudo apt-get install -y nodejs',
                        'sudo apt install -y postgresql postgresql-contrib',
                        'sudo systemctl start postgresql',
                        'sudo systemctl enable postgresql',
                        'node --version && npm --version'
                    ];
                    break;

                case 'create_files':
                    // プロジェクトファイル作成
                    $project_dir = '/var/www/schedule';
                    exec("sudo mkdir -p $project_dir");

                    // package.json 作成
                    $package_json = json_encode([
                        "name" => "schedule-backend",
                        "version" => "1.0.0",
                        "scripts" => [
                            "start" => "node src/server.js",
                            "dev" => "nodemon src/server.js"
                        ],
                        "dependencies" => [
                            "express" => "^4.18.2",
                            "cors" => "^2.8.5",
                            "bcrypt" => "^5.1.1",
                            "jsonwebtoken" => "^9.0.2",
                            "@prisma/client" => "^5.7.0",
                            "zod" => "^3.22.4"
                        ]
                    ], JSON_PRETTY_PRINT);

                    file_put_contents("$project_dir/package.json", $package_json);

                    // .env作成
                    $env_content = "NODE_ENV=production\n";
                    $env_content .= "PORT=3002\n";
                    $env_content .= "DATABASE_URL=\"postgresql://schedule_user:schedule_pass@localhost:5432/schedule_db\"\n";
                    $env_content .= "JWT_SECRET=\"your-very-secure-jwt-secret-key\"\n";
                    $env_content .= "FRONTEND_URL=\"http://localhost\"\n";

                    file_put_contents("$project_dir/.env", $env_content);

                    $commands = [
                        "ls -la $project_dir",
                        "cd $project_dir && sudo npm install",
                        "sudo chown -R www-data:www-data $project_dir"
                    ];
                    break;

                case 'deploy':
                    $commands = [
                        'sudo -u postgres psql -c "CREATE DATABASE schedule_db;" 2>/dev/null || echo "DB exists"',
                        'sudo -u postgres psql -c "CREATE USER schedule_user WITH PASSWORD \'schedule_pass\';" 2>/dev/null || echo "User exists"',
                        'sudo -u postgres psql -c "GRANT ALL PRIVILEGES ON DATABASE schedule_db TO schedule_user;" 2>/dev/null || echo "Granted"',
                        'sudo a2enmod rewrite',
                        'sudo a2enmod proxy',
                        'sudo a2enmod proxy_http',
                        'sudo systemctl reload apache2'
                    ];
                    break;

                case 'start':
                    $commands = [
                        'sudo systemctl status apache2',
                        'curl -I http://localhost/',
                        'ps aux | grep node || echo "Node not running"'
                    ];
                    break;

                default:
                    $commands = ['echo "Unknown action"'];
            }

            foreach ($commands as $cmd) {
                echo "$ $cmd\n";
                $output = shell_exec("$cmd 2>&1");
                echo $output . "\n\n";
            }

            echo "</textarea></div>";
            echo "<a href='?'>← Back to Menu</a>";
        } elseif ($_POST) {
            echo "<div class='error'>Invalid password</div>";
        }
        ?>
    </div>
</body>
</html>