// backend/src/routes/db_access_route.js

// .env ファイルはプロジェクトルート (detour-navigation-system) にあるので、
// routes/ からは '../../.env' と指定します
require('dotenv').config({ path: '../../.env' });

const express = require('express');
const router = express.Router();
const { Pool } = require('pg');

// 環境変数からデータベース接続情報を取得
const pool = new Pool({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_NAME,
  password: process.env.DB_PASSWORD,
  port: process.env.DB_PORT,
});

// データベースに接続し、簡単なクエリを実行するルート
router.get('/db_test', async (req, res) => { // <-- ルートパスを '/db_test' に設定
  let client;
  try {
    client = await pool.connect(); // クライアントを取得
    const resDb = await client.query('SELECT NOW() as current_time'); // DBクエリの結果
    console.log('Database connected successfully!');
    console.log('Current time from DB:', resDb.rows[0].current_time);
    res.status(200).json({
      message: 'DB connection successful',
      currentTime: resDb.rows[0].current_time
    });
  } catch (err) {
    console.error('Database connection error:', err.stack);
    res.status(500).json({
      message: 'DB connection failed',
      error: err.message
    });
  } finally {
    if (client) {
      client.release(); // クライアントを解放（重要！）
    }
  }
});

module.exports = router;