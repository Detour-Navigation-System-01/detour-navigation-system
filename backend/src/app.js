const express = require('express');
const cors = require('./middleware/cors');
const app = express();
const apiRoutes = require('./routes/api');
const indexRoutes = require('./routes/index');
// Docker環境との互換性のため相対パスを使用
const dbTestRoutes = require('./routes/db-test');

// dotenv設定を読み込み
require('dotenv').config();

// ミドルウェア
app.use(cors()); 
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// JSONレスポンスを整形（読みやすく）
app.set('json spaces', 2);

// リクエスト情報をログに出力（開発環境用）
if (process.env.NODE_ENV !== 'production') {
  app.use((req, res, next) => {
    console.log(`📥 ${req.method} ${req.originalUrl}`);
    next();
  });
}

// APIルート - 階層化されたルーティング
app.use('/api', apiRoutes);

// 開発用のレガシールート（互換性のため一時的に残す）
app.use('/api', indexRoutes);
app.use('/api', dbTestRoutes);

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

// 共通エラーハンドリングを適用
const { errorHandler, notFoundHandler } = require('./middleware/errorHandler');

// 404エラーハンドリング - 存在しないパスへのリクエストを処理
app.use(notFoundHandler);

// グローバルエラーハンドリング - すべてのエラーを統一した形式で処理
app.use(errorHandler);

module.exports = app;