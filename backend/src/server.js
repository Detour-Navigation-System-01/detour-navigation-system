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

// サーバー起動
app.listen(PORT, () => {
  console.log(`
  🚀 サーバーが起動しました
  📡 http://localhost:${PORT}
  🕒 ${new Date().toLocaleString()}
  `);
});