// backend/src/services/routeService.js
// 💡 Phase 1: 時間制約最適化遠回り経路機能統合版

const MapService = require('./mapService');
const TimeConstrainedDetourService = require('./detourService'); // 🔥 新しいサービスに変更
const RouteRepository = require('../repositories/RouteRepository');
const placeService = require('./placeService');

class RouteService {
  constructor() {
    this.mapService = new MapService();
    this.detourService = new TimeConstrainedDetourService(this.mapService); // 🔥 新しいサービスを初期化
    this.routeRepository = new RouteRepository();
    
    console.log('✅ RouteService initialized with TimeConstrainedDetourService');
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
      console.log('🗺️ MapService呼び出し中...', {
        profile: routeData.profile || 'driving',
        options: calculateOptions
      });
      
      const routeResult = await this.mapService.calculateRoute(
        originData.coords,
        destinationData.coords,
        waypoints,
        routeData.profile || 'driving',
        calculateOptions
      );
      
      console.log('📊 MapService結果:', {
        success: routeResult.success,
        profile: routeData.profile || 'driving',
        distance: routeResult.data?.distance,
        duration: routeResult.data?.duration
      });
      
      // 5. 経路計算に失敗した場合
      if (!routeResult.success) {
        throw new Error(`経路計算に失敗しました: ${routeResult.message}`);
      }

      // 徒歩プロファイルの場合、所要時間を補正する（OSRMのデモサーバーが徒歩の所要時間を正しく計算していないため）
      if (routeResult.success && routeData.profile === 'walking' && routeResult.data?.distance) {
        // 徒歩の平均速度: 約4.5 km/h = 1.25 m/s
        const walkingSpeedMps = 1.25;
        // 補正した所要時間を計算（秒単位）
        const correctedDuration = Math.round(routeResult.data.distance / walkingSpeedMps);
        
        console.log('🚶‍♂️ 徒歩所要時間を補正:', {
          originalDuration: routeResult.data.duration,
          correctedDuration: correctedDuration,
          distance: routeResult.data.distance,
          speed: `${walkingSpeedMps} m/s（約4.5 km/h）`
        });
        
        // 補正した所要時間に置き換え
        routeResult.data.duration = correctedDuration;
        
        // 各ステップの所要時間も補正する
        if (routeResult.data.steps && routeResult.data.steps.length > 0) {
          console.log(`🚶‍♂️ ${routeResult.data.steps.length}個のステップの所要時間も補正します`);
          
          routeResult.data.steps = routeResult.data.steps.map(step => {
            if (step.distance && step.duration) {
              // 各ステップの距離に基づいて所要時間を再計算
              const originalStepDuration = step.duration;
              const correctedStepDuration = Math.round(step.distance / walkingSpeedMps);
              
              return {
                ...step,
                duration: correctedStepDuration
              };
            }
            return step;
          });
        }
      }

      // 6. 数値データの検証と変換
      const validatedRouteData = this._validateAndConvertData(routeResult.data);
      
      // 🔥 7. 希望所要時間の処理（新しいアルゴリズム統合）
      if (routeData.requestedDuration) {
        const requestedDuration = parseInt(routeData.requestedDuration);
        const shortestDuration = parseInt(validatedRouteData.duration);
        
        console.log('⏱️ 遠回り処理開始:', {
          requestedDuration: `${requestedDuration}秒 (${Math.round(requestedDuration/60)}分)`,
          shortestDuration: `${shortestDuration}秒 (${Math.round(shortestDuration/60)}分)`,
          difference: `${requestedDuration - shortestDuration}秒`
        });
        
        // 所要時間のチェック: 指定された所要時間が最短経路より短い場合はエラー
        if (requestedDuration < shortestDuration) {
          console.log('⚠️ 指定された所要時間が短すぎます:', {
            requestedDuration,
            shortestDuration
          });
          
          return {
            success: false,
            message: '指定された所要時間が最短経路の所要時間より短いため、経路を計算できません',
            data: {
              requestedDuration,
              shortestDuration,
              minimumRequired: shortestDuration + 60 // 最低でも1分は余裕が必要
            }
          };
        }
        
        // 希望所要時間が最短経路より長い場合は新しい時間制約最適化遠回り経路を生成
        if (requestedDuration > shortestDuration) {
          console.log('🎯 TimeConstrainedDetourService使用開始:', {
            algorithm: '時間制約最大活用型',
            targetUtilization: '95-100%',
            method: '円形候補点生成 + 反復改善'
          });
          
          try {
            // 🔥 新しいTimeConstrainedDetourServiceを使用
            const detourRoute = await this.detourService.generateTimeOptimizedDetour(
              validatedRouteData,
              requestedDuration,
              { 
                profile: routeData.profile,
                userId: options.userId
              }
            );
            
            // 元のルートデータを新しい遠回りルートデータで更新
            validatedRouteData.coordinates = detourRoute.coordinates;
            validatedRouteData.geometry = detourRoute.geometry;
            validatedRouteData.distance = detourRoute.distance;
            validatedRouteData.duration = detourRoute.duration;
            
            // 成功ログの詳細表示
            const utilizationRate = (detourRoute.duration / requestedDuration) * 100;
            const improvementFactor = detourRoute.duration / shortestDuration;
            
            console.log('✅ 時間制約最適化遠回り経路の生成に成功:', {
              originalDuration: `${shortestDuration}秒`,
              targetDuration: `${requestedDuration}秒`,
              actualDuration: `${detourRoute.duration}秒`,
              utilizationRate: `${utilizationRate.toFixed(1)}%`,
              improvementFactor: `${improvementFactor.toFixed(2)}倍`,
              algorithm: detourRoute.algorithm,
              iterations: detourRoute.iterations,
              timeSaved: `${requestedDuration - detourRoute.duration}秒の余裕`
            });
            
          } catch (detourError) {
            console.error('❌ 時間制約最適化遠回り経路の生成に失敗:', detourError);
            
            // 🔥 詳細なエラー情報をユーザーに返す
            const errorResponse = {
              success: false,
              message: `遠回り経路の生成に失敗しました: ${detourError.message}`,
              data: {
                requestedDuration,
                shortestDuration,
                error: detourError.message,
                algorithm: 'TimeConstrainedDetourService',
                suggestions: this._getDetourErrorSuggestions(detourError.message, requestedDuration, shortestDuration)
              }
            };
            
            return errorResponse;
          }
        }
      }
      
      // 8. 経路データの準備
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
        
        // プロファイル（移動手段）を明示的に保存
        profile: routeData.profile || 'walking', // デフォルトは歩きに変更
        // requestedDurationがあれば保存
        requested_duration: routeData.requestedDuration || null,
        
        //必要に応じて修正
        waypoints: waypointPlaces.map((place, index) => ({
          place_id: place.id,
          sequence: index + 1
        }))
      };

      // 9. ステップデータの処理
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
      
      // skipSaveオプションが指定されている場合、保存はせずに計算結果だけを返す
      if (options.skipSave) {
        console.log('⏭️ 保存をスキップして計算結果のみを返します');
        return {
          success: true,
          message: '経路が正常に計算されました',
          data: {
            route: routeToSave,
            steps: processedSteps,
            coordinates: validatedRouteData.coordinates
          }
        };
      }
      
      // ここから下は保存処理（skipSaveでなければ実行される）
      console.log('💾 データベース保存開始:', {
        routeData: {
          origin_lat: routeToSave.origin_lat,
          destination_lat: routeToSave.destination_lat,
          distance: routeToSave.distance,
          duration: routeToSave.duration
        },
        stepsCount: processedSteps.length
      });
      
      // 10. RouteRepositoryを使って経路とステップを保存
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
   * 🔥 遠回り処理エラーに対する提案を生成
   * @private
   */
  _getDetourErrorSuggestions(errorMessage, requestedDuration, shortestDuration) {
    const suggestions = [];
    const timeDifference = requestedDuration - shortestDuration;
    
    if (errorMessage.includes('時間が短すぎます') || timeDifference < 60) {
      suggestions.push(`最短経路時間（${Math.round(shortestDuration/60)}分）の1.5倍以上の時間を指定してください`);
      suggestions.push(`推奨時間: ${Math.round((shortestDuration * 1.5)/60)}分以上`);
    }
    
    if (errorMessage.includes('候補経路評価')) {
      suggestions.push('目標時間を少し短くしてみてください');
      suggestions.push('出発地と目的地の間に十分な道路があることを確認してください');
    }
    
    if (errorMessage.includes('経路計算失敗')) {
      suggestions.push('ネットワーク接続を確認してください');
      suggestions.push('しばらく時間をおいて再試行してください');
    }
    
    // 一般的な提案
    if (suggestions.length === 0) {
      suggestions.push('目標時間を調整してみてください');
      suggestions.push('異なる出発地・目的地で試してみてください');
    }
    
    return suggestions;
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

  // 🔥 以下のメソッドは既存のまま保持

  /**
   * 代替経路計算
   */
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

  /**
   * 経路履歴取得
   */
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

  /**
   * 経路詳細取得
   */
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