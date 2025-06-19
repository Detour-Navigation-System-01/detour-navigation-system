// backend/src/routes/api/index.js
/**
 * API ルートのメインエントリーポイント
 * このファイルはAPIのルートをまとめてエクスポートする
 */

const express = require('express');
const router = express.Router();
const userRoutes = require('../user');

// バージョン1のAPI
const v1Router = express.Router();

// 各種APIルートをマウント
v1Router.use(userRoutes);

// バージョン1のAPIをマウント
router.use('/v1', v1Router);
// 互換性のために直接ルートにもマウント
router.use(userRoutes);

module.exports = router;
