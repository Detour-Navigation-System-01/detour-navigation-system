// backend/src/services/placeService.js

const { AppError } = require('../middleware/errorHandler');
const PlaceRepository = require('../repositories/PlaceRepository');
const db = require('../utils/db');

class PlaceService {
  constructor() {
    this.placeRepository = new PlaceRepository(db, 'places');
  }

  /**
   * 場所一覧を取得
   * @param {Object} options - 取得オプション（ソート、ページネーション、フィルタリング等）
   * @returns {Object} 取得結果と総件数
   */
  async getAllPlaces(options = {}) {
    const { filters = {}, ...otherOptions } = options;
    
    try {
      // 場所の取得とカウント
      const places = await this.placeRepository.findAll(options);
      const total = await this.placeRepository.count(filters);
      
      return {
        data: places,
        total
      };
    } catch (error) {
      throw new AppError('場所の一覧取得に失敗しました', 500, error);
    }
  }

  /**
   * 特定の場所を取得
   * @param {number} id - 場所ID
   * @returns {Object} 取得した場所
   */
  async getPlaceById(id) {
    const place = await this.placeRepository.findById(id);
    
    if (!place) {
      throw new AppError(`ID: ${id} の場所が見つかりません`, 404);
    }
    
    return place;
  }

  /**
   * 新しい場所を作成
   * @param {Object} placeData - 場所データ
   * @returns {Object} 作成された場所
   */
  async createPlace(placeData) {
    try {
      const place = await this.placeRepository.create(placeData);
      return place;
    } catch (error) {
      if (error.code === '23505') { // PostgreSQLの一意制約違反
        throw new AppError('この場所の名前はすでに登録されています', 400);
      }
      throw new AppError('場所の登録に失敗しました', 500, error);
    }
  }

  /**
   * 場所情報を更新
   * @param {number} id - 場所ID
   * @param {Object} updateData - 更新データ
   * @returns {Object} 更新された場所
   */
  async updatePlace(id, updateData) {
    const place = await this.placeRepository.findById(id);
    
    if (!place) {
      throw new AppError(`ID: ${id} の場所が見つかりません`, 404);
    }
    
    try {
      const updatedPlace = await this.placeRepository.update(id, updateData);
      return updatedPlace;
    } catch (error) {
      if (error.code === '23505') { // PostgreSQLの一意制約違反
        throw new AppError('この場所の名前はすでに登録されています', 400);
      }
      throw new AppError('場所の更新に失敗しました', 500, error);
    }
  }

  /**
   * 場所を削除
   * @param {number} id - 場所ID
   * @returns {boolean} 削除の成功/失敗
   */
  async deletePlace(id) {
    const place = await this.placeRepository.findById(id);
    
    if (!place) {
      throw new AppError(`ID: ${id} の場所が見つかりません`, 404);
    }
    
    const isDeleted = await this.placeRepository.delete(id);
    
    if (!isDeleted) {
      throw new AppError('場所の削除に失敗しました', 500);
    }
    
    return true;
  }

  /**
   * カテゴリー別の場所を取得
   * @param {string} category - カテゴリー
   * @param {Object} options - 取得オプション
   * @returns {Object} 取得結果と総件数
   */
  async getPlacesByCategory(category, options = {}) {
    const filters = { category, ...options.filters || {} };
    const placeOptions = { ...options, filters };
    
    try {
      const places = await this.placeRepository.findAll(placeOptions);
      const total = await this.placeRepository.count({ category });
      
      return {
        data: places,
        total
      };
    } catch (error) {
      throw new AppError(`カテゴリー: ${category} の場所取得に失敗しました`, 500, error);
    }
  }

  /**
   * 近隣の場所を検索
   * @param {number} lat - 緯度
   * @param {number} lng - 経度
   * @param {number} radius - 検索範囲（km）
   * @returns {Array} 近隣の場所一覧
   */
  async getNearbyPlaces(lat, lng, radius = 5) {
    try {
      // PostgreSQLのEarthDistanceを使用した近傍検索を実装
      const places = await this.placeRepository.findNearby(lat, lng, radius);
      return places;
    } catch (error) {
      throw new AppError('近隣の場所検索に失敗しました', 500, error);
    }
  }
}

// シングルトンインスタンスとしてエクスポート
module.exports = new PlaceService();
