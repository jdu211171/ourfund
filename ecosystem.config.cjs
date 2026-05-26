module.exports = {
  apps: [
    {
      name: "ourfund-web",
      script: "server.mjs",
      interpreter: "/root/.nvm/versions/node/v22.12.0/bin/node",
      cwd: "/var/www/ourfund",
      env: {
        NODE_ENV: "production",
        PORT: "3002",
      },
    },
  ],
};
