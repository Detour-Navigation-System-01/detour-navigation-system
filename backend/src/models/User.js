/**
 * @fileoverview ユーザービジネスモデル
 * @description ユーザー関連のビジネスロジックを扱うモデルクラス。データアクセスはリポジトリに委譲し、ビジネスルールを集中管理する。
 * @author 笠置啓太
 * @created 2025-06-17
 * @updated 2025-07-01
 * @version 1.1.0
 */

// backend/src/models/User.js
/**
 * ユーザーのビジネスモデル
 * データアクセスはリポジトリに委譲し、ビジネスロジックに集中する
 */
const userRepository = require('../repositories/UserRepository');

class User {  /**
   * 新しいユーザーを作成
   * @param {Object} userData - ユーザーデータ
   * @returns {Promise<Object>} 作成されたユーザーオブジェクト
   */
  static async create(userData) {
    // パスワードハッシュ化はUserRepositoryで処理されるため、
    // ここでは追加のビジネスロジックのみ実装する
    
    return userRepository.create(userData);
  }
  
  /**
   * IDでユーザーを検索
   * @param {number} id - ユーザーID
   * @returns {Promise<Object|null>} ユーザーオブジェクトまたはnull
   */
  static async findById(id) {
    return userRepository.findById(id);
  }
  
  /**
   * ユーザー名またはメールアドレスでユーザーを検索
   * @param {string} identifier - ユーザー名またはメールアドレス
   * @returns {Promise<Object|null>} ユーザーオブジェクトまたはnull
   */
  static async findByUsernameOrEmail(identifier) {
    return userRepository.findByUsernameOrEmail(identifier);
  }
  
  /**
   * すべてのユーザーを取得
   * @returns {Promise<Array>} ユーザーオブジェクトの配列
   */
  static async findAll(options = {}) {
    return userRepository.findAll(options);
  }
  
  /**
   * ユーザー情報を更新
   * @param {number} id - ユーザーID
   * @param {Object} userData - 更新するユーザーデータ
   * @returns {Promise<Object|null>} 更新されたユーザーオブジェクトまたはnull
   */
  static async update(id, userData) {
    // 更新可能なフィールドのバリデーション（ビジネスルールとして）
    const allowedFields = ['username', 'email', 'first_name', 'last_name', 'password', 'public_settings', 'image_url'];
    const updateData = {};
    
    // 許可されたフィールドのみを抽出
    for (const [key, value] of Object.entries(userData)) {
      if (allowedFields.includes(key) && value !== undefined) {
        updateData[key] = value;
      }
    }
    
    if (Object.keys(updateData).length === 0) {
      return null; // 更新するフィールドがない
    }
    
    return userRepository.update(id, updateData);
  }
  
  /**
   * ユーザーのプロフィール画像を更新
   * @param {number} id - ユーザーID
   * @param {string} imageUrl - 画像のURL
   * @returns {Promise<Object|null>} 更新されたユーザーオブジェクト
   */
  static async updateProfileImage(id, imageUrl) {
    return userRepository.updateProfileImage(id, imageUrl);
  }
  
  /**
   * ユーザーを削除
   * @param {number} id - ユーザーID
   * @returns {Promise<boolean>} 削除が成功したかどうか
   */
  static async delete(id) {
    return userRepository.delete(id);
  }
    /**
   * 特定の条件でユーザーを検索
   * @param {Object} criteria - 検索条件
   * @returns {Promise<Array>} ユーザーオブジェクトの配列
   */
  static async findByCriteria(criteria) {
    return userRepository.findByCriteria(criteria);
  }
  
  /**
   * パスワード検証付きでユーザー認証
   * @param {string} identifier - ユーザー名またはメールアドレス
   * @param {string} password - パスワード（平文）
   * @returns {Promise<Object|null>} 認証成功時はユーザーオブジェクト、失敗時はnull
   */
  static async authenticate(identifier, password) {
    return userRepository.authenticate(identifier, password);
  }
}

module.exports = User;