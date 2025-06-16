/**
 * Docker環境内でのデータベース接続テストスクリプト
 * このスクリプトはDocker環境内でデータベース接続をテストするためのものです。
 */

// ホスト名をDBに設定
process.env.DB_HOST = 'db';

require('dotenv').config();
const { Pool } = require('pg');
const dbConfig = {
  host: process.env.DB_HOST || 'db', // Docker環境ではdbを使用
  port: parseInt(process.env.DB_PORT) || 5432,
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'password',
  database: process.env.DB_NAME || 'wanderdb'
};

// DB設定を表示
console.log('🔧 Docker環境でのデータベース接続設定:');
console.log(`   ホスト: ${dbConfig.host}`);
console.log(`   ポート: ${dbConfig.port}`);
console.log(`   データベース名: ${dbConfig.database}`);
console.log(`   ユーザー: ${dbConfig.user}`);
console.log(`   パスワード: ${'*'.repeat(dbConfig.password.length)}`);

// DB接続プール作成
const pool = new Pool({
  host: dbConfig.host,
  port: dbConfig.port,
  user: dbConfig.user,
  password: dbConfig.password,
  database: dbConfig.database,
  connectionTimeoutMillis: 5000
});

console.log('\n🔍 データベースへの接続をテスト中...');

// データベース接続テスト
async function testConnection() {
  let client;

  try {
    client = await pool.connect();
    console.log('✅ データベース接続に成功しました!');

    const result = await client.query('SELECT NOW() AS current_time, current_user, version()');
    console.log('\n📊 データベース情報:');
    console.log(`   現在時刻: ${result.rows[0].current_time}`);
    console.log(`   接続ユーザー: ${result.rows[0].current_user}`);
    console.log(`   PostgreSQLバージョン: ${result.rows[0].version}`);

    return true;
  } catch (err) {
    console.error('❌ データベース接続エラー:', err.message);
    
    if (err.code === 'ECONNREFUSED') {
      console.error(`
🚨 接続が拒否されました。以下を確認してください:
  - PostgreSQLサーバーが実行中であるか
  - ホスト名とポートが正しいか`);
    } else if (err.code === 'ETIMEDOUT') {
      console.error(`
🚨 接続タイムアウト。以下を確認してください:
  - ネットワーク設定
  - ホスト名が正確か`);
    } else if (err.code === '28P01') {
      console.error(`
🚨 認証エラー。以下を確認してください:
  - ユーザー名とパスワードが正しいか`);
    }

    return false;
  } finally {
    if (client) client.release();
    await pool.end();
  }
}

testConnection()
  .then(success => {
    if (success) {
      console.log('\n✨ テスト完了: データベース接続は正常です');
      process.exit(0);
    } else {
      console.error('\n❌ テスト失敗: データベース接続に問題があります');
      process.exit(1);
    }
  })
  .catch(err => {
    console.error('予期せぬエラーが発生しました:', err);
    process.exit(1);
  });
