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
}

  /**
   * 指定された地理的範囲内の場所を検索
   * @param {number} north - 北端緯度
   * @param {number} south - 南端緯度
   * @param {number} east - 東端経度
   * @param {number} west - 西端経度
   * @returns {Promise<Array>} 範囲内の場所オブジェクトの配列
   */
  async findByBounds(north, south, east, west) {
    try {
      const queryText = `
        SELECT id, name, description, category, address, prefecture, lat, lng, image_url
        FROM ${this.tableName}
        WHERE lat <= $1 AND lat >= $2
          AND lng <= $3 AND lng >= $4;
      `;
      const queryParams = [north, south, east, west];
      const { rows } = await this.pool.query(queryText, queryParams); // this.pool を使用
      return rows;
    } catch (error) {
      console.error(`${this.tableName}の範囲検索エラー:`, error);
      throw error;
    }
  }

module.exports = PlaceRepository;
