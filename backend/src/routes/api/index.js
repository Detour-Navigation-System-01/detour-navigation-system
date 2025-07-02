/**
 * @fileoverview APIルート定義
 * @description APIのメインエントリーポイント、ルート定義をまとめる
 * @author 中西陽之介
 * @created 2025-06-14
 * @updated 2025-07-03
 * @version 1.0.0
 */

const express = require('express');
const router = express.Router();
const userRoutes = require('../user');
const authRoutes = require('../auth');
const placesRoutes = require('../places');
const routeRoutes = require('../routes');

const v1Router = express.Router();

v1Router.use('/users', userRoutes);   
v1Router.use('/auth', authRoutes);
v1Router.use('/places', placesRoutes); 
v1Router.use('/routes', routeRoutes);

router.use('/v1', v1Router);

router.use('/users', userRoutes);   
router.use('/auth', authRoutes);
router.use('/places', placesRoutes);   
router.use('/routes', routeRoutes);

module.exports = router;
