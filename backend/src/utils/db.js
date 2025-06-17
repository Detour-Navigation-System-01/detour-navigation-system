const { Pool } = require('pg');
const dbConfig = require('../config/database');

/**
 * PostgreSQLデータベース接続用のプールを作成
 * 
 * コネクションプールは、複数のデータベース接続を管理します。
 * これにより、毎回接続を確立・切断する必要がなく、接続を再利用できます。
 */
const pool = new Pool({
  host: dbConfig.host,
  port: dbConfig.port,
  user: dbConfig.user,
  password: dbConfig.password,
  database: dbConfig.database,
  // 最大接続数
  max: 20,
  // アイドル状態のクライアントのタイムアウト（ミリ秒）
  idleTimeoutMillis: 30000,
  // 接続タイムアウト（ミリ秒）
  connectionTimeoutMillis: 2000,
});

// 接続エラーをハンドリング
pool.on('error', (err) => {
  console.error('予期せぬデータベースエラーが発生しました', err);
  process.exit(-1);
});

module.exports = pool;
