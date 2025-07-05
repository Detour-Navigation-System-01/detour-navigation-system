/**
 * @fileoverview データベース設定モジュール
 * @description 環境変数からデータベース接続設定を読み込み、設定オブジェクトとしてエクスポートする
 * @author 中西陽之介
 * @created 2023-10-01
 * @updated 2025-07-03
 * @version 1.0.0
 */

// データベース接続設定を環境変数から読み込む
require('dotenv').config();

const dbConfig = {
  host: process.env.DB_HOST || 'db',
  port: parseInt(process.env.DB_PORT) || 5432,
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'password',
  database: process.env.DB_NAME || 'wanderdb',
  timezone: 'Asia/Tokyo',  // 日本時間を指定
};

module.exports = dbConfig;
