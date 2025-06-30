// backend/src/services/routeService.js
// 💡 場所解決メソッドの修正版

const MapService = require('./mapService');
const RouteRepository = require('../repositories/RouteRepository');
const placeService = require('./placeService'); // ✅ 修正：シングルトンを使用

class RouteService {
  constructor() {
    this.mapService = new MapService();
    this.routeRepository = new RouteRepository();
    
    this.routeTypes = {
      NORMAL: 'normal',
      DETOUR: 'detour',
      ALTERNATIVE: 'alternative'
    };
  }

  /**
   * 数値データを安全に変換する関数
   */
  _validateAndConvertData(data) {
    const safeParseInt = (value, defaultValue = 0) => {
      if (value === null || value === undefined || value === '') {
        return defaultValue;
      }
      const parsed = parseFloat(value);
      return isNaN(parsed) ? defaultValue : Math.floor(parsed);
    };

    if (!data.distance || !data.duration) {
      throw new Error('Distance and duration are required');
    }

    const distance = safeParseInt(data.distance);
    const duration = safeParseInt(data.duration);

    if (distance <= 0 || duration <= 0) {
      throw new Error(`Invalid route data: distance=${distance}, duration=${duration}`);
    }

    console.log('🔧 RouteService データ変換:', {
      original: { distance: data.distance, duration: data.duration },
      converted: { distance, duration }
    });

    return {
      ...data,
      distance,
      duration
    };
  }

  /**
   * 経路を計算して保存する
   */
  async calculateAndSaveRoute(routeData, options = {}) {
    try {
      console.log('🚀 経路計算開始:', { routeData, options });

      // 1. 出発地と目的地の処理
      const originData = await this._resolveLocation(routeData.origin, options.userId);
      const destinationData = await this._resolveLocation(routeData.destination, options.userId);
      
      console.log('📍 場所解決結果:', {
        origin: originData.coords,
        destination: destinationData.coords
      });
      
      // 2. 経由地の処理
      let waypoints = [];
      let waypointPlaces = [];
      
      if (routeData.waypoints && routeData.waypoints.length > 0) {
        for (const point of routeData.waypoints) {
          const pointData = await this._resolveLocation(point, options.userId);
          if (pointData.place) waypointPlaces.push(pointData.place);
          if (pointData.coords) waypoints.push(pointData.coords);
        }
      }
      
      // 3. 経路計算オプションの設定
      const calculateOptions = {
        includeSteps: true,
        includeAnnotations: true,
        ...options
      };
      
      // 4. MapServiceを使って経路計算
      console.log('🗺️ MapService呼び出し中...');
      const routeResult = await this.mapService.calculateRoute(
        originData.coords,
        destinationData.coords,
        waypoints,
        routeData.profile || 'driving',
        calculateOptions
      );
      
      console.log('📊 MapService結果:', {
        success: routeResult.success,
        distance: routeResult.data?.distance,
        duration: routeResult.data?.duration
      });
      
      // 5. 経路計算に失敗した場合
      if (!routeResult.success) {
        throw new Error(`経路計算に失敗しました: ${routeResult.message}`);
      }

      // 6. 数値データの検証と変換
      const validatedRouteData = this._validateAndConvertData(routeResult.data);
      
      // 7. 経路データの準備
      const routeToSave = {
        name: routeData.name || '新しい経路',
        description: routeData.description || '',
        userId: options.userId || null,

        // ✅ 緯度経度を直接保存
        origin_lat: parseFloat(originData.coords.lat),
        origin_lng: parseFloat(originData.coords.lng),
        destination_lat: parseFloat(destinationData.coords.lat),
        destination_lng: parseFloat(destinationData.coords.lng),
        
        // 検証済みの計算結果データ
        distance: validatedRouteData.distance,
        duration: validatedRouteData.duration,
        geometry: JSON.stringify(validatedRouteData.coordinates),
        overview_polyline: validatedRouteData.overview_polyline,
        
        route_type: routeData.routeType || this.routeTypes.NORMAL,
        detour_level: routeData.detourLevel || 1,
        
        //必要に応じて修正
        waypoints: waypointPlaces.map((place, index) => ({
          place_id: place.id,
          sequence: index + 1
        }))
      };

      // 8. ステップデータの処理
      const processedSteps = validatedRouteData.steps ? validatedRouteData.steps.map((step, index) => ({
        instruction: step.instruction || `Step ${index + 1}`,
        distance: Math.floor(parseFloat(step.distance || 0)),
        duration: Math.floor(parseFloat(step.duration || 0)),
        start_lat: step.start_lat || null,
        start_lng: step.start_lng || null,
        end_lat: step.end_lat || null,
        end_lng: step.end_lng || null,
        maneuver: step.maneuver || null
      })) : [];

      /*console.log('💾 データベース保存開始:', {
        routeData: {
          origin_id: routeToSave.origin_id,
          destination_id: routeToSave.destination_id,
          distance: routeToSave.distance,
          duration: routeToSave.duration
        },
        stepsCount: processedSteps.length
      });*/
      
      // 9. RouteRepositoryを使って経路とステップを保存
      const savedRoute = await this.routeRepository.createWithSteps(
        routeToSave, 
        processedSteps
      );
      
      console.log('✅ 経路保存完了:', savedRoute.id);
      
      return {
        success: true,
        message: '経路が正常に計算され保存されました',
        data: {
          route: savedRoute,
          steps: processedSteps,
          coordinates: validatedRouteData.coordinates
        }
      };
      
    } catch (error) {
      console.error('❌ 経路計算と保存中にエラーが発生しました:', error);
      return {
        success: false,
        message: '経路計算と保存中にエラーが発生しました',
        error: error.message
      };
    }
  }

  /**
   * 💡 修正版：場所解決メソッド（実際のDB操作を使用）
   * @private
   * @param {Object|String|Number} location - 場所データ
   * @returns {Promise<Object>} {place, coords}
   */
  async _resolveLocation(location, userId) {
    if (!location) {
      throw new Error('場所情報が不正です');
    }
    
    console.log('🔍 場所解決中:', location);
    
    // 座標オブジェクトの場合
    if (location.lat !== undefined && location.lng !== undefined) {
      return {
        place: null,
        coords: { lat: location.lat, lng: location.lng }
      };
    }
    
    // 場所IDの場合
    if (typeof location === 'number' || (typeof location === 'string' && !isNaN(location))) {
        const place = await placeService.getPlaceById(parseInt(location));
        return {
          place: place,
          coords: { lat: place.lat, lng: place.lng }
        };
    }
    
    throw new Error('不正な場所フォーマットです');
  }

  // 他のメソッドは既存のまま...
  async calculateAlternativeRoutes(routeData, options = {}) {
    try {
      const originData = await this._resolveLocation(routeData.origin, options.userId);
      const destinationData = await this._resolveLocation(routeData.destination, options.userId);
      
      const result = await this.mapService.calculateRouteAlternatives(
        originData.coords,
        destinationData.coords,
        {
          profile: routeData.profile || 'driving',
          numAlternatives: options.numAlternatives || 2
        }
      );
      
      if (!result.success || !result.data || !Array.isArray(result.data.routes)) {
        console.error('❌ OSRM応答異常: ', result);
        throw new Error(`代替経路が取得できませんでした`);
      }
      
      return {
        success: true,
        message: `${result.data.routes.length}件の経路オプションが見つかりました`,
        data: result.data
      };
      
    } catch (error) {
      console.error('代替経路計算中にエラーが発生しました:', error);
      return {
        success: false,
        message: '代替経路計算中にエラーが発生しました',
        error: error.message
      };
    }
  }

  async getRouteHistory(userId, options = {}) {
    try {
      if (!userId) {
        throw new Error('ユーザーIDが必要です');
      }
      
      const routes = await this.routeRepository.findByUserId(userId, options);
      
      return {
        success: true,
        message: `${routes.length}件の経路履歴が見つかりました`,
        data: routes
      };
    } catch (error) {
      console.error('経路履歴取得中にエラーが発生しました:', error);
      return {
        success: false,
        message: '経路履歴取得中にエラーが発生しました',
        error: error.message
      };
    }
  }

  async getRouteDetails(routeId) {
    try {
      if (!routeId) {
        throw new Error('経路IDが必要です');
      }
      
      const route = await this.routeRepository.findByIdWithSteps(routeId);
      
      if (!route) {
        return {
          success: false,
          message: '指定された経路が見つかりませんでした',
          error: 'Route not found'
        };
      }
      
      return {
        success: true,
        message: '経路詳細が正常に取得されました',
        data: route
      };
    } catch (error) {
      console.error('経路詳細取得中にエラーが発生しました:', error);
      return {
        success: false,
        message: '経路詳細取得中にエラーが発生しました',
        error: error.message
      };
    }
  }
}

module.exports = RouteService;