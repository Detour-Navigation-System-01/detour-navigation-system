/**
 * @fileoverview ベースリポジトリ
 * @description すべてのリポジトリクラスの基底となる抽象クラス
 * @author 中西陽之介
 * @created 2025-06-14
 * @updated 2025-07-03
 * @version 1.0.0
 */

class BaseRepository {
  constructor(pool, tableName) {
    this.pool = pool;
    this.tableName = tableName;
  }

  /**
   * 全てのレコードを取得
   * @param {Object} options - 取得オプション（ソート、制限など）
   * @returns {Promise<Array>} レコードの配列
   */
  async findAll(options = {}) {
    const { orderBy = 'id', direction = 'ASC', limit = null } = options;
    
    let query = `SELECT * FROM ${this.tableName} ORDER BY ${orderBy} ${direction}`;
    
    if (limit) {
      query += ` LIMIT ${limit}`;
    }
    
    try {
      const result = await this.pool.query(query);
      return result.rows;
    } catch (error) {
      console.error(`${this.tableName}の取得エラー:`, error);
      throw error;
    }
  }

  /**
   * IDによるレコード取得
   * @param {number} id - エンティティID
   * @returns {Promise<Object|null>} レコードまたはnull
   */
  async findById(id) {
    try {
      const query = `SELECT * FROM ${this.tableName} WHERE id = $1`;
      const result = await this.pool.query(query, [id]);
      return result.rows[0] || null;
    } catch (error) {
      console.error(`${this.tableName}(ID: ${id})の取得エラー:`, error);
      throw error;
    }
  }

  /**
   * レコードの作成
   * @param {Object} data - 作成するエンティティのデータ
   * @returns {Promise<Object>} 作成されたレコード
   */
  async create(data) {
    const columns = Object.keys(data).join(', ');
    const placeholders = Object.keys(data).map((_, index) => `$${index + 1}`).join(', ');
    const values = Object.values(data);
    
    try {
      const query = `
        INSERT INTO ${this.tableName} (${columns})
        VALUES (${placeholders})
        RETURNING *
      `;
      
      const result = await this.pool.query(query, values);
      return result.rows[0];
    } catch (error) {
      console.error(`${this.tableName}の作成エラー:`, error);
      throw error;
    }
  }

  /**
   * レコードの更新
   * @param {number} id - 更新するエンティティのID
   * @param {Object} data - 更新データ
   * @returns {Promise<Object|null>} 更新されたレコードまたはnull
   */
  async update(id, data) {
    const setClause = Object.keys(data)
      .map((key, index) => `${key} = $${index + 1}`)
      .join(', ');
    
    const values = [...Object.values(data), id];
    
    try {
      const query = `
        UPDATE ${this.tableName}
        SET ${setClause}, updated_at = CURRENT_TIMESTAMP
        WHERE id = $${Object.keys(data).length + 1}
        RETURNING *
      `;
      
      const result = await this.pool.query(query, values);
      return result.rows[0] || null;
    } catch (error) {
      console.error(`${this.tableName}(ID: ${id})の更新エラー:`, error);
      throw error;
    }
  }

  /**
   * レコードの削除
   * @param {number} id - 削除するエンティティのID
   * @returns {Promise<boolean>} 削除が成功したかどうか
   */
  async delete(id) {
    try {
      const query = `DELETE FROM ${this.tableName} WHERE id = $1 RETURNING id`;
      const result = await this.pool.query(query, [id]);
      return result.rows.length > 0;
    } catch (error) {
      console.error(`${this.tableName}(ID: ${id})の削除エラー:`, error);
      throw error;
    }
  }
}

module.exports = BaseRepository;
