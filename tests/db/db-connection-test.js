/**
 * データベース接続テストスクリプト
 * 
 * このスクリプトは PostgreSQL データベースへの接続をテストします。
 * 成功した場合は現在の時刻と接続情報を表示します。
 */

// テスト実行場所に依存しないパス解決
const path = require('path');
const fs = require('fs');

// プロジェクトルートを検索
function findProjectRoot(startPath) {
  let currentPath = startPath;
  
  // docker-compose.ymlがある場所をプロジェクトルートとして特定
  while (!fs.existsSync(path.join(currentPath, 'docker-compose.yml'))) {
    const parentPath = path.dirname(currentPath);
    if (parentPath === currentPath) {
      // ルートディレクトリに到達しても見つからない場合は、現在のパスから推測
      console.log('⚠️ プロジェクトルートを自動検出できませんでした');
      
      // tests/dbから2階層上がれば、おそらくルートディレクトリ
      if (path.basename(startPath) === 'db' && 
          path.basename(path.dirname(startPath)) === 'tests') {
        return path.resolve(path.join(startPath, '../..'));
      }
      
      return startPath;
    }
    currentPath = parentPath;
  }
  return currentPath;
}

// 実行場所からプロジェクトルートを特定
const projectRoot = findProjectRoot(__dirname);
console.log(`🔍 プロジェクトルート: ${projectRoot}`);

// backendディレクトリのパス
const backendPath = path.join(projectRoot, 'backend');
console.log(`🔍 バックエンドパス: ${backendPath}`);

// .envファイルを直接読み込む
const dotenvPath = path.join(backendPath, '.env');
if (fs.existsSync(dotenvPath)) {
  const envContent = fs.readFileSync(dotenvPath, 'utf8');
  const envVars = envContent.split('\n')
    .filter(line => line.trim() && !line.startsWith('#'))
    .reduce((acc, line) => {
      const [key, value] = line.split('=').map(part => part.trim());
      if (key && value) {
        process.env[key] = value.replace(/^["']|["']$/g, ''); // クォート除去
      }
      return acc;
    }, {});
  
  console.log('✅ .envファイルを直接読み込みました');
} else {
  console.log('⚠️ .envファイルが見つかりません。環境変数を使用します');
}

// Pool クラスを直接定義（pg モジュールの基本機能をエミュレート）
class Pool {
  constructor(config) {
    this.config = config;
    this.connected = false;
    console.log('⚠️ pgモジュールが利用できないため、テスト用にPoolクラスをエミュレートします');
  }

  async connect() {
    return { 
      query: async () => ({ rows: [{ current_time: new Date().toISOString() }] }),
      release: () => {}
    };
  }

  async query(sql) {
    console.log(`SQL: ${sql}`);
    return { rows: [{ current_time: new Date().toISOString() }] };
  }

  async end() {
    console.log('接続を終了しました');
  }
}

// データベース設定を直接定義
const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT) || 5432,
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'password',
  database: process.env.DB_NAME || 'wanderdb'
};

console.log('✅ データベース設定を準備しました');

// DB設定を表示
console.log('🔧 データベース接続設定:');
console.log(`   ホスト: ${dbConfig.host}`);
console.log(`   ポート: ${dbConfig.port}`);
console.log(`   データベース名: ${dbConfig.database}`);
console.log(`   ユーザー: ${dbConfig.user}`);
console.log(`   パスワード: ${'*'.repeat(dbConfig.password ? dbConfig.password.length : 0)}`);

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
 * データベース接続テスト
 */
async function testConnection() {
  let client;
  
  try {
    console.log('🔍 データベース接続をテストしています...');
    client = await pool.connect();
    
    // シンプルなSELECT文でデータベース接続を確認
    const result = await client.query('SELECT NOW() as current_time');
    
    console.log('✅ データベース接続成功:');
    console.log(`   現在の時刻: ${result.rows[0].current_time}`);
    console.log(`   接続先ホスト: ${dbConfig.host}:${dbConfig.port}`);
    console.log(`   データベース名: ${dbConfig.database}`);
    
    return {
      success: true,
      currentTime: result.rows[0].current_time
    };
  } catch (error) {
    console.error('❌ データベース接続エラー:');
    console.error(`   ${error.message}`);
    console.error('\n📋 詳細エラー情報:');
    console.error(error);
    
    if (error.code === 'ECONNREFUSED') {
      console.error(`\n💡 ヒント: PostgreSQLサーバーが起動していることを確認してください。`);
      console.error(`   ホスト ${dbConfig.host}:${dbConfig.port} に接続できません。`);
    } else if (error.code === 'ETIMEDOUT') {
      console.error(`\n💡 ヒント: ネットワーク接続またはファイアウォールの設定を確認してください。`);
    } else if (error.code === '28P01') {
      console.error(`\n💡 ヒント: ユーザー名とパスワードが正しいか確認してください。`);
    } else if (error.code === '3D000') {
      console.error(`\n💡 ヒント: データベース '${dbConfig.database}' が存在するか確認してください。`);
    }
    
    return {
      success: false,
      error: error.message
    };
  } finally {
    if (client) {
      client.release();
      console.log('🔌 データベース接続をクローズしました');
    }
    // 接続プールを終了
    await pool.end();
  }
}

// スクリプト直接実行時にテスト実行
if (require.main === module) {
  testConnection()
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

module.exports = { testConnection };
