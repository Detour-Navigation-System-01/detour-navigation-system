// backend/src/services/placeService.js
/**
 * @fileoverview PlaceService
 * @description Placeエンティティに関するビジネスロジックを管理。場所の取得・作成・検索・削除などを担当します。
 * @author 瀬下美華
 * @created 2025-06-25
 * @updated 2025-07-02
 * @version 1.1.1
 */

const { AppError } = require('../middleware/errorHandler');
const PlaceRepository = require('../repositories/PlaceRepository');

class PlaceService {
  constructor() {
    // ❗ 修正：PlaceRepositoryは引数なしで初期化
    this.placeRepository = new PlaceRepository(); // ✅ 正しい初期化方法
  }

  /**
   * 全ての場所を取得
   * @param {Object} options - ソート・ページネーション・フィルタなど
   * @returns {Promise<Object>} dataとtotal件数
   */
  async getAllPlaces(options = {}) {
    const { filters = {}, ...otherOptions } = options;
    
    try {
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
   * IDにより場所を取得
   * @param {number} id - 場所ID
   * @returns {Promise<Object>} 該当場所
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
   * @param {Object} placeData - 作成対象の場所データ
   * @returns {Promise<Object>} 作成された場所
   */
  async createPlace(placeData) {
    try {
      // 💡 数値フィールドの検証と変換
      const validatedData = {
        ...placeData,
        lat: parseFloat(placeData.lat),
        lng: parseFloat(placeData.lng),
        userId: placeData.userId
      };

      if (!validatedData.userId) {
        
        throw new AppError('userIdが必要です', 400);
      }

      // 座標の妥当性チェック
      if (isNaN(validatedData.lat) || isNaN(validatedData.lng)) {
        throw new AppError('有効な緯度・経度を入力してください', 400);
      }

      if (validatedData.lat < -90 || validatedData.lat > 90) {
        throw new AppError('緯度は-90から90の間で入力してください', 400);
      }

      if (validatedData.lng < -180 || validatedData.lng > 180) {
        throw new AppError('経度は-180から180の間で入力してください', 400);
      }

      const place = await this.placeRepository.create(validatedData);
      console.log('✅ 場所作成成功:', place);
      return place;
    } catch (error) {
      if (error.code === '23505') { // PostgreSQLの一意制約違反
        // 場所の名前がnullでなく、ユニーク制約違反の場合
        if (validatedData.name) {
          throw new AppError('この場所の名前はすでに登録されています', 400);
        }
      }
      console.error('❌ 場所作成エラー:', error);
      throw new AppError('場所の登録に失敗しました', 500, error);
    }
  }

  /**
   * 座標から場所を検索または作成（ルート生成用途）
   * @param {Object} coordData - { lat, lng, name?, userId }
   * @returns {Promise<Object>} 新規または既存の場所
   */
  async findOrCreatePlaceByCoordinates(coordData) {
    const { lat, lng, name, userId } = coordData;
    try {
      
      // 既存の近い場所を検索（半径100m以内）
      // TODO: 実装時はfindNearbyメソッドを使用
      // const nearbyPlaces = await this.placeRepository.findNearby(lat, lng, 0.1);
      // if (nearbyPlaces.length > 0) {
      //   return nearbyPlaces[0]; // 最も近い場所を返す
      // }

      // 見つからない場合は新規作成
      const placeData = {
        name: name || `Location (${lat.toFixed(6)}, ${lng.toFixed(6)})`,
        lat: parseFloat(lat),
        lng: parseFloat(lng),
        category: 'coordinate',
        description: 'Automatically created from coordinates',
        userId: userId
      };

      return await this.createPlace(placeData);
    } catch (error) {
      console.error('座標からの場所作成エラー:', error);
      throw error;
    }
  }

  /**
   * 場所の更新
   * @param {number} id - 場所ID
   * @param {Object} updateData - 更新データ
   * @returns {Promise<Object>} 更新後の場所
   */
  async updatePlace(id, updateData) {
    const place = await this.placeRepository.findById(id);
    
    if (!place) {
      throw new AppError(`ID: ${id} の場所が見つかりません`, 404);
    }
    
    try {
      // 数値フィールドがある場合は変換
      if (updateData.lat !== undefined) {
        updateData.lat = parseFloat(updateData.lat);
      }
      if (updateData.lng !== undefined) {
        updateData.lng = parseFloat(updateData.lng);
      }

      const updatedPlace = await this.placeRepository.update(id, updateData);
      return updatedPlace;
    } catch (error) {
      if (error.code === '23505') {
        throw new AppError('この場所の名前はすでに登録されています', 400);
      }
      throw new AppError('場所の更新に失敗しました', 500, error);
    }
  }

  /**
   * 場所の削除
   * @param {number} id - 対象ID
   * @returns {Promise<boolean>} 成否
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
   * カテゴリに紐づく場所を取得
   * @param {string} category - カテゴリ名
   * @param {Object} options - 検索オプション
   * @returns {Promise<Object>} dataとtotal
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
   * 指定座標の近隣場所を取得
   * @param {number} lat - 緯度
   * @param {number} lng - 経度
   * @param {number} radius - 半径（km）
   * @returns {Promise<Object[]>} 該当する場所
   */
  async getNearbyPlaces(lat, lng, radius = 5) {
    try {
      const places = await this.placeRepository.findNearby(lat, lng, radius);
      return places;
    } catch (error) {
      console.warn('⚠️ 近隣検索でPostgreSQL拡張エラー、代替方法を使用:', error.message);
      
      // PostgreSQL拡張が使えない場合の代替実装
      return await this._findNearbyFallback(lat, lng, radius);
    }
  }

  /**
   * 近隣検索の代替手段（拡張なしでも動作）
   * @private
   */
  async _findNearbyFallback(lat, lng, radiusKm) {
    try {
      // 簡易的な境界ボックス検索
      const latDelta = radiusKm / 111; // 約1度 = 111km
      const lngDelta = radiusKm / (111 * Math.cos(lat * Math.PI / 180));

      const query = `
        SELECT *, 
               SQRT(POWER(69.1 * (lat - $1), 2) + POWER(69.1 * ($2 - lng) * COS(lat / 57.3), 2)) AS distance
        FROM places
        WHERE lat BETWEEN $3 AND $4 
          AND lng BETWEEN $5 AND $6
        HAVING distance < $7
        ORDER BY distance
        LIMIT 300
      `;

      const params = [
        lat, lng,
        lat - latDelta, lat + latDelta,
        lng - lngDelta, lng + lngDelta,
        radiusKm
      ];

      const result = await this.placeRepository.pool.query(query, params);
      return result.rows;
    } catch (error) {
      console.error('代替近隣検索エラー:', error);
      return [];
    }
  }

  /**
   * 指定ユーザーIDに紐づく場所を取得
   * @param {number} userId - 対象ユーザーID
   * @param {Object} options - フィルター等
   * @returns {Promise<Object>} dataとtotal
   */
  async getPlacesByUserId(userId, options = {}) {
    // ユーザーIDをフィルターとしてoptionsに結合
    const filters = { userId: userId, ...options.filters || {} };
    const placeOptions = { ...options, filters };

    try {
      // placeRepositoryのfindAllメソッドを使って、userIdでフィルタリングして場所を取得
      const places = await this.placeRepository.findAll(placeOptions);
      const total = await this.placeRepository.count(filters); // フィルターされた総数を取得

      return {
        data: places,
        total
      };
    } catch (error) {
      console.error(`❌ ユーザーID: ${userId} の場所取得エラー:`, error);
      throw new AppError(`ユーザーID: ${userId} の場所の取得に失敗しました`, 500, error);
    }
  }

  /**
   * 公開設定ONの場所を取得
   * @param {Object} options - フィルター等
   * @returns {Promise<Object>} dataとtotal
   */
  async getPublicPlaces(options = {}) {
    const { filters = {}, ...otherOptions } = options;
    
    try {
      const places = await this.placeRepository.findPublicPlaces(options);
      const total = await this.placeRepository.countPublicPlaces(filters);
      
      return {
        data: places,
        total
      };
    } catch (error) {
      console.error('❌ 公開スポットの取得エラー:', error);
      throw new AppError('公開スポットの取得に失敗しました', 500, error);
    }
  }
}

// シングルトンインスタンスとしてエクスポート
module.exports = new PlaceService();