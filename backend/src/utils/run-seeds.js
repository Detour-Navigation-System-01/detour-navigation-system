/**
 * @fileoverview データベースシード実行ユーティリティ
 * @description SQLファイルからシードデータを投入するスクリプト
 * @author 中西陽之介
 * @created 2025-06-12
 * @updated 2025-07-03
 * @version 1.0.0
 */

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
 * シードデータを投入する関数
 * SQLファイルを読み込み、データベースに適用する
 */
async function runSeeds() {
  try {
    console.log('🌱 シードデータの投入を開始します...');
    
    // シードファイルのディレクトリ
    const seedsDir = path.join(__dirname, '..', 'db', 'seeds');
    
    // シードファイルの読み込み
    const files = fs.readdirSync(seedsDir)
      .filter(file => file.endsWith('.sql'))
      .sort(); // 番号順に実行するために並べ替え
    
    // シードテーブルの存在確認、なければ作成
    await pool.query(`
      CREATE TABLE IF NOT EXISTS seeds (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        executed_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      )
    `);
    
    // 実行済みシードの取得
    const { rows: executedSeeds } = await pool.query('SELECT name FROM seeds');
    const executedSeedNames = executedSeeds.map(row => row.name);
    
    for (const file of files) {
      // 既に実行済みのシードはスキップ
      if (executedSeedNames.includes(file)) {
        console.log(`✓ シード ${file} は既に適用されています`);
        continue;
      }
      
      // SQLファイルの読み込み
      const filePath = path.join(seedsDir, file);
      const sql = fs.readFileSync(filePath, 'utf8');
      
      console.log(`🔄 シード ${file} を実行中...`);
      
      // トランザクション内でクエリを実行
      const client = await pool.connect();
      try {
        await client.query('BEGIN');
        await client.query(sql);
        await client.query('INSERT INTO seeds (name) VALUES ($1)', [file]);
        await client.query('COMMIT');
        console.log(`✅ シード ${file} が正常に適用されました`);
      } catch (err) {
        await client.query('ROLLBACK');
        console.error(`❌ シード ${file} の適用に失敗しました:`, err);
        throw err;
      } finally {
        client.release();
      }
    }
      console.log('✅ シードデータの投入が完了しました');
    
    // モジュールとして呼び出された場合はプールを閉じない
    if (require.main === module) {
      await pool.end();
    }
    
  } catch (err) {
    console.error('❌ シード処理でエラーが発生しました:', err);
    
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
  runSeeds()
    .then(() => console.log('シードスクリプトが正常に完了しました'))
    .catch(err => {
      console.error('シードスクリプトでエラーが発生しました:', err);
      process.exit(1);
    });
}

module.exports = { runSeeds };
