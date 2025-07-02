/**
 * @fileoverview データベース接続テスト
 * @description データベース接続を検証するためのユーティリティ
 * @author 中西陽之介
 * @created 2025-06-12
 * @updated 2025-07-03
 * @version 1.0.0
 */

// .env ファイルを読み込む
require('dotenv').config({ path: '../../.env' });

const { Pool } = require('pg');

// 環境変数からデータベース接続情報を取得
const pool = new Pool({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_NAME,
  password: process.env.DB_PASSWORD,
  port: process.env.DB_PORT,
});

// データベースに接続し、簡単なクエリを実行する関数
async function testDbConnection() {
  let client;
  try {
    client = await pool.connect(); // クライアントを取得
    const res = await client.query('SELECT NOW() as current_time'); // 簡単なクエリ（現在時刻を取得）
    console.log('Database connected successfully!');
    console.log('Current time from DB:', res.rows[0].current_time);
    return res.rows[0].current_time;
  } catch (err) {
    console.error('Database connection error:', err.stack);
    throw err; // エラーを再スロー
  } finally {
    if (client) {
      client.release(); // クライアントを解放（重要！）
    }
  }
}

// この関数を外部から呼び出せるようにエクスポートする
module.exports = {
  testDbConnection,
};