// backend/src/services/authService.js

const userService = require('./userService');
const { AppError } = require('../middleware/errorHandler');
const tokenBlacklistRepo = require('../repositories/TokenBlacklistRepository');
const jwt = require('jsonwebtoken');
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

/**
 * 認証関連の機能を提供するサービス
 */
class AuthService {
  /**
   * ユーザーログイン処理
   * @param {string} identifier - ユーザー名またはメールアドレス
   * @param {string} password - パスワード
   * @returns {Promise<Object>} 認証されたユーザー
   */
  async login(identifier, password) {
    if (!identifier || !password) {
      throw new AppError('ユーザー名/メールアドレスとパスワードを入力してください', 400);
    }
    
    try {
      const user = await userService.authenticateUser(identifier, password);
      
      // ここでJWTトークンの生成などを行うこともできる（将来的に実装予定）
      const token = jwt.sign(
        {id: user.id,username: user.username},
        JWT_SECRET,
        {expiresIn: '1h'}
      )
      return {
        user,
        // token: generatedToken
        token
      };
    } catch (error) {
      // ログイン失敗時に詳細なエラーを表示しないようにする（セキュリティ強化）
      throw new AppError('ログインに失敗しました。認証情報を確認してください', 401);
    }
  }
  
  /**
   * ユーザー登録
   * @param {Object} userData - ユーザーデータ
   * @returns {Promise<Object>} 作成されたユーザー
   */
  async register(userData) {
    // 必須フィールドの検証
    const requiredFields = ['username', 'email', 'password'];
    const missingFields = requiredFields.filter(field => !userData[field]);
    
    if (missingFields.length > 0) {
      throw new AppError(`以下の必須フィールドが不足しています: ${missingFields.join(', ')}`, 400);
    }
    
    // パスワード強度チェックなどのバリデーション（将来的に実装）
    
    // ユーザーの作成（重複チェックなどはuserServiceで実行）
    try {
      const newUser = await userService.createUser(userData);
      
      return {
        user: newUser,
        // token: generatedToken // JWTトークンを使う場合
      };
    } catch (error) {
      if (error instanceof AppError) throw error;
      throw new AppError('ユーザー登録に失敗しました', 500);
    }
  }
  
  /**
   * パスワード変更
   * @param {number} userId - ユーザーID
   * @param {string} currentPassword - 現在のパスワード
   * @param {string} newPassword - 新しいパスワード
   * @returns {Promise<Object>} 更新されたユーザー
   */
  async changePassword(userId, currentPassword, newPassword) {
    try {
      // ユーザーの取得と現在のパスワード検証
      const user = await userService.getUserById(userId);
      
      // ユーザーのidentifier（メール）と現在のパスワードで認証
      const authenticated = await userService.authenticateUser(user.email, currentPassword);
      
      if (!authenticated) {
        throw new AppError('現在のパスワードが正しくありません', 401);
      }
      
      // パスワードの強度チェックなど（将来的に実装）
      
      // パスワード更新
      return await userService.updateUser(userId, { password: newPassword });
    } catch (error) {
      if (error instanceof AppError) throw error;
      throw new AppError('パスワード変更に失敗しました', 500);
    }
  }

    /**
   * ユーザー情報取得
   * @param {number} userId - ユーザーID
   * @returns {Promise<Object>} ユーザー情報
   */
  async getUserById(userId) {
    const user = await userService.getUserById(userId);
    if (!user) {
      throw new AppError('ユーザーが見つかりません', 404);
    }
    return user;
  }

  /**
   * トークンを無効化（ブラックリストに追加）
   * @param {string} token - 無効化するJWTトークン
   * @param {Object} user - トークンのペイロード（デコード済み）
   * @returns {Promise<Object>} 無効化されたトークン情報
   */
  async invalidateToken(token, user) {
    try {
      // トークンのデコード（有効期限などの情報を取得）
      const decoded = jwt.decode(token);
      if (!decoded) {
        throw new AppError('無効なトークンです', 400);
      }
      
      // ブラックリストに追加
      return await tokenBlacklistRepo.addToBlacklist(token, decoded);
    } catch (error) {
      console.error('トークン無効化エラー:', error);
      throw error;
    }
  }

  /**
   * ユーザーのすべてのトークンを無効化（ブラックリストに追加）
   * @param {number} userId - 無効化するユーザーのID
   * @returns {Promise<Object>} 無効化されたトークン情報
   */
  async invalidateAllUserTokens(userId) {
    try {
      // ユーザーIDの存在確認
      await userService.getUserById(userId);
      
      // トークンのデフォルト有効期限を現在から24時間後に設定
      // （通常のトークン有効期限より十分長くする）
      const expiresAt = new Date();
      expiresAt.setHours(expiresAt.getHours() + 24);
      
      // ブラックリストに追加
      return await tokenBlacklistRepo.blacklistAllUserTokens(userId, expiresAt);
    } catch (error) {
      console.error(`ユーザーID: ${userId} のトークン無効化エラー:`, error);
      throw error;
    }
  }
}





// シングルトンとしてエクスポート
module.exports = new AuthService();
