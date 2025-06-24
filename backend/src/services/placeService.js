// backend/src/services/placeService.js
// 💡 コンストラクタエラーの修正

const { AppError } = require('../middleware/errorHandler');
const PlaceRepository = require('../repositories/PlaceRepository');

class PlaceService {
  constructor() {
    // ❗ 修正：PlaceRepositoryは引数なしで初期化
    this.placeRepository = new PlaceRepository(); // ✅ 正しい初期化方法
  }

  /**
   * 場所一覧を取得
   * @param {Object} options - 取得オプション（ソート、ページネーション、フィルタリング等）
   * @returns {Object} 取得結果と総件数
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
      // 💡 数値フィールドの検証と変換
      const validatedData = {
        ...placeData,
        lat: parseFloat(placeData.lat),
        lng: parseFloat(placeData.lng)
      };

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
        throw new AppError('この場所の名前はすでに登録されています', 400);
      }
      console.error('❌ 場所作成エラー:', error);
      throw new AppError('場所の登録に失敗しました', 500, error);
    }
  }

  /**
   * 💡 座標から場所を検索または作成（RouteServiceから使用）
   * @param {Object} coordData - 座標データ {lat, lng, name?}
   * @returns {Object} 作成または取得された場所
   */
  async findOrCreatePlaceByCoordinates(coordData) {
    try {
      const { lat, lng, name } = coordData;
      
      // 既存の近い場所を検索（半径100m以内）
      // TODO: 実装時はfindNearbyメソッドを使用
      // const nearbyPlaces = await this.placeRepository.findNearby(lat, lng, 0.1);
      // if (nearbyPlaces.length > 0) {
      //   return nearbyPlaces[0]; // 最も近い場所を返す
      // }

      // 見つからない場合は新規作成
      const placeData = {
        name: name || `Location (${lat.toFixed(4)}, ${lng.toFixed(4)})`,
        lat: parseFloat(lat),
        lng: parseFloat(lng),
        category: 'coordinate',
        description: 'Automatically created from coordinates'
      };

      return await this.createPlace(placeData);
    } catch (error) {
      console.error('座標からの場所作成エラー:', error);
      throw error;
    }
  }

  /**
   * 場所情報を更新
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
   * 場所を削除
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
   * 💡 近隣検索の代替実装（PostgreSQL拡張が使えない場合）
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
        LIMIT 50
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
}

// シングルトンインスタンスとしてエクスポート
module.exports = new PlaceService();