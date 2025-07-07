/**
 * @fileoverview バックエンドアプリケーションメイン
 * @description Expressアプリケーションの構成、ミドルウェア、ルーティング設定
 * @author 中西陽之介
 * @created 2025-06-12
 * @updated 2025-07-03
 * @version 1.2.0
 */

const express = require('express');
const cors = require('./middleware/cors');
const app = express();
const apiRoutes = require('./routes/api');
const indexRoutes = require('./routes/index');
// Docker環境との互換性のため相対パスを使用
const dbTestRoutes = require('./routes/db-test');
const placesRoutes = require('./routes/places');
const path = require('path');

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

app.use('/images', express.static(path.join(__dirname, '..', 'public', 'images')));

// APIルート - 階層化されたルーティング
app.use('/api', apiRoutes);

// 開発用のレガシールート（互換性のため一時的に残す）
app.use('/api', indexRoutes);
app.use('/api', dbTestRoutes);

// placesルート
app.use('/api/places', placesRoutes);

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
