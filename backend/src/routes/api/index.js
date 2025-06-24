// backend/src/routes/api/index.js
/**
 * API ルートのメインエントリーポイント
 * このファイルはAPIのルートをまとめてエクスポートする
 */

const express = require('express');
const router = express.Router();
const userRoutes = require('../user');
const authRoutes = require('../auth');
const placesRoutes = require('../places');
const routeRoutes = require('../routes');

// バージョン1のAPI
const v1Router = express.Router();

// 各種APIルートをマウント
v1Router.use(userRoutes);
v1Router.use('/auth', authRoutes);
v1Router.use(placesRoutes);
v1Router.use('/routes', routeRoutes);

// バージョン1のAPIをマウント
router.use('/v1', v1Router);
// 互換性のために直接ルートにもマウント
router.use(userRoutes);
router.use('/auth', authRoutes);
router.use(placesRoutes);
router.use('/routes', routeRoutes);

module.exports = router;
