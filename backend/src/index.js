/**
 * @fileoverview アプリケーションエントリーポイント
 * @description データベース初期化後にサーバーを起動する
 * @author 中西陽之介
 * @created 2025-06-12
 * @updated 2025-07-03
 * @version 1.0.0
 */

// Docker環境のためのDB接続設定
// Docker環境ではDBホスト名は'localhost'ではなく'db'であることを明示的に設定
process.env.DB_HOST = 'db';
process.env.DB_PORT = '5432';
process.env.DB_USER = 'postgres';
process.env.DB_PASSWORD = 'password';
process.env.DB_NAME = 'wanderdb';

console.log('🚀 バックエンドアプリケーションを起動します...');
console.log('💾 DB接続設定:', {
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  database: process.env.DB_NAME,
  user: process.env.DB_USER
});

// データベース初期化とサーバー起動
const { initializeDatabase } = require('./database/init');

// データベース初期化後にサーバーを起動
async function startApplication() {
  try {
    // データベースの初期化（マイグレーションとシードデータの投入）
    await initializeDatabase();
    
    // サーバーの起動
    require('./server');
  } catch (error) {
    console.error('❌ アプリケーション起動中にエラーが発生しました:', error);
    process.exit(1);
  }
}

// アプリケーションを開始
startApplication();

