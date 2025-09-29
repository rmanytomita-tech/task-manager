module.exports = {
  apps: [
    {
      name: 'schedule-backend',
      script: 'src/server.js',
      instances: 1,
      exec_mode: 'cluster',
      env: {
        NODE_ENV: 'production',
        PORT: 3002
      },
      env_production: {
        NODE_ENV: 'production',
        PORT: 3002
      },
      // ログ設定
      log_file: './logs/combined.log',
      out_file: './logs/out.log',
      error_file: './logs/error.log',
      log_date_format: 'YYYY-MM-DD HH:mm Z',

      // プロセス管理
      watch: false,
      ignore_watch: ['node_modules', 'logs'],
      max_memory_restart: '1G',

      // 自動再起動設定
      autorestart: true,
      max_restarts: 10,
      min_uptime: '10s',

      // クラスター設定
      kill_timeout: 5000,
      wait_ready: true,
      listen_timeout: 3000,
    }
  ]
};