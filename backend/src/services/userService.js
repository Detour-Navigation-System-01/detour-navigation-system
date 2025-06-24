// backend/src/services/userService.js

const User = require('../models/User');
const userRepository = require('../repositories/UserRepository');
const { AppError } = require('../middleware/errorHandler');

/**
 * ユーザー関連のビジネスロジックを提供するサービス
 */

//レスポンスから特定のフィールドを除外
//DBに残したまま、クライアントには返さないようにする。
function sanitizeUser(user) {
  const { first_name, last_name, created_at, updated_at, ...rest } = user;
  return rest;
}

class UserService {
  constructor() {
    this.userRepository = userRepository;
  }

  /**
   * 全ユーザーリストを取得
   * @param {Object} options - 取得オプション（ソート、ページネーションなど）
   * @returns {Promise<Object>} ユーザーオブジェクトの配列と総数
   */
  async getAllUsers(options = {}) {
    try {
      const { filters = {}, ...otherOptions } = options;
      
      // ユーザー取得とカウント
      const users = await this.userRepository.findAll(options);
      const total = await this.userRepository.count(filters);
      
      // ここで整形
    const sanitizedUsers = users.map(sanitizeUser);


      return {
        data: sanitizedUsers,
        //data: users,
        total
      };
    } catch (error) {
      console.error('ユーザー一覧取得エラー:', error);
      throw new AppError('ユーザー一覧の取得に失敗しました', 500);
    }
  }

  /**
   * IDによるユーザー取得
   * @param {number} userId - ユーザーID
   * @returns {Promise<Object>} ユーザーオブジェクト
   * @throws {AppError} ユーザーが見つからない場合
   */
  async getUserById(userId) {
    try {
      const user = await User.findById(userId);
      if (!user) {
        throw new AppError(`ID: ${userId} のユーザーは見つかりませんでした`, 404);
      }
      return sanitizeUser(user);
      //return user;
    } catch (error) {
      if (error instanceof AppError) throw error;
      console.error(`ユーザー取得エラー (ID: ${userId}):`, error);
      throw new AppError('ユーザーの取得に失敗しました', 500);
    }
  }

  /**
   * ユーザー名またはメールアドレスでユーザーを検索
   * @param {string} identifier - ユーザー名またはメールアドレス
   * @returns {Promise<Object>} ユーザーオブジェクト
   * @throws {AppError} ユーザーが見つからない場合
   */
  async getUserByIdentifier(identifier) {
    try {
      const user = await User.findByUsernameOrEmail(identifier);
      if (!user) {
        throw new AppError(`ユーザー "${identifier}" は見つかりませんでした`, 404);
      }
      return user;
    } catch (error) {
      if (error instanceof AppError) throw error;
      console.error('ユーザー検索エラー:', error);
      throw new AppError('ユーザーの検索に失敗しました', 500);
    }
  }

  /**
   * 新しいユーザーを作成
   * @param {Object} userData - ユーザーデータ
   * @returns {Promise<Object>} 作成されたユーザー
   */
  async createUser(userData) {
    try {
      // ユーザー名とメールアドレスの重複チェック
      const existingUser = await userRepository.findByCriteria({
        username: userData.username
      });
      
      if (existingUser.length > 0) {
        throw new AppError('このユーザー名は既に使用されています', 409);
      }
      
      const existingEmail = await userRepository.findByCriteria({
        email: userData.email
      });
      
      if (existingEmail.length > 0) {
        throw new AppError('このメールアドレスは既に使用されています', 409);
      }
      
      return await User.create(userData);
    } catch (error) {
      if (error instanceof AppError) throw error;
      console.error('ユーザー作成エラー:', error);
      throw new AppError('ユーザーの作成に失敗しました', 500);
    }
  }

  /**
   * ユーザー情報を更新
   * @param {number} userId - ユーザーID
   * @param {Object} updateData - 更新データ
   * @returns {Promise<Object>} 更新されたユーザー
   */
  async updateUser(userId, updateData) {
    try {
      // ユーザーの存在確認
      const existingUser = await this.getUserById(userId);
      
      // ユーザー名の変更がある場合、重複チェック
      if (updateData.username && updateData.username !== existingUser.username) {
        const duplicateUsername = await userRepository.findByCriteria({
          username: updateData.username
        });
        
        if (duplicateUsername.length > 0) {
          throw new AppError('このユーザー名は既に使用されています', 409);
        }
      }
      
      // メールアドレスの変更がある場合、重複チェック
      if (updateData.email && updateData.email !== existingUser.email) {
        const duplicateEmail = await userRepository.findByCriteria({
          email: updateData.email
        });
        
        if (duplicateEmail.length > 0) {
          throw new AppError('このメールアドレスは既に使用されています', 409);
        }
      }
      
      return await User.update(userId, updateData);
    } catch (error) {
      if (error instanceof AppError) throw error;
      console.error(`ユーザー更新エラー (ID: ${userId}):`, error);
      throw new AppError('ユーザー情報の更新に失敗しました', 500);
    }
  }

  /**
   * ユーザーを削除
   * @param {number} userId - ユーザーID
   * @returns {Promise<boolean>} 削除が成功したかどうか
   */
  async deleteUser(userId) {
    try {
      // ユーザーの存在確認
      await this.getUserById(userId);
      
      return await User.delete(userId);
    } catch (error) {
      if (error instanceof AppError) throw error;
      console.error(`ユーザー削除エラー (ID: ${userId}):`, error);
      throw new AppError('ユーザーの削除に失敗しました', 500);
    }
  }

  /**
   * ユーザー認証
   * @param {string} identifier - ユーザー名またはメールアドレス
   * @param {string} password - パスワード
   * @returns {Promise<Object>} 認証されたユーザー情報（パスワードを除く）
   */
  async authenticateUser(identifier, password) {
    try {
      const user = await User.authenticate(identifier, password);
      if (!user) {
        throw new AppError('ユーザー名・メールアドレスまたはパスワードが正しくありません', 401);
      }
      return user;
    } catch (error) {
      if (error instanceof AppError) throw error;
      console.error('認証エラー:', error);
      throw new AppError('認証に失敗しました', 500);
    }
  }
}

// シングルトンとしてエクスポート
module.exports = new UserService();
