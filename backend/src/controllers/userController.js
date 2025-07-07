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
   * 特定のユーザーを取得（自分自身または管理者のみアクセス可能）
   */
  getUserById = catchAsync(async (req, res) => {
    // validateIdParamミドルウェアで検証済みのIDを使用
    const userId = req.parsedId;
    // JWTから現在認証されているユーザーのIDを取得
    const authenticatedUserId = req.user?.id;
    
    // 自分以外のユーザー情報へのアクセスをチェック（管理者権限チェックは今後実装）
    if (authenticatedUserId !== userId) {
      console.log(`認証ユーザーID: ${authenticatedUserId} が別のユーザーID: ${userId} の情報にアクセスしようとしています`);
      // TODO: 管理者権限チェックを追加
      // 現在は管理者機能未実装のため、自分自身の情報のみ取得可能
      return this.sendError(res, {
        statusCode: 403,
        message: '他のユーザーの情報にアクセスする権限がありません'
      });
    }
    
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
    const { username, email, password, first_name, last_name, public_settings } = req.body; // ← public_settingsを追加
    
    console.log('新しいユーザーを作成します:', { username, email, public_settings }); // ← public_settingsを追加
    
    const newUser = await userService.createUser({
      username,
      email,
      password, // パスワードのハッシュ化はサービス→リポジトリで処理
      first_name,
      last_name,
      public_settings  // ← 追加
    });
    
    // 成功レスポンスを送信
    return this.sendSuccess(res, {
      statusCode: 201,
      message: 'ユーザーが正常に作成されました',
      data: newUser
    });
  });

  /**
   * ユーザー情報を更新（自分自身または管理者のみ）
   */
  updateUser = catchAsync(async (req, res) => {
    const userId = req.parsedId;
    // JWTから現在認証されているユーザーのIDを取得
    const authenticatedUserId = req.user?.id;
    
    // 自分以外のユーザー情報の更新をチェック
    if (authenticatedUserId !== userId) {
      console.log(`認証ユーザーID: ${authenticatedUserId} が別のユーザーID: ${userId} の情報を更新しようとしています`);
      // TODO: 管理者権限チェックを追加
      return this.sendError(res, {
        statusCode: 403,
        message: '他のユーザーの情報を更新する権限がありません'
      });
    }
    
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
   * ユーザーを削除（自分自身または管理者のみ）
   */
  deleteUser = catchAsync(async (req, res) => {
    const userId = req.parsedId;
    // JWTから現在認証されているユーザーのIDを取得
    const authenticatedUserId = req.user?.id;
    
    // 自分以外のユーザーの削除をチェック
    if (authenticatedUserId !== userId) {
      console.log(`認証ユーザーID: ${authenticatedUserId} が別のユーザーID: ${userId} を削除しようとしています`);
      // TODO: 管理者権限チェックを追加
      return this.sendError(res, {
        statusCode: 403,
        message: '他のユーザーを削除する権限がありません'
      });
    }
    
    console.log(`ユーザーID: ${userId} を削除します`);
    await userService.deleteUser(userId);
    
    // 成功レスポンスを送信
    return this.sendSuccess(res, {
      message: `ID: ${userId} のユーザーが正常に削除されました`
    });
  });

  /**
   * ユーザープロフィール画像をアップロード
   */
  uploadProfileImage = catchAsync(async (req, res) => {
    // 認証ユーザーIDの確認
    const userId = req.user?.id;
    if (!userId) {
      return this.sendError(res, {
        statusCode: 401,
        message: '認証されていないユーザーです'
      });
    }
    
    // uploadImageミドルウェアがreq.fileにファイル情報をセットしてくれる
    if (!req.file) {
      return this.sendError(res, {
        statusCode: 400,
        message: '画像ファイルがアップロードされていません'
      });
    }

    const fileName = req.file.filename;
    const fileSize = req.file.size;
    
    // クライアントがアクセスするための完全なURLを構築
    const imageUrl = `https://${req.get('host')}/images/${fileName}`;

    try {
      // プロフィール画像URLをユーザーレコードに更新
      const updatedUser = await userService.updateProfileImage(userId, imageUrl);
      
      // 成功レスポンスを送信
      return this.sendSuccess(res, {
        message: 'プロフィール画像のアップロードに成功しました',
        data: {
          user: updatedUser,
          image: {
            fileName: fileName,
            imageUrl: imageUrl,
            path: `/images/${fileName}`,
            fileSize: fileSize,
            fileSizeInMB: (fileSize / (1024 * 1024)).toFixed(2) + ' MB',
            mimeType: req.file.mimetype
          }
        }
      });
    } catch (error) {
      return this.sendError(res, {
        statusCode: error.statusCode || 500,
        message: error.message || 'プロフィール画像の更新中にエラーが発生しました'
      });
    }
  });
}

// シングルトンインスタンスとしてエクスポート
module.exports = new UserController();
