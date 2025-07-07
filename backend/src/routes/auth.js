// backend/src/routes/auth.js

const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { validateUserData } = require('../middleware/validation');
const { validateIdParam } = require('../middleware/validation');
const authenticate = require('../middleware/auth');

/**
 * @route POST /api/auth/login
 * @desc ユーザーログイン
 * @access Public
 */
router.post('/login', authController.login);

/**
 * @route POST /api/auth/register
 * @desc 新規ユーザー登録
 * @access Public
 */
router.post('/register', validateUserData, authController.register);

/**
 * @route PUT /api/auth/password/:id
 * @desc パスワード変更
 * @access Private
 */
router.put('/password/:id', authenticate, validateIdParam, authController.changePassword);

/**
 * @route POST /api/auth/logout
 * @desc ユーザーログアウト（トークンを無効化）
 * @access Public
 */
router.post('/logout', authController.logout);

/**
 * @route GET /api/auth/me
 * @desc 現在のユーザー情報を取得
 * @access Private
 */
router.get('/me', authenticate, authController.me);


module.exports = router;
