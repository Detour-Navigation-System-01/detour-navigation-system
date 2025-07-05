// backend/src/routes/user.js
/**
 * @fileoverview ユーザー関連APIルート
 * @description ユーザー管理に関するエンドポイントを定義（登録、認証、更新、削除など）
 * @author 中西陽之介
 * @created 2025-06-15
 * @updated 2025-07-05
 * @version 1.1.0
 */

const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const { validateUserData, validateIdParam } = require('../middleware/validation');
const authenticate = require('../middleware/auth'); // 認証ミドルウェアのインポート
const { uploadImage } = require('../middleware/uploadMiddleware'); // 画像アップロードミドルウェアのインポート

/**
 * ユーザー管理API
 * @route /api/users
 */

// ユーザー一覧を取得（管理者向け - JWT認証必須）
router.get('/', authenticate, userController.getAllUsers);

// 特定のユーザーを取得（JWT認証必須）
router.get('/:id', authenticate, validateIdParam, userController.getUserById);

// 新しいユーザーを作成（公開 - 登録画面用）
router.post('/', validateUserData, userController.createUser);

// ユーザー情報を更新（JWT認証必須）
router.put('/:id', authenticate, validateIdParam, validateUserData, userController.updateUser);

// ユーザーを削除（JWT認証必須）
router.delete('/:id', authenticate, validateIdParam, userController.deleteUser);

// プロフィール画像をアップロード（JWT認証必須）
router.post('/profile-image', authenticate, uploadImage, userController.uploadProfileImage);

module.exports = router;