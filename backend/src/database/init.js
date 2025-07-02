/**
 * @fileoverview データベース初期化モジュール
 * @description アプリケーション起動時にデータベースの初期化を行う
 * @author 中西陽之介
 * @created 2025-06-12
 * @updated 2025-07-03
 * @version 1.0.0
 */

const { runMigration } = require('../utils/run-migration');
const { runSeeds } = require('../utils/run-seeds');
const fs = require('fs');
const path = require('path');

/**
 * データベースの初期化を行う関数
 * マイグレーションとシードデータの適用を行う
 * アプリケーション起動時に呼び出される
 */
async function initializeDatabase() {
  try {
    console.log('🔄 データベース初期化を開始します...');
    
    // マイグレーションファイルの存在を確認
    const migrationsDir = path.join(__dirname, '..', 'db', 'migrations');
    console.log(`マイグレーションディレクトリのパス: ${migrationsDir}`);
    
    if (fs.existsSync(migrationsDir)) {
      const files = fs.readdirSync(migrationsDir);
      console.log(`マイグレーションファイル一覧: ${files.join(', ')}`);
    } else {
      console.error(`❌ マイグレーションディレクトリが存在しません: ${migrationsDir}`);
    }
    
    // マイグレーションを実行
    console.log('🔧 マイグレーションを実行中...');
    await runMigration();
    
    // シードデータの存在を確認
    const seedsDir = path.join(__dirname, '..', 'db', 'seeds');
    console.log(`シードディレクトリのパス: ${seedsDir}`);
    
    if (fs.existsSync(seedsDir)) {
      const files = fs.readdirSync(seedsDir);
      console.log(`シードファイル一覧: ${files.join(', ')}`);
    } else {
      console.error(`❌ シードディレクトリが存在しません: ${seedsDir}`);
    }
    
    // シードデータを投入
    console.log('🌱 シードデータを投入中...');
    await runSeeds();
    
    console.log('✅ データベース初期化が完了しました');
  } catch (error) {
    console.error('❌ データベース初期化中にエラーが発生しました:', error);
    console.error(error.stack);
    throw error;
  }
}

module.exports = { initializeDatabase };
