/**
 * @fileoverview サーバー起動スクリプト
 * @description アプリケーションサーバーの初期化と起動処理
 * @author 中西陽之介
 * @created 2025-06-12
 * @updated 2025-07-03
 * @version 1.1.0
 */

const app = require('./app');
const PORT = process.env.PORT || 3001;
// データベース初期化モジュールをインポート
const { initializeDatabase } = require('./database/init');

// リクエストロギングミドルウェア
app.use((req, res, next) => {
  const start = Date.now();
  
  // レスポンスが完了したときに実行されるイベントリスナー
  res.on('finish', () => {
    const duration = Date.now() - start;
    console.log(
      `📨 ${new Date().toISOString()} | ${req.method} ${req.originalUrl} | ${res.statusCode} | ${duration}ms`
    );
  });
  
  next();
});

// データベース初期化後にサーバーを起動
async function startServer() {
  try {
    // データベース初期化を実行
    console.log('🔄 データベースの初期化を開始...');
    await initializeDatabase();
    console.log('✅ データベース初期化が完了しました');
    
    // サーバー起動
    app.listen(PORT, () => {
      console.log(`
  🚀 サーバーが起動しました
  📡 http://localhost:${PORT}
  🕒 ${new Date().toLocaleString()}
  `);
    });
  } catch (error) {
    console.error('❌ サーバー起動中にエラーが発生しました:', error);
    // データベース初期化に失敗してもサーバーを起動する
    // ただしエラーログは出力しておく
    console.log('⚠️ データベース初期化に失敗しましたが、サーバーは起動します');
    app.listen(PORT, () => {
      console.log(`
  🚀 サーバーが起動しました（データベース初期化エラーあり）
  📡 http://localhost:${PORT}
  🕒 ${new Date().toLocaleString()}
  `);
    });
  }
}

// サーバーを起動
startServer();