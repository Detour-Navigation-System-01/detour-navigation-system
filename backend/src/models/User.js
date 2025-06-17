// backend/src/models/User.js
const pool = require('../utils/db');

class User {
  /**
   * 新しいユーザーを作成
   * @param {Object} userData - ユーザーデータ
   * @returns {Promise<Object>} 作成されたユーザーオブジェクト
   */
  static async create(userData) {
    const { username, email, password, first_name, last_name } = userData;
    
    const query = `
      INSERT INTO users (username, email, password, first_name, last_name)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING id, username, email, first_name, last_name, created_at
    `;
    
    const values = [username, email, password, first_name, last_name];
    
    try {
      const result = await pool.query(query, values);
      return result.rows[0];
    } catch (error) {
      console.error('ユーザー作成エラー:', error);
      throw error;
    }
  }
  
  /**
   * IDでユーザーを検索
   * @param {number} id - ユーザーID
   * @returns {Promise<Object|null>} ユーザーオブジェクトまたはnull
   */
  static async findById(id) {
    const query = `
      SELECT id, username, email, first_name, last_name, created_at, updated_at
      FROM users
      WHERE id = $1
    `;
    
    try {
      const result = await pool.query(query, [id]);
      return result.rows[0] || null;
    } catch (error) {
      console.error('ユーザー検索エラー:', error);
      throw error;
    }
  }
  
  /**
   * ユーザー名またはメールアドレスでユーザーを検索
   * @param {string} identifier - ユーザー名またはメールアドレス
   * @returns {Promise<Object|null>} ユーザーオブジェクトまたはnull
   */
  static async findByUsernameOrEmail(identifier) {
    const query = `
      SELECT id, username, email, password, first_name, last_name, created_at, updated_at
      FROM users
      WHERE username = $1 OR email = $1
    `;
    
    try {
      const result = await pool.query(query, [identifier]);
      return result.rows[0] || null;
    } catch (error) {
      console.error('ユーザー検索エラー:', error);
      throw error;
    }
  }
  
  /**
   * すべてのユーザーを取得
   * @returns {Promise<Array>} ユーザーオブジェクトの配列
   */
  static async findAll() {
    const query = `
      SELECT id, username, email, first_name, last_name, created_at, updated_at
      FROM users
      ORDER BY created_at DESC
    `;
    
    try {
      const result = await pool.query(query);
      return result.rows;
    } catch (error) {
      console.error('ユーザー全件取得エラー:', error);
      throw error;
    }
  }
  
  /**
   * ユーザー情報を更新
   * @param {number} id - ユーザーID
   * @param {Object} userData - 更新するユーザーデータ
   * @returns {Promise<Object|null>} 更新されたユーザーオブジェクトまたはnull
   */
  static async update(id, userData) {
    // 更新可能なフィールド
    const allowedFields = ['username', 'email', 'first_name', 'last_name', 'password'];
    const updateFields = [];
    const values = [];
    let paramIndex = 1;
    
    // 更新するフィールドと値を準備
    for (const [key, value] of Object.entries(userData)) {
      if (allowedFields.includes(key) && value !== undefined) {
        updateFields.push(`${key} = $${paramIndex}`);
        values.push(value);
        paramIndex++;
      }
    }
    
    if (updateFields.length === 0) {
      return null; // 更新するフィールドがない
    }
    
    // 更新日時と条件を追加
    updateFields.push(`updated_at = CURRENT_TIMESTAMP`);
    values.push(id); // WHERE id = $paramIndex の値
    
    const query = `
      UPDATE users
      SET ${updateFields.join(', ')}
      WHERE id = $${paramIndex}
      RETURNING id, username, email, first_name, last_name, created_at, updated_at
    `;
    
    try {
      const result = await pool.query(query, values);
      return result.rows[0] || null;
    } catch (error) {
      console.error('ユーザー更新エラー:', error);
      throw error;
    }
  }
  
  /**
   * ユーザーを削除
   * @param {number} id - ユーザーID
   * @returns {Promise<boolean>} 削除が成功したかどうか
   */
  static async delete(id) {
    const query = 'DELETE FROM users WHERE id = $1 RETURNING id';
    
    try {
      const result = await pool.query(query, [id]);
      return result.rowCount > 0;
    } catch (error) {
      console.error('ユーザー削除エラー:', error);
      throw error;
    }
  }
}

module.exports = User;