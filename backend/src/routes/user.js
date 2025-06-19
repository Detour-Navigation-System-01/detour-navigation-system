// backend/src/routes/user.js
const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');

// ユーザー一覧を取得
router.get('/users', userController.getAllUsers);

module.exports = router;