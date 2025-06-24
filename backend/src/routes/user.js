// backend/src/routes/user.js
// どのURLでどのHTTPメソッドを受け付けるかの対応だけ
const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const { validateUserData, validateIdParam } = require('../middleware/validation');

/**
 * ユーザー管理API
 * @route /api/users
 */

// ユーザー一覧を取得
router.get('/users', userController.getAllUsers);

// 特定のユーザーを取得
router.get('/users/:id', validateIdParam, userController.getUserById);

// 新しいユーザーを作成
router.post('/users', validateUserData, userController.createUser);

// ユーザー情報を更新
router.put('/users/:id', validateIdParam, validateUserData, userController.updateUser);

// ユーザーを削除
router.delete('/users/:id', validateIdParam, userController.deleteUser);

module.exports = router;