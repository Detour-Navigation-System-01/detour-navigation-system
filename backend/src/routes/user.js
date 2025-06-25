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
router.get('/', userController.getAllUsers);

// 特定のユーザーを取得
router.get('/:id', validateIdParam, userController.getUserById);

// 新しいユーザーを作成
router.post('/', validateUserData, userController.createUser);

// ユーザー情報を更新
router.put('/:id', validateIdParam, validateUserData, userController.updateUser);

// ユーザーを削除
router.delete('/:id', validateIdParam, userController.deleteUser);

module.exports = router;