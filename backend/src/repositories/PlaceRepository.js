// backend/src/repositories/PlaceRepository.js

const BaseRepository = require('./BaseRepository');
const pool = require('../utils/db');

/**
 * 場所リポジトリクラス
 * 場所エンティティのデータアクセスを担当
 */
class PlaceRepository extends BaseRepository {
  constructor() {
    super(pool, 'places'); // データベース接続とテーブル名を渡す
  }

  /**
   * 条件に基づいて場所を検索
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
        if (['name', 'description', 'address'].includes(key)) {
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
      console.error('場所の検索エラー:', error);
      throw error;
    }
  }

  /**
   * 条件に基づく場所の総数を取得
   * @param {Object} filters - フィルター条件
   * @returns {Promise<number>} 総数
   */
  async count(filters = {}) {
    // フィルター条件の構築
    const filterConditions = [];
    const queryParams = [];
    let paramCounter = 1;
    
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        // テキストフィールドは部分一致で検索
        if (['name', 'description', 'address'].includes(key)) {
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
      console.error('場所の総数取得エラー:', error);
      throw error;
    }
  }

  /**
   * 近隣の場所を検索
   * @param {number} lat - 緯度
   * @param {number} lng - 経度
   * @param {number} radiusKm - 検索範囲（km）
   * @returns {Promise<Array>} 近隣の場所一覧
   */
  async findNearby(lat, lng, radiusKm = 5) {    try {
      // PostgreSQLのEarthDistanceを使用して近隣検索を実装
      // このクエリはcube拡張とearthdistance拡張に依存しています
      const query = `
        SELECT *, 
          earth_distance(
            ll_to_earth($1, $2),
            ll_to_earth(lat, lng)
          ) / 1000 AS distance 
        FROM ${this.tableName} 
        WHERE earth_distance(
          ll_to_earth($1, $2),
          ll_to_earth(lat, lng)
        ) / 1000 < $3
        ORDER BY distance
      `;
      
      const result = await this.pool.query(query, [lat, lng, radiusKm]);
      return result.rows;
    } catch (error) {
      console.error('近隣場所検索エラー:', error);
      throw error;
    }
  }
  
  /**
   * カテゴリによる場所検索
   * @param {string} category - カテゴリー
   * @param {Object} options - 検索オプション
   * @returns {Promise<Array>} 検索結果
   */
  async findByCategory(category, options = {}) {
    const { limit = 10, offset = 0 } = options;
    
    try {
      const query = `
        SELECT * FROM ${this.tableName}
        WHERE category = $1
        ORDER BY created_at DESC
        LIMIT $2 OFFSET $3
      `;
      
      const result = await this.pool.query(query, [category, limit, offset]);
      return result.rows;
    } catch (error) {
      console.error(`カテゴリー ${category} の場所検索エラー:`, error);
      throw error;
    }  }

  /**
   * 公開設定ONのユーザーのスポットを取得する
   * @param {Object} options - 検索オプション
   * @returns {Promise<Array>} 検索結果
   */
  async findPublicPlaces(options = {}) {
    const { 
      orderBy = 'created_at', 
      direction = 'DESC', 
      limit = 10, 
      offset = 0,
      filters = {} 
    } = options;
    
    // クエリの構築
    let query = `
      SELECT p.*, 
        CASE WHEN p.image_url IS NOT NULL AND p.image_url <> '' THEN true ELSE false END AS has_image
      FROM ${this.tableName} p
      INNER JOIN users u ON p.userid = u.id
      WHERE u.public_settings = true
    `;
    
    // フィルター条件の追加
    const filterConditions = [];
    const queryParams = [];
    let paramCounter = 1;
    
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        if (key === 'category') {
          filterConditions.push(`p.category = $${paramCounter}`);
          queryParams.push(value);
          paramCounter++;
        } else if (key === 'prefecture') {
          filterConditions.push(`p.prefecture = $${paramCounter}`);
          queryParams.push(value);
          paramCounter++;
        } else if (key === 'name') {
          filterConditions.push(`p.name ILIKE $${paramCounter}`);
          queryParams.push(`%${value}%`);
          paramCounter++;
        }
      }
    });
    
    if (filterConditions.length > 0) {
      query += ` AND ${filterConditions.join(' AND ')}`;
    }
    
    query += ` ORDER BY p.${orderBy} ${direction}`;
    
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
      console.error('公開スポットの検索エラー:', error);
      throw error;
    }
  }

  /**
   * 公開設定ONのユーザーのスポットの総数を取得
   * @param {Object} filters - フィルター条件
   * @returns {Promise<number>} 総数
   */
  async countPublicPlaces(filters = {}) {
    // クエリの構築
    let query = `
      SELECT COUNT(*) 
      FROM ${this.tableName} p
      INNER JOIN users u ON p.userid = u.id
      WHERE u.public_settings = true
    `;
    
    // フィルター条件の追加
    const filterConditions = [];
    const queryParams = [];
    let paramCounter = 1;
    
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        if (key === 'category') {
          filterConditions.push(`p.category = $${paramCounter}`);
          queryParams.push(value);
          paramCounter++;
        } else if (key === 'prefecture') {
          filterConditions.push(`p.prefecture = $${paramCounter}`);
          queryParams.push(value);
          paramCounter++;
        } else if (key === 'name') {
          filterConditions.push(`p.name ILIKE $${paramCounter}`);
          queryParams.push(`%${value}%`);
          paramCounter++;
        }
      }
    });
    
    if (filterConditions.length > 0) {
      query += ` AND ${filterConditions.join(' AND ')}`;
    }
    
    try {
      const result = await this.pool.query(query, queryParams);
      return parseInt(result.rows[0].count, 10);
    } catch (error) {
      console.error('公開スポットの総数取得エラー:', error);
      throw error;
    }
  }
}


module.exports = PlaceRepository;
