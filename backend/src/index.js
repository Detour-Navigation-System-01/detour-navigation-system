// アプリケーションのエントリーポイント
// server.jsをインポートして、サーバーを起動する

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
require('./server');

