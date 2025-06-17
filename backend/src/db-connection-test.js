/**
 * データベース接続テストスクリプト
 * 
 * このスクリプトは PostgreSQL データベースへの接続をテストします。
 * 成功した場合は現在の時刻と接続情報を表示します。
 */

require('dotenv').config();
const { Pool } = require('pg');
const dbConfig = require('./config/database');

// DB設定を表示
console.log('🔧 データベース接続設定:');
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
  // 接続失敗時に素早くエラーを検出するための設定
  connectionTimeoutMillis: 5000
});

console.log('\n🔍 データベースへの接続をテスト中...');

// データベース接続テスト
async function testConnection() {
  let client;

  try {
    // クライアント接続を取得
    client = await pool.connect();
    console.log('✅ データベース接続に成功しました!');

    // 簡単なクエリを実行
    const result = await client.query('SELECT NOW() AS current_time, current_user, version()');
    console.log('\n📊 データベース情報:');
    console.log(`   現在時刻: ${result.rows[0].current_time}`);
    console.log(`   接続ユーザー: ${result.rows[0].current_user}`);
    console.log(`   PostgreSQLバージョン: ${result.rows[0].version}`);

    return true;
  } catch (err) {
    console.error('❌ データベース接続エラー:', err.message);
    
    // よくあるエラーの原因と解決策を提案
    if (err.code === 'ECONNREFUSED') {
      console.error(`
🚨 接続が拒否されました。以下を確認してください:
  - PostgreSQLサーバーが実行中であるか
  - ホスト名とポートが正しいか
  - ファイアウォールが接続を許可しているか`);
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
    // 接続を閉じる
    if (client) client.release();
    
    // プールを終了
    await pool.end();
  }
}

// テスト実行
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
