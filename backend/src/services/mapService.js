/**
 * @fileoverview マップサービス
 * @description 外部地図API(OSRM)とのインテグレーションを処理するサービス
 * @author 中西陽之介
 * @created 2025-06-14
 * @updated 2025-07-03
 * @version 1.0.0
 */

const axios = require('axios');
const polyline = require('@mapbox/polyline');
require('dotenv').config();

class MapService {
  /**
   * MapServiceのコンストラクタ
   * @constructor
   */
  constructor() {
    this.baseUrl = process.env.OSRM_API_URL;
    
    if (!this.baseUrl) {
      throw new Error('OSRM API URL is not defined in environment variables');
    }
    
    // 利用可能なプロファイル（移動手段）
    this.profiles = {
      CAR: 'driving',
      WALKING: 'walking',
      BICYCLE: 'cycling'
    };
    
    console.log(`MapService initialized with base URL: ${this.baseUrl}`);
  }

  /**
   * OSRMサーバーとの接続をテストするメソッド
   * 東京駅から皇居までの固定ルートでテスト
   * @returns {Promise<Object>} テスト結果
   */
  async testConnection() {
    try {
      // 東京駅の座標 (経度, 緯度)
      const startPoint = [139.7671, 35.6812];
      // 皇居の座標 (経度, 緯度)
      const endPoint = [139.7528, 35.6853];
      
      const coordinatesString = `${startPoint[0]},${startPoint[1]};${endPoint[0]},${endPoint[1]}`;
      const url = `${this.baseUrl}/route/v1/driving/${coordinatesString}?overview=full`;
      
      console.log(`Sending test request to: ${url}`);
      
      const response = await axios.get(url);
      
      if (response.status === 200 && response.data.code === 'Ok') {
        console.log('OSRM connection test successful');
        return {
          success: true,
          message: 'Connection to OSRM API successful',
          data: {
            distance: response.data.routes[0].distance,
            duration: response.data.routes[0].duration,
            coordinates: response.data.routes[0].geometry
          }
        };
      } else {
        console.error('OSRM connection test failed with unexpected response', response.data);
        return {
          success: false,
          message: 'Unexpected response from OSRM API',
          error: response.data
        };
      }
    } catch (error) {
      console.error('Error testing connection to OSRM:', error.message);
      return {
        success: false,
        message: 'Failed to connect to OSRM API',
        error: error.message
      };
    }  }
  
  /**
   * 2点間の経路を計算
   * @param {Object} origin - 出発地の座標 {lat, lng}
   * @param {Object} destination - 目的地の座標 {lat, lng}
   * @param {Array} waypoints - 経由地点の座標配列（オプション）
   * @param {String} profile - 移動手段プロファイル（"driving", "walking", "cycling"）
   * @param {Object} options - その他のオプション
   * @returns {Promise<Object>} 計算された経路情報
   */
  async calculateRoute(origin, destination, waypoints = [], profile = 'driving', options = {}) {
    try {
      // 🔥 追加: ウェイポイントのデバッグログ
      console.log('🛣️ MapService 経路計算開始:', {
        origin: `[${origin.lat}, ${origin.lng}]`,
        destination: `[${destination.lat}, ${destination.lng}]`,
        waypoints: waypoints.map(w => `[${w.lat}, ${w.lng}]`),
        waypointCount: waypoints.length,
        profile: profile
      });

      // 移動手段プロファイルの検証
      if (!Object.values(this.profiles).includes(profile)) {
        profile = this.profiles.CAR; // デフォルトは車
      }
      
      // 座標文字列の作成
      let coordinatesArray = [
        [origin.lng, origin.lat], // 出発地点
        ...waypoints.map(point => [point.lng, point.lat]), // 経由地点
        [destination.lng, destination.lat] // 目的地
      ];
      
      // 🔥 追加: 座標配列のデバッグログ
      console.log('📍 OSRM座標配列:', {
        totalPoints: coordinatesArray.length,
        coordinates: coordinatesArray.map(coord => coord.join(',')),
        expectedFormat: 'lng,lat;lng,lat;lng,lat...'
      });
      
      // 座標文字列に変換
      const coordinatesString = coordinatesArray
        .map(point => point.join(','))
        .join(';');
        
      // 🔥 追加: 最終的なOSRM URL確認
      console.log('🌐 OSRM URL構成要素:', {
        baseUrl: this.baseUrl,
        profile: profile,
        coordinatesString: coordinatesString,
        coordinatesLength: coordinatesString.length
      });
      
      // APIオプションの設定
      const apiOptions = {
        overview: options.overview || 'full', // 経路の詳細度
        steps: options.includeSteps ? 'true' : 'false', // ターンバイターン指示を含めるか
        annotations: options.includeAnnotations ? 'true' : 'false', // 詳細なアノテーションを含めるか
        geometries: 'polyline', // ジオメトリ形式
        alternatives: options.alternatives || 'false' // 代替経路を返すか
      };
      
      // クエリパラメータの構築
      const queryParams = Object.entries(apiOptions)
        .map(([key, value]) => `${key}=${value}`)
        .join('&');
      
      // URLの構築
      const url = `${this.baseUrl}/route/v1/${profile}/${coordinatesString}?${queryParams}`;
      
      console.log(`Sending route calculation request to: ${url}`);
      
      // APIリクエスト
      const response = await axios.get(url);
      
      // レスポンスの検証
      if (response.status === 200 && response.data.code === 'Ok') {
        // 経路が見つかった場合、データを正規化して返す
        const routeData = response.data.routes[0];
        
        // ジオメトリのデコード (polylineをGeoJSONに変換)
        let coordinates = [];
        try {
          if (routeData.geometry) {
            // polylineモジュールを使用して座標データをデコード
            const decodedPoints = polyline.decode(routeData.geometry);
            coordinates = decodedPoints.map(point => ({lat: point[0], lng: point[1]}));
          }
        } catch (decodeError) {
          console.error('Failed to decode route geometry:', decodeError);
        }
        
        // ターンバイターン指示の正規化
        const steps = routeData.legs && options.includeSteps 
          ? this._normalizeRouteSteps(routeData.legs)
          : [];
        
        // 正規化された結果を返す
        return {
          success: true,
          message: 'Route calculated successfully',
          data: {
            distance: routeData.distance, // メートル単位
            duration: routeData.duration, // 秒単位
            geometry: routeData.geometry, // エンコードされたポリライン
            coordinates: coordinates, // デコードされた座標配列
            steps: steps, // ターンバイターン指示
            overview_polyline: routeData.geometry,
            boundingBox: routeData.bbox // 境界ボックス
          }
        };
      } else {
        // エラーレスポンスの処理
        console.error('Route calculation failed with unexpected response', response.data);
        return {
          success: false,
          message: response.data.message || 'Unexpected response from routing API',
          error: response.data
        };
      }
    } catch (error) {
      // 例外処理
      console.error('Error calculating route:', error.message);
      return {
        success: false,
        message: 'Failed to calculate route',
        error: error.message
      };
    }
  }
  
  /**
   * 複数の経路オプションを計算（通常の経路と代替経路）
   * @param {Object} origin - 出発地の座標 {lat, lng}
   * @param {Object} destination - 目的地の座標 {lat, lng}
   * @param {Object} options - その他のオプション
   * @returns {Promise<Object>} 複数の経路オプション
   */
  async calculateRouteAlternatives(origin, destination, options = {}) {
    // 代替経路を含めるオプションを追加
    const routeOptions = {
      ...options,
      alternatives: 'true',
      number_of_alternatives: options.numAlternatives || 2
    };
    
    try {
      // 代替経路を含めて計算
      const response = await this.calculateRoute(
        origin, 
        destination, 
        [], // 経由地点なし
        options.profile || this.profiles.CAR,
        routeOptions
      );
      
      // エラーの場合は直接返す
      if (!response.success) {
        return response;
      }
      
      // 複数の経路があれば正規化して返す
      if (response.data && Array.isArray(response.data.routes) && response.data.routes.length > 0) {
        const routes = response.data.routes.map(route => ({
          distance: route.distance,
          duration: route.duration,
          geometry: route.geometry,
          overview_polyline: route.geometry
        }));
        
        return {
          success: true,
          message: `Found ${routes.length} route options`,
          data: {
            routes: routes,
            origin: origin,
            destination: destination
          }
        };
      }
      
      return response;
    } catch (error) {
      console.error('Error calculating route alternatives:', error);
      return {
        success: false,
        message: 'Failed to calculate route alternatives',
        error: error.message
      };
    }
  }
  
  /**
   * OSRM APIのターンバイターン指示を正規化
   * @private
   * @param {Array} legs - OSRM APIから返されるルートのlegs
   * @returns {Array} 正規化されたステップ
   */
  _normalizeRouteSteps(legs) {
    if (!legs || !Array.isArray(legs)) {
      return [];
    }
    
    let steps = [];
    let stepCounter = 1;
    
    legs.forEach(leg => {
      if (leg.steps && Array.isArray(leg.steps)) {
        leg.steps.forEach(step => {
          // 各ステップを正規化
          const normalizedStep = {
            sequence: stepCounter++,
            instruction: step.maneuver.instruction || this._generateInstruction(step),
            distance: step.distance,
            duration: step.duration,
            start_lat: step.maneuver.location[1],
            start_lng: step.maneuver.location[0],
            end_lat: null, // OSRM APIは終了位置を直接提供していない
            end_lng: null,
            maneuver: step.maneuver.type
          };
          
          steps.push(normalizedStep);
        });
      }
    });
    
    return steps;
  }
  
  /**
   * マニューバータイプから指示文を生成
   * @private
   * @param {Object} step - ステップ情報
   * @returns {String} 生成された指示文
   */
  _generateInstruction(step) {
    if (!step || !step.maneuver) {
      return '進んでください';
    }
    
    const maneuver = step.maneuver;
    const type = maneuver.type;
    const modifier = maneuver.modifier || '';
    
    // マニューバータイプに基づいた指示
    switch (type) {
      case 'turn':
        if (modifier.includes('right')) {
          return '右に曲がってください';
        } else if (modifier.includes('left')) {
          return '左に曲がってください';
        }
        return '曲がってください';
        
      case 'new name':
      case 'continue':
        return '直進してください';
        
      case 'merge':
        return '道路に合流してください';
        
      case 'on ramp':
        return '進入路に入ってください';
        
      case 'off ramp':
        return '出口に向かってください';
        
      case 'roundabout':
        return 'ロータリーを通過してください';
        
      case 'rotary':
        return 'ロータリーを利用してください';
        
      case 'arrive':
        return '目的地に到着しました';
        
      default:
        return '進んでください';
    }
  }
}

module.exports = MapService;
