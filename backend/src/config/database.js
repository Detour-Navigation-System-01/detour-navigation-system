// データベース接続設定を環境変数から読み込む
require('dotenv').config();

const dbConfig = {
  host: process.env.DB_HOST || 'db',
  port: parseInt(process.env.DB_PORT) || 5432,
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'password',
  database: process.env.DB_NAME || 'wanderdb',
};

module.exports = dbConfig;
