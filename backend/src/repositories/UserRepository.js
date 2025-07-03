/**
 * @fileoverview ユーザーデータリポジトリ
 * @description ユーザーデータベーステーブルへのアクセス処理を担当。パスワードのハッシュ化やユーザー認証も含む。
 * @author 笠置啓太
 * @created 2025-06-17
 * @updated 2025-07-01
 * @version 1.2.0
 */


// backend/src/repositories/UserRepository.js

const BaseRepository = require('./BaseRepository');
const pool = require('../utils/db');
// bcryptのインポート
const bcrypt = require('bcrypt');

/**
 * ユーザーデータへのアクセスを担当するリポジトリ
 */
class UserRepository extends BaseRepository {
  constructor() {
    super(pool, 'users'); // ベースリポジトリを継承し、テーブル名を指定
    this.saltRounds = 10; // bcryptのソルトラウンド数
  }
  
  /**
   * 条件に基づいてユーザーを検索
   * @param {Object} options - 検索オプション
   * @returns {Promise<Array>} 検索結果
   */
  async findAll(options = {}) {
    const { 
      orderBy = 'created_at', 
      direction = 'DESC', 
      limit = 10, 
      offset = 0,
      filters = {} 
    } = options;
    
    // フィルター条件の構築
    const filterConditions = [];
    const queryParams = [];
    let paramCounter = 1;
    
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        // テキストフィールドは部分一致で検索
        if (['username', 'email', 'first_name', 'last_name'].includes(key)) {
          filterConditions.push(`${key} ILIKE $${paramCounter}`);
          queryParams.push(`%${value}%`);
        } else {
          filterConditions.push(`${key} = $${paramCounter}`);
          queryParams.push(value);
        }
        paramCounter++;
      }
    });
    
    // クエリの構築
    let query = `SELECT * FROM ${this.tableName}`;
    
    if (filterConditions.length > 0) {
      query += ` WHERE ${filterConditions.join(' AND ')}`;
    }
    
    query += ` ORDER BY ${orderBy} ${direction}`;
    
    if (limit) {
      query += ` LIMIT $${paramCounter++}`;
      queryParams.push(limit);
    }
    
    if (offset) {
      query += ` OFFSET $${paramCounter++}`;
      queryParams.push(offset);
    }
    
    try {
      const result = await this.pool.query(query, queryParams);
      return result.rows;
    } catch (error) {
      console.error('ユーザー検索エラー:', error);
      throw error;
    }
  }
  
  /**
   * 条件に基づくユーザー数を取得
   * @param {Object} filters - フィルター条件
   * @returns {Promise<number>} ユーザー数
   */
  async count(filters = {}) {
    // フィルター条件の構築
    const filterConditions = [];
    const queryParams = [];
    let paramCounter = 1;
    
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        // テキストフィールドは部分一致で検索
        if (['username', 'email', 'first_name', 'last_name'].includes(key)) {
          filterConditions.push(`${key} ILIKE $${paramCounter}`);
          queryParams.push(`%${value}%`);
        } else {
          filterConditions.push(`${key} = $${paramCounter}`);
          queryParams.push(value);
        }
        paramCounter++;
      }
    });
    
    // クエリの構築
    let query = `SELECT COUNT(*) FROM ${this.tableName}`;
    
    if (filterConditions.length > 0) {
      query += ` WHERE ${filterConditions.join(' AND ')}`;
    }
    
    try {
      const result = await this.pool.query(query, queryParams);
      return parseInt(result.rows[0].count, 10);
    } catch (error) {
      console.error('ユーザー数取得エラー:', error);
      throw error;
    }
  }
  /**
   * ユーザー名またはメールアドレスでユーザーを検索
   * @param {string} identifier - ユーザー名またはメールアドレス
   * @returns {Promise<Object|null>} ユーザーオブジェクトまたはnull
   */
  async findByUsernameOrEmail(identifier) {
    try {
      const query = `
        SELECT *
        FROM ${this.tableName}
        WHERE username = $1 OR email = $1
      `;
      
      const result = await this.pool.query(query, [identifier]);
      return result.rows[0] || null;
    } catch (error) {
      console.error('ユーザー検索エラー:', error);
      throw error;
    }
  }
  
  /**
   * パスワードをハッシュ化
   * @param {string} password - 平文パスワード
   * @returns {Promise<string>} ハッシュ化されたパスワード
   */  async hashPassword(password) {
    // bcryptを使用してパスワードをハッシュ化
    return await bcrypt.hash(password, this.saltRounds);
  }
  
  /**
   * パスワードを検証
   * @param {string} password - 検証する平文パスワード
   * @param {string} hashedPassword - 保存されているハッシュ化パスワード
   * @returns {Promise<boolean>} 検証結果
   */  async verifyPassword(password, hashedPassword) {
    // bcryptを使用してハッシュ化されたパスワードと平文パスワードを比較
    return await bcrypt.compare(password, hashedPassword);
  }
  /**
   * パスワード検証付きでユーザー認証
   * @param {string} identifier - ユーザー名またはメールアドレス
   * @param {string} password - パスワード（平文）
   * @returns {Promise<Object|null>} 認証成功時はユーザーオブジェクト、失敗時はnull
   */
  async authenticate(identifier, password) {
    try {
      const user = await this.findByUsernameOrEmail(identifier);
      
      if (!user) return null;
      
      // verifyPasswordメソッドを使用してパスワードを検証
      const isPasswordValid = await this.verifyPassword(password, user.password);
      
      if (isPasswordValid) {
        // パスワードフィールドを除外
        const { password, ...secureUser } = user;
        return secureUser;
      }
      
      return null;
    } catch (error) {
      console.error('認証エラー:', error);
      throw error;
    }
  }
    /**
   * ユーザーの作成（パスワードハッシュ化付き）
   * @param {Object} userData - ユーザーデータ
   * @returns {Promise<Object>} 作成されたユーザー
   */
  async create(userData) {
    try {
      // パスワードをハッシュ化
      if (userData.password) {
        userData.password = await this.hashPassword(userData.password);
      }
      
      // ベースリポジトリのcreateメソッドを呼び出し
      return await super.create(userData);
    } catch (error) {
      console.error('ユーザー作成エラー:', error);
      throw error;
    }
  }
  
  /**
   * ユーザーの更新（パスワードハッシュ化付き）
   * @param {number} id - ユーザーID
   * @param {Object} userData - 更新データ
   * @returns {Promise<Object|null>} 更新されたユーザー
   */
  async update(id, userData) {
    try {
      // パスワードが含まれている場合はハッシュ化
      if (userData.password) {
        userData.password = await this.hashPassword(userData.password);
      }
      
      // ベースリポジトリのupdateメソッドを呼び出し
      return await super.update(id, userData);
    } catch (error) {
      console.error('ユーザー更新エラー:', error);
      throw error;
    }
  }
  
  /**
   * 特定の条件でユーザーを検索
   * @param {Object} criteria - 検索条件
   * @returns {Promise<Array>} ユーザーオブジェクトの配列
   */
  async findByCriteria(criteria) {
    try {
      const conditions = [];
      const values = [];
      let paramIndex = 1;
      
      // 検索条件を構築
      for (const [key, value] of Object.entries(criteria)) {
        conditions.push(`${key} = $${paramIndex}`);
        values.push(value);
        paramIndex++;
      }
      
      const whereClause = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';
      
      const query = `
        SELECT id, username, email, first_name, last_name, created_at, updated_at, public_settings
        FROM ${this.tableName}
        ${whereClause}
        ORDER BY created_at DESC
      `;
      
      const result = await this.pool.query(query, values);
      return result.rows;
    } catch (error) {
      console.error('ユーザー検索エラー:', error);
      throw error;
    }
  }
  
  /**
   * オーバーライド: 全ユーザーを取得するが、パスワードを除外
   */
  async findAll(options = {}) {
    try {
      const { orderBy = 'created_at', direction = 'DESC', limit = null } = options;
      
      
      // 変更後（public_settings を追加）
      let query = `
        SELECT id, username, email, first_name, last_name, created_at, updated_at, public_settings
        FROM ${this.tableName} 
        ORDER BY ${orderBy} ${direction}
      `;
      
      if (limit) {
        query += ` LIMIT ${limit}`;
      }
      
      const result = await this.pool.query(query);
      return result.rows;
    } catch (error) {
      console.error('ユーザー全件取得エラー:', error);
      throw error;
    }
  }
}

// シングルトンとしてエクスポート
module.exports = new UserRepository();
