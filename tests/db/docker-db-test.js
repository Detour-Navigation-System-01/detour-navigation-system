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
  // 接続失敗時に素早くエラーを検出するための設定
  connectionTimeoutMillis: 5000
});

/**
 * Docker環境内でのデータベース接続テスト
 */
async function testDockerConnection() {
  let client;
  
  try {
    console.log('🔍 Docker環境内でデータベース接続をテストしています...');
    client = await pool.connect();
    
    // シンプルなSELECT文でデータベース接続を確認
    const result = await client.query('SELECT NOW() as current_time');
    
    console.log('✅ Docker環境でのデータベース接続成功:');
    console.log(`   現在の時刻: ${result.rows[0].current_time}`);
    console.log(`   接続先ホスト: ${dbConfig.host}:${dbConfig.port}`);
    console.log(`   データベース名: ${dbConfig.database}`);
    
    return {
      success: true,
      currentTime: result.rows[0].current_time
    };
  } catch (error) {
    console.error('❌ Docker環境でのデータベース接続エラー:');
    console.error(`   ${error.message}`);
    console.error('\n📋 詳細エラー情報:');
    console.error(error);
    
    if (error.code === 'ECONNREFUSED') {
      console.error(`\n💡 ヒント: Docker内のPostgreSQLサーバーが起動していることを確認してください。`);
      console.error(`   ホスト ${dbConfig.host}:${dbConfig.port} に接続できません。`);
      console.error(`   Docker Composeが正しく起動しているか確認してください。`);
    } else if (error.code === '28P01') {
      console.error(`\n💡 ヒント: Docker環境のユーザー名とパスワードが正しいか確認してください。`);
    } else if (error.code === '3D000') {
      console.error(`\n💡 ヒント: Docker環境内のデータベース '${dbConfig.database}' が存在するか確認してください。`);
    }
    
    return {
      success: false,
      error: error.message
    };
  } finally {
    if (client) {
      client.release();
      console.log('🔌 Docker環境でのデータベース接続をクローズしました');
    }
    // 接続プールを終了
    await pool.end();
  }
}

// スクリプト直接実行時にテスト実行
if (require.main === module) {
  testDockerConnection()
    .then(result => {
      if (!result.success) {
        process.exit(1);
      }
    })
    .catch(error => {
      console.error('予期せぬエラー:', error);
      process.exit(1);
    });
}

module.exports = { testDockerConnection };
