// backend/src/utils/run-migration.js
// 実行方法：node src/utils/run-migration.js
const fs = require('fs');
const path = require('path');
const { Pool } = require('pg');
const dbConfig = require('../config/database');

const pool = new Pool({
  host: dbConfig.host,
  port: dbConfig.port,
  user: dbConfig.user,
  password: dbConfig.password,
  database: dbConfig.database,
});

/**
 * マイグレーションを実行する関数
 * SQLファイルを読み込み、データベースに適用する
 */
async function runMigration() {
  try {
    console.log('🔄 マイグレーションを開始します...');
      // マイグレーションファイルのディレクトリ
    const migrationsDir = path.join(__dirname, '..', 'db', 'migrations');
    console.log(`マイグレーションディレクトリパス: ${migrationsDir}`);
    
    // ディレクトリが存在するか確認
    if (!fs.existsSync(migrationsDir)) {
      console.error(`マイグレーションディレクトリが存在しません: ${migrationsDir}`);
      throw new Error(`マイグレーションディレクトリが見つかりません: ${migrationsDir}`);
    }
    
    // マイグレーションファイルの読み込み
    const files = fs.readdirSync(migrationsDir)
      .filter(file => file.endsWith('.sql'))
      .sort(); // 番号順に実行するために並べ替え
    
    console.log(`マイグレーションファイル数: ${files.length}`);
    if (files.length === 0) {
      console.warn('マイグレーションファイルが見つかりませんでした');
    } else {
      console.log(`マイグレーションファイル: ${files.join(', ')}`);
    }
    
    // マイグレーションテーブルの存在確認、なければ作成
    await pool.query(`
      CREATE TABLE IF NOT EXISTS migrations (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        executed_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      )
    `);
    
    // 実行済みマイグレーションの取得
    const { rows: executedMigrations } = await pool.query('SELECT name FROM migrations');
    const executedMigrationNames = executedMigrations.map(row => row.name);
    
    for (const file of files) {
      // 既に実行済みのマイグレーションはスキップ
      if (executedMigrationNames.includes(file)) {
        console.log(`✓ マイグレーション ${file} は既に適用されています`);
        continue;
      }
      
      // SQLファイルの読み込み
      const filePath = path.join(migrationsDir, file);
      const sql = fs.readFileSync(filePath, 'utf8');
      
      console.log(`🔄 マイグレーション ${file} を実行中...`);
      
      // トランザクション内でクエリを実行
      const client = await pool.connect();
      try {
        await client.query('BEGIN');
        await client.query(sql);
        await client.query('INSERT INTO migrations (name) VALUES ($1)', [file]);
        await client.query('COMMIT');
        console.log(`✅ マイグレーション ${file} が正常に適用されました`);
      } catch (err) {
        await client.query('ROLLBACK');
        console.error(`❌ マイグレーション ${file} の適用に失敗しました:`, err);
        throw err;
      } finally {
        client.release();
      }
    }
      console.log('✅ マイグレーションが完了しました');
    
    // モジュールとして呼び出された場合はプールを閉じない
    if (require.main === module) {
      await pool.end();
    }
    
  } catch (err) {
    console.error('❌ マイグレーション処理でエラーが発生しました:', err);
    
    // モジュールとして呼び出された場合はプールを閉じない
    if (require.main === module) {
      await pool.end();
      process.exit(1);
    }
    throw err;
  }
}

// スクリプトが直接実行された場合のみ実行
if (require.main === module) {
  runMigration()
    .then(() => console.log('マイグレーションスクリプトが正常に完了しました'))
    .catch(err => {
      console.error('マイグレーションスクリプトでエラーが発生しました:', err);
      process.exit(1);
    });
}

module.exports = { runMigration };