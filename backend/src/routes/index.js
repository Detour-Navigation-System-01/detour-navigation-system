/**
 * @fileoverview APIルートインデックス
 * @description API基本エンドポイントとシステム情報API
 * @author 中西陽之介
 * @created 2025-06-14
 * @updated 2025-07-03
 * @version 1.0.0
 */

const express = require('express');
const router = express.Router();

// APIルートインデックス
router.get('/', (req, res) => {
  res.json({
    message: 'Welcome to the Detour Navigation System API',
    endpoints: {
      '/api': 'このメッセージを表示',
      '/api/ping': '疎通確認用エンドポイント',
      '/api/echo': 'リクエストパラメータをエコーバック',
      '/api/time': '現在の時刻を返す'
    },
    documentation: '/api/docs' // 将来的にSwagger UIなどを追加する予定
  });
});

// 疎通確認用エンドポイント
router.get('/ping', (req, res) => {
  res.json({
    message: 'pong from backend!',
    timestamp: new Date(),
    environment: process.env.NODE_ENV || 'development'
  });
});

// エコーエンドポイント - リクエストパラメータを返す
router.get('/echo', (req, res) => {
  res.json({
    query: req.query,
    message: 'このエンドポイントは受け取ったクエリパラメータをそのまま返します'
  });
});

// 現在時刻を返すエンドポイント
router.get('/time', (req, res) => {
  res.json({
    iso: new Date().toISOString(),
    localeString: new Date().toLocaleString('ja-JP'),
    timestamp: Date.now()
  });
});



module.exports = router;