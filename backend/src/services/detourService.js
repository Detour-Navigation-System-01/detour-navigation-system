/**
 * detourService.js - 遠回りルート生成アルゴリズムを提供するサービス
 */

const polyline = require('@mapbox/polyline');

class DetourService {
  /**
   * 遠回りルートを生成するサービスのコンストラクタ
   */
  constructor() {
    console.log('DetourService initialized');
  }

  /**
   * 最短経路から希望所要時間に合わせた遠回りルートを生成する
   * @param {Object} shortestRoute - 最短経路の情報
   * @param {Number} requestedDuration - 希望所要時間（秒）
   * @param {Object} options - 追加オプション
   * @returns {Object} - 遠回りルート情報
   */
  generateDetour(shortestRoute, requestedDuration, options = {}) {
    try {
      console.log('🚶‍♂️ 遠回りルート生成開始:', { 
        shortestDuration: shortestRoute.duration, 
        requestedDuration 
      });

      // 最短経路の所要時間と希望所要時間の差分を計算
      const durationDifference = requestedDuration - shortestRoute.duration;
      
      if (durationDifference <= 0) {
        throw new Error(`希望所要時間が最短経路の所要時間より短いです: ${requestedDuration}秒 < ${shortestRoute.duration}秒`);
      }

      // 遠回り係数を計算（1.0以上の値）
      const detourFactor = requestedDuration / shortestRoute.duration;
      console.log(`📊 遠回り係数: ${detourFactor.toFixed(2)}倍`);

      // ルートの座標データを取得
      const coordinates = this._getCoordinatesFromRoute(shortestRoute);
      
      if (!coordinates || coordinates.length < 2) {
        throw new Error('有効な経路座標データがありません');
      }
      
      // 遠回りルートを生成するアルゴリズムを適用
      let detourCoordinates;
      
      if (detourFactor >= 2.0) {
        // 大きく遠回りする場合は、zigzag方式を使用
        detourCoordinates = this._generateZigzagDetour(coordinates, detourFactor, options);
      } else {
        // 小さく遠回りする場合は、中間点を追加
        detourCoordinates = this._generatePointAdditionDetour(coordinates, detourFactor, options);
      }
      
      // 新しい距離を計算（遠回り係数に基づいて単純に推定）
      const estimatedDistance = shortestRoute.distance * detourFactor;
      
      // 結果を返す
      return {
        duration: requestedDuration,
        distance: estimatedDistance,
        coordinates: detourCoordinates,
        geometry: this._encodeCoordinates(detourCoordinates),
        detourFactor: detourFactor
      };
    } catch (error) {
      console.error('❌ 遠回りルート生成中にエラーが発生しました:', error);
      throw error;
    }
  }
  
  /**
   * 経路データから座標配列を取得
   * @private
   */
  _getCoordinatesFromRoute(route) {
    // 経路データの形式に応じて座標を取得
    if (route.coordinates && Array.isArray(route.coordinates)) {
      return route.coordinates;
    }
    
    // geometryがポリライン形式の場合、デコード
    if (route.geometry && typeof route.geometry === 'string') {
      try {
        return polyline.decode(route.geometry).map(point => ({
          lat: point[0],
          lng: point[1]
        }));
      } catch (error) {
        console.error('ポリラインのデコードに失敗しました:', error);
      }
    }
    
    return null;
  }
  
  /**
   * ZigZag（ジグザグ）方式の遠回りを生成
   * @private
   */
  _generateZigzagDetour(coordinates, detourFactor, options) {
    const result = [...coordinates];
    const insertPoints = [];
    
    // 経路の大まかな方向を把握
    const start = coordinates[0];
    const end = coordinates[coordinates.length - 1];
    const mainDirection = {
      lat: end.lat - start.lat,
      lng: end.lng - start.lng
    };
    
    // 直角方向を計算（メインの方向に対して垂直）
    const perpendicular = {
      lat: -mainDirection.lng,
      lng: mainDirection.lat
    };
    
    // perpendicular方向の長さを正規化
    const length = Math.sqrt(perpendicular.lat * perpendicular.lat + perpendicular.lng * perpendicular.lng);
    const normalizedPerpendicular = {
      lat: perpendicular.lat / length,
      lng: perpendicular.lng / length
    };
    
    // 挿入する点の数を計算（detourFactorに比例）
    const numInsertions = Math.max(1, Math.floor((detourFactor - 1) * 3));
    
    // 均等に点を選択
    const step = coordinates.length / (numInsertions + 1);
    
    for (let i = 1; i <= numInsertions; i++) {
      const index = Math.floor(i * step);
      if (index > 0 && index < coordinates.length) {
        const basePoint = coordinates[index];
        
        // 距離をベースポイントとdetourFactorに基づいて計算
        const distance = 0.005 * detourFactor; // 約500m×detourFactor（緯度経度単位）
        
        // 交互に左右に振る
        const direction = (i % 2 === 0) ? 1 : -1;
        
        const detourPoint = {
          lat: basePoint.lat + normalizedPerpendicular.lat * distance * direction,
          lng: basePoint.lng + normalizedPerpendicular.lng * distance * direction
        };
        
        insertPoints.push({
          index: index,
          point: detourPoint
        });
      }
    }
    
    // 点を挿入（最後から挿入して配列のインデックスがずれないようにする）
    for (let i = insertPoints.length - 1; i >= 0; i--) {
      const insertion = insertPoints[i];
      result.splice(insertion.index, 0, insertion.point);
    }
    
    return result;
  }
  
  /**
   * 中間点追加方式の遠回りを生成
   * @private
   */
  _generatePointAdditionDetour(coordinates, detourFactor, options) {
    // 元の座標を少し内側に寄せることで、わずかに遠回りするルートを作成
    const result = [];
    
    // 元の経路をなだらかに曲げるための重み係数
    const bendFactor = Math.min(0.3, (detourFactor - 1) / 2);
    
    for (let i = 0; i < coordinates.length; i++) {
      const point = coordinates[i];
      
      // 経路の中間部分だけを曲げる
      if (i > 0 && i < coordinates.length - 1) {
        // 両隣の点を取得
        const prevPoint = coordinates[i - 1];
        const nextPoint = coordinates[i + 1];
        
        // 現在の点から直線ルート上の点への方向を計算
        const direction = {
          lat: (prevPoint.lat + nextPoint.lat) / 2 - point.lat,
          lng: (prevPoint.lng + nextPoint.lng) / 2 - point.lng
        };
        
        // 逆方向に少し動かす（直線からそらす）
        result.push({
          lat: point.lat - direction.lat * bendFactor,
          lng: point.lng - direction.lng * bendFactor
        });
      } else {
        // 始点と終点はそのまま
        result.push(point);
      }
    }
    
    return result;
  }
  
  /**
   * 座標データをポリライン形式にエンコード
   * @private
   */
  _encodeCoordinates(coordinates) {
    if (!coordinates || !Array.isArray(coordinates)) {
      return null;
    }
    
    try {
      const points = coordinates.map(coord => [coord.lat, coord.lng]);
      return polyline.encode(points);
    } catch (error) {
      console.error('ポリラインのエンコードに失敗しました:', error);
      return null;
    }
  }
}

module.exports = DetourService;
