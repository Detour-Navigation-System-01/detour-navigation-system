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

// 特定のユーザーを取得
const getUserById = async (req, res) => {
  try {
    const userId = parseInt(req.params.id);
    
    if (isNaN(userId)) {
      return res.status(400).json({
        status: 'error',
        message: '有効なユーザーIDを指定してください'
      });
    }
    
    console.log(`ユーザーID: ${userId} の情報を取得します`);
    const user = await User.findById(userId);
    
    if (!user) {
      return res.status(404).json({
        status: 'error',
        message: `ID: ${userId} のユーザーは見つかりませんでした`
      });
    }
    
    res.status(200).json({
      status: 'success',
      data: user
    });
  } catch (error) {
    console.error('ユーザー取得エラー:', error);
    res.status(500).json({
      status: 'error',
      message: 'ユーザー情報の取得に失敗しました'
    });
  }
};

// 新しいユーザーを作成
const createUser = async (req, res) => {
  try {
    const { username, email, password, first_name, last_name } = req.body;
    
    // 必須項目のバリデーション
    if (!username || !email || !password) {
      return res.status(400).json({
        status: 'error',
        message: 'ユーザー名、メール、パスワードは必須です'
      });
    }
    
    // メールアドレスの簡易バリデーション
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({
        status: 'error',
        message: '有効なメールアドレスを入力してください'
      });
    }
    
    console.log('新しいユーザーを作成します:', { username, email });
    
    const newUser = await User.create({
      username,
      email,
      password, // 実際のアプリではパスワードのハッシュ化が必要です
      first_name,
      last_name
    });
    
    res.status(201).json({
      status: 'success',
      message: 'ユーザーが正常に作成されました',
      data: newUser
    });
  } catch (error) {
    console.error('ユーザー作成エラー:', error);
    
    // 既存のユーザー名やメールの場合
    if (error.code === '23505') { // PostgreSQLの一意性制約違反コード
      return res.status(409).json({
        status: 'error',
        message: 'このユーザー名またはメールアドレスは既に使用されています'
      });
    }
    
    res.status(500).json({
      status: 'error',
      message: 'ユーザーの作成に失敗しました'
    });
  }
};

// ユーザー情報を更新
const updateUser = async (req, res) => {
  try {
    const userId = parseInt(req.params.id);
    
    if (isNaN(userId)) {
      return res.status(400).json({
        status: 'error',
        message: '有効なユーザーIDを指定してください'
      });
    }
    
    // 更新前にユーザーが存在するか確認
    const existingUser = await User.findById(userId);
    if (!existingUser) {
      return res.status(404).json({
        status: 'error',
        message: `ID: ${userId} のユーザーは見つかりませんでした`
      });
    }
    
    // 更新可能なフィールド
    const { username, email, first_name, last_name, password } = req.body;
    const updateData = {};
    
    // 指定されたフィールドのみ更新
    if (username !== undefined) updateData.username = username;
    if (email !== undefined) {
      // メールアドレスのバリデーション
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        return res.status(400).json({
          status: 'error',
          message: '有効なメールアドレスを入力してください'
        });
      }
      updateData.email = email;
    }
    if (first_name !== undefined) updateData.first_name = first_name;
    if (last_name !== undefined) updateData.last_name = last_name;
    if (password !== undefined) updateData.password = password; // 実際のアプリではハッシュ化が必要
    
    console.log(`ユーザーID: ${userId} の情報を更新します`);
    const updatedUser = await User.update(userId, updateData);
    
    res.status(200).json({
      status: 'success',
      message: 'ユーザー情報が正常に更新されました',
      data: updatedUser
    });
  } catch (error) {
    console.error('ユーザー更新エラー:', error);
    
    // 既存のユーザー名やメールの場合
    if (error.code === '23505') { // PostgreSQLの一意性制約違反コード
      return res.status(409).json({
        status: 'error',
        message: 'このユーザー名またはメールアドレスは既に使用されています'
      });
    }
    
    res.status(500).json({
      status: 'error',
      message: 'ユーザー情報の更新に失敗しました'
    });
  }
};

// ユーザーを削除
const deleteUser = async (req, res) => {
  try {
    const userId = parseInt(req.params.id);
    
    if (isNaN(userId)) {
      return res.status(400).json({
        status: 'error',
        message: '有効なユーザーIDを指定してください'
      });
    }
    
    // 削除前にユーザーが存在するか確認
    const existingUser = await User.findById(userId);
    if (!existingUser) {
      return res.status(404).json({
        status: 'error',
        message: `ID: ${userId} のユーザーは見つかりませんでした`
      });
    }
    
    console.log(`ユーザーID: ${userId} を削除します`);
    const isDeleted = await User.delete(userId);
    
    if (isDeleted) {
      res.status(200).json({
        status: 'success',
        message: `ID: ${userId} のユーザーが正常に削除されました`
      });
    } else {
      res.status(500).json({
        status: 'error',
        message: 'ユーザーの削除に失敗しました'
      });
    }
  } catch (error) {
    console.error('ユーザー削除エラー:', error);
    res.status(500).json({
      status: 'error',
      message: 'ユーザーの削除中にエラーが発生しました'
    });
  }
};

module.exports = {
  getAllUsers,
  getUserById,
  createUser,
  updateUser,
  deleteUser
};