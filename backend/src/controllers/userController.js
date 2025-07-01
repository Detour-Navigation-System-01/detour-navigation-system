// backend/src/controllers/userController.js
const BaseController = require('./BaseController');
const { catchAsync } = require('../middleware/errorHandler');
const userService = require('../services/userService');

/**
 * ユーザーコントローラークラス
 * ユーザー関連のリクエストを処理
 */
class UserController extends BaseController {
  constructor() {
    super('user'); // リソース名を指定して基底クラスのコンストラクタを呼び出す
  }

  /**
   * ユーザー一覧を取得
   */
  getAllUsers = catchAsync(async (req, res) => {
    console.log('ユーザー一覧取得処理を開始します');
    
    // クエリパラメータからオプションを取得
    const { page, limit, offset } = this.getPaginationOptions(req.query);
    const { sort, direction } = this.getSortOptions(req.query, 'created_at');
    const filters = this.getFilterOptions(req.query, ['username', 'email', 'first_name', 'last_name']);
    
    // サービスにオプションを渡してユーザー取得
    const options = { 
      orderBy: sort, 
      direction, 
      limit, 
      offset, 
      filters 
    };
    
    const result = await userService.getAllUsers(options);
    const users = result.data;
    
    console.log(`${users.length}人のユーザーを取得しました`);
    
    // 成功レスポンスを送信
    return this.sendSuccess(res, {
      message: 'ユーザー一覧を取得しました',
      data: users,
      meta: this.createPaginationMeta(result.total, page, limit)
    });
  });

  /**
   * 特定のユーザーを取得
   */
  getUserById = catchAsync(async (req, res) => {
    // validateIdParamミドルウェアで検証済みのIDを使用
    const userId = req.parsedId;
    
    console.log(`ユーザーID: ${userId} の情報を取得します`);
    const user = await userService.getUserById(userId);
    
    // 成功レスポンスを送信
    return this.sendSuccess(res, {
      message: `ユーザーID: ${userId} の情報を取得しました`,
      data: user
    });
  });

  /**
   * 新しいユーザーを作成
   */
  createUser = catchAsync(async (req, res) => {
    const { username, email, password, first_name, last_name, public_settings, profile_image } = req.body;

    console.log('新しいユーザーを作成します:', { username, email, public_settings, profile_image }); // ← デバッグにも追加

    const newUser = await userService.createUser({
      username,
      email,
      password,
      first_name,
      last_name,
      public_settings,
      profile_image  // ← これを追加！
    });

    
    // 成功レスポンスを送信
    return this.sendSuccess(res, {
      statusCode: 201,
      message: 'ユーザーが正常に作成されました',
      data: newUser
    });
  });

  /**
   * ユーザー情報を更新
   */
  updateUser = catchAsync(async (req, res) => {
    const userId = req.parsedId;
    
    // 更新可能なフィールド
    const { username, email, first_name, last_name, password, public_settings } = req.body; // ← public_settingsを追加
    const updateData = {};
    
    // 指定されたフィールドのみ更新
    if (username !== undefined) updateData.username = username;
    if (email !== undefined) updateData.email = email;
    if (first_name !== undefined) updateData.first_name = first_name;
    if (last_name !== undefined) updateData.last_name = last_name;
    if (password !== undefined) updateData.password = password; // パスワードハッシュ化はサービス→リポジトリで処理
    if (public_settings !== undefined) updateData.public_settings = public_settings; // ← public_settingsを追加

    
    console.log(`ユーザーID: ${userId} の情報を更新します`);
    const updatedUser = await userService.updateUser(userId, updateData);
    
    // 成功レスポンスを送信
    return this.sendSuccess(res, {
      message: 'ユーザー情報が正常に更新されました',
      data: updatedUser
    });
  });

  /**
   * ユーザーを削除
   */
  deleteUser = catchAsync(async (req, res) => {
    const userId = req.parsedId;
    
    console.log(`ユーザーID: ${userId} を削除します`);
    await userService.deleteUser(userId);
    
    // 成功レスポンスを送信
    return this.sendSuccess(res, {
      message: `ID: ${userId} のユーザーが正常に削除されました`
    });
  });
}

// シングルトンインスタンスとしてエクスポート
module.exports = new UserController();