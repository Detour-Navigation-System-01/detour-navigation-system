// backend/src/controllers/userController.js
const User = require('../models/User');
const { catchAsync, AppError } = require('../middleware/errorHandler');

// ユーザー一覧を取得
const getAllUsers = catchAsync(async (req, res) => {
  console.log('ユーザー一覧取得処理を開始します');
  
  const users = await User.findAll();
  console.log(`${users.length}人のユーザーを取得しました`);
  
  res.status(200).json({
    status: 'success',
    data: users
  });
});

// 特定のユーザーを取得
const getUserById = catchAsync(async (req, res, next) => {
  // validateIdParamミドルウェアで検証済みのIDを使用
  const userId = req.parsedId;
  
  console.log(`ユーザーID: ${userId} の情報を取得します`);
  const user = await User.findById(userId);
  
  if (!user) {
    return next(new AppError(`ID: ${userId} のユーザーは見つかりませんでした`, 404));
  }
  
  res.status(200).json({
    status: 'success',
    data: user
  });
});

// 新しいユーザーを作成
const createUser = catchAsync(async (req, res) => {
  const { username, email, password, first_name, last_name } = req.body;
  
  // バリデーションはvalidateUserDataミドルウェアで実行済み
  
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
});

// ユーザー情報を更新
const updateUser = catchAsync(async (req, res, next) => {
  const userId = req.parsedId;
  
  // 更新前にユーザーが存在するか確認
  const existingUser = await User.findById(userId);
  if (!existingUser) {
    return next(new AppError(`ID: ${userId} のユーザーは見つかりませんでした`, 404));
  }
  
  // 更新可能なフィールド
  const { username, email, first_name, last_name, password } = req.body;
  const updateData = {};
  
  // 指定されたフィールドのみ更新
  if (username !== undefined) updateData.username = username;
  if (email !== undefined) updateData.email = email;
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
});

// ユーザーを削除
const deleteUser = catchAsync(async (req, res, next) => {
  const userId = req.parsedId;
  
  // 削除前にユーザーが存在するか確認
  const existingUser = await User.findById(userId);
  if (!existingUser) {
    return next(new AppError(`ID: ${userId} のユーザーは見つかりませんでした`, 404));
  }
  
  console.log(`ユーザーID: ${userId} を削除します`);
  const isDeleted = await User.delete(userId);
  
  if (!isDeleted) {
    return next(new AppError('ユーザーの削除に失敗しました', 500));
  }
  
  res.status(200).json({
    status: 'success',
    message: `ID: ${userId} のユーザーが正常に削除されました`
  });
});

module.exports = {
  getAllUsers,
  getUserById,
  createUser,
  updateUser,
  deleteUser
};