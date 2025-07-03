/**
 * @fileoverview CORSミドルウェア設定
 * @description クロスオリジンリソース共有の設定を管理するモジュール
 * @author 中西陽之介
 * @created 2025-06-15
 * @updated 2025-07-03
 * @version 1.0.0
 */

const cors = require('cors');

const corsOptions = {
  // すべてのオリジンを許可（開発環境のみ推奨）
  origin: ['http://localhost:3000', 'http://127.0.0.1:5500', 'null', 'file://', '*'],
  credentials: true, 
  methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
  allowedHeaders: ['Content-Type', 'Authorization']
};

module.exports = () => cors(corsOptions); 
