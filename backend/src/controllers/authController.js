// backend/src/controllers/authController.js

const BaseController = require('./BaseController');
const { catchAsync, AppError } = require('../middleware/errorHandler');
const authService = require('../services/authService');

/**
 * 認証コントローラークラス
 * 認証関連のリクエストを処理
 */
class AuthController extends BaseController {
  constructor() {
    super('auth'); // リソース名を指定して基底クラスのコンストラクタを呼び出す
  }

  /**
   * ユーザーログイン
   */
  login = catchAsync(async (req, res) => {
    const { username, email, password } = req.body;
    const identifier = username || email;

    console.log(`ユーザー認証を試行します: ${identifier}`);
    const result = await authService.login(identifier, password);

    // JWTをCookieにセット
    res.cookie('token', result.token, {
      httpOnly: true,
      secure: true,
      sameSite: 'lax',
      path: '/',
      maxAge: 1000 * 60 * 60 
    });

    return this.sendSuccess(res, {
      message: 'ログインに成功しました',
      data: { user: result.user } // tokenは送らない（セキュリティ向上）
    });
  });

  /**
   * ユーザー登録
   */
  register = catchAsync(async (req, res) => {
    const { username, email, password, first_name, last_name } = req.body;
    
    console.log(`新規ユーザー登録を開始します: ${username}`);
    const result = await authService.register({
      username,
      email,
      password,
      first_name,
      last_name
    });
    
    return this.sendSuccess(res, {
      statusCode: 201,
      message: 'ユーザー登録が完了しました',
      data: result
    });
  });

  /**
   * パスワード変更
   */
  changePassword = catchAsync(async (req, res, next) => {
    const userId = req.parsedId || req.user?.id; // JWT認証の場合はreq.user.idを使用
    const { currentPassword, newPassword } = req.body;
    
    if (!currentPassword || !newPassword) {
      return this.sendError(res, {
        statusCode: 400,
        message: '現在のパスワードと新しいパスワードが必要です'
      });
    }
    
    console.log(`ユーザーID: ${userId} のパスワード変更を開始します`);
    await authService.changePassword(userId, currentPassword, newPassword);
    
    return this.sendSuccess(res, {
      message: 'パスワードが正常に変更されました'
    });
  });

  me = catchAsync(async (req, res) => {
    const user = req.user;
    if (!user) {
      return this.sendError(res, { statusCode: 401, message: '未認証のユーザーです' });
    }

    return this.sendSuccess(res, {
      message: '現在のユーザー情報を返します',
      data: { user },
    });
  });

    /**
   * ユーザーログアウト
   */
  logout = catchAsync(async (req, res) => {
    res.clearCookie('token', {
      httpOnly: true,
      secure: true,
      sameSite: 'lax',
      path: '/', // 必須！ログイン時と同じpathにすること
    });
    return this.sendSuccess(res, {
      message: 'ログアウトしました'
    });
  });
  
}



// シングルトンインスタンスとしてエクスポート
module.exports = new AuthController();
