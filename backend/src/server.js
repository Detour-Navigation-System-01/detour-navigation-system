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

// サーバーを起動する関数
async function startServer() {
  try {
    // index.jsで既にデータベース初期化が行われているため、ここでは省略
    
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
    // エラーがあってもサーバーを起動
    app.listen(PORT, () => {
      console.log(`
  🚀 サーバーが起動しました（エラーあり: ${error.message}）
  📡 http://localhost:${PORT}
  🕒 ${new Date().toLocaleString()}
  `);
    });
  }
}

// サーバーを起動
startServer();