const { Pool } = require('pg');
const dbConfig = require('../config/database');

/**
 * PostgreSQLデータベース接続用のプールを作成
 * 
 * コネクションプールは、複数のデータベース接続を管理します。
 * これにより、毎回接続を確立・切断する必要がなく、接続を再利用できます。
 */
// Docker環境での接続のために、ホスト名を直接指定
const pool = new Pool({
  host: 'db', // Docker環境では必ずdbというホスト名を使用
  port: 5432,
  user: 'postgres',
  password: 'password',
  database: 'wanderdb',
  // 最大接続数
  max: 20,
  // アイドル状態のクライアントのタイムアウト（ミリ秒）
  idleTimeoutMillis: 30000,
  // 接続タイムアウト（ミリ秒）
  connectionTimeoutMillis: 2000,
});

console.log('💾 データベース接続設定を初期化:', {
  host: 'db',
  port: 5432,
  database: 'wanderdb',
  user: 'postgres'
});

// 接続エラーをハンドリング
pool.on('error', (err) => {
  console.error('予期せぬデータベースエラーが発生しました', err);
  process.exit(-1);
});

module.exports = pool;
