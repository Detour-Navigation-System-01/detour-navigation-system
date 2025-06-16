const express = require('express');
const cors = require('cors');
const app = express();
const indexRoutes = require('./routes/index');

// ミドルウェア
app.use(cors()); 
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// APIルート
app.use('/api', indexRoutes);

// ルートエンドポイント - ヘルスチェック用
app.get('/', (req, res) => {
  res.json({
    status: 'success',
    message: 'バックエンドサーバーが正常に動作しています',
    timestamp: new Date(),
    version: '1.0.0'
  });
});

// ヘルスチェックエンドポイント
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    uptime: process.uptime(),
    timestamp: new Date()
  });
});

// 404エラーハンドリング
app.use((req, res, next) => {
  res.status(404).json({
    status: 'error',
    message: `リクエストされたパス ${req.path} が見つかりません`
  });
});

// グローバルエラーハンドリング
app.use((err, req, res, next) => {
  console.error('🚨 エラー:', err);
  res.status(err.status || 500).json({
    status: 'error',
    message: err.message || '内部サーバーエラーが発生しました'
  });
});

module.exports = app;