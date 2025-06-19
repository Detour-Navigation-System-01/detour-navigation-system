// backend/src/controllers/userController.js
const User = require('../models/User');

// ユーザー一覧を取得
const getAllUsers = async (req, res) => {
  try {
    console.log('ユーザー一覧取得処理を開始します');
    
    const users = await User.findAll();
    console.log(`${users.length}人のユーザーを取得しました`);
    res.status(200).json({
      status: 'success',
      data: users
    });
  } catch (error) {
    console.error('ユーザー一覧取得エラー:', error);
    res.status(500).json({
      status: 'error',
      message: 'ユーザー一覧の取得に失敗しました'
    });
  }
};

module.exports = {
  getAllUsers
};