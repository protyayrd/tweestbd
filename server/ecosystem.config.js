module.exports = {
  apps: [{
    name: 'tweest-server',
    script: 'src/server.js',
    cwd: '/home/ubuntu/tweest/server',
    instances: 1,
    exec_mode: 'fork',
    watch: false,
    max_memory_restart: '1G',
    env: {
      NODE_ENV: 'development',
      PORT: 5454
    },
    env_production: {
      NODE_ENV: 'production',
      PORT: 5454
    },
    log_file: './logs/combined.log',
    out_file: './logs/out.log',
    error_file: './logs/error.log',
    time: true,
    autorestart: true,
    max_restarts: 10,
    min_uptime: '10s'
  }]
}; 