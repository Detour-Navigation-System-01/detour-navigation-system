/**
 * TimeConstrainedDetourService.js - 時間制約を最大限活用する遠回りルート生成サービス
 * Phase 1.5: 改良版アルゴリズム完全版
 */

const polyline = require('@mapbox/polyline');

class TimeConstrainedDetourService {
  /**
   * 時間制約を最大限活用する遠回りサービスのコンストラクタ
   * @param {Object} mapService - MapServiceのインスタンス（OSRM API呼び出し用）
   */
  constructor(mapService) {
    this.mapService = mapService;
    
    // アルゴリズムのパラメータ設定
    this.TARGET_TIME_TOLERANCE = 60; // ±1分の許容誤差（秒）
    this.MAX_ITERATIONS = 8; // 最大試行回数
    this.MIN_DETOUR_DISTANCE = 300; // 🔥 修正: 最小遠回り距離を300mに短縮
    this.CANDIDATE_POINTS = 8; // 円周上の候補点数
    
    console.log('🎯 TimeConstrainedDetourService initialized (Phase 1.5)');
    console.log('⚙️ Parameters:', {
      tolerance: this.TARGET_TIME_TOLERANCE,
      maxIterations: this.MAX_ITERATIONS,
      minDetourDistance: this.MIN_DETOUR_DISTANCE,
      candidatePoints: this.CANDIDATE_POINTS
    });
  }

  /**
   * メイン関数：時間制約を最大限活用した遠回り経路を生成
   * @param {Object} shortestRoute - 最短経路の情報
   * @param {Number} targetDuration - 希望所要時間（秒）
   * @param {Object} options - 追加オプション
   * @returns {Object} - 最適化された遠回りルート情報
   */
  async generateTimeOptimizedDetour(shortestRoute, targetDuration, options = {}) {
    try {
      console.log('🚀 時間制約最適化遠回りルート生成開始 (Phase 1.5)');
      console.log('📊 初期条件:', { 
        shortestDuration: shortestRoute.duration, 
        targetDuration,
        timeDifference: targetDuration - shortestRoute.duration
      });

      // 1. 基本的な検証
      const validation = this._validateInputs(shortestRoute, targetDuration);
      if (!validation.isValid) {
        throw new Error(validation.error);
      }

      // 2. 目標時間範囲の設定
      const targetRange = {
        min: targetDuration * 0.90, // 🔥 修正: 90%に変更（より現実的）
        max: targetDuration * 1.05  // 105%
      };
      
      console.log('🎯 目標時間範囲:', {
        min: `${Math.round(targetRange.min)}秒 (${Math.round(targetRange.min/60)}分)`,
        max: `${Math.round(targetRange.max)}秒 (${Math.round(targetRange.max/60)}分)`
      });

      // 3. 初期状態の設定
      let currentRoute = shortestRoute;
      let bestRoute = shortestRoute;
      let iteration = 0;

      // 4. メイン反復ループ
      while (iteration < this.MAX_ITERATIONS) {
        console.log(`\n🔄 反復 ${iteration + 1}/${this.MAX_ITERATIONS}`);
        
        // 現在の時間差を計算
        const timeDifference = targetDuration - currentRoute.duration;
        console.log(`⏱️ 現在の時間差: ${timeDifference}秒`);
        
        // 収束判定
        if (this._isWithinTargetRange(currentRoute.duration, targetRange)) {
          console.log('✅ 目標時間範囲内に収束しました！');
          break;
        }
        
        // 時間不足が少ない場合は終了
        if (timeDifference < 30) {
          console.log('⚠️ 残り時間が少ないため最適化を終了');
          break;
        }

        // 5. 中継点候補の生成（改良版）
        const candidates = this._generateWaypointCandidates(currentRoute, timeDifference);
        console.log(`📍 生成された候補点: ${candidates.length}個`);

        // 6. 各候補での経路評価
        const routeEvaluations = await this._evaluateAllCandidates(currentRoute, candidates, options);
        console.log(`📊 評価完了: ${routeEvaluations.validRoutes}/${routeEvaluations.totalRoutes}件が有効`);

        // 7. 最適な候補の選択（改良版）
        const bestCandidate = this._selectBestCandidate(routeEvaluations.routes, targetDuration);
        
        if (bestCandidate && this._isImprovement(bestCandidate, currentRoute, targetDuration)) {
          console.log(`📈 改善発見: ${bestCandidate.duration}秒 (差分: ${targetDuration - bestCandidate.duration}秒)`);
          currentRoute = bestCandidate;
          bestRoute = bestCandidate;
        } else {
          console.log('📉 改善が見つからないため反復を終了');
          break;
        }

        iteration++;
      }

      // 8. 結果の構築
      const result = this._buildResult(bestRoute, targetDuration, iteration);
      
      console.log('🎉 遠回りルート生成完了:', {
        finalDuration: result.duration,
        targetDuration: targetDuration,
        utilizationRate: `${((result.duration / targetDuration) * 100).toFixed(1)}%`,
        iterations: iteration
      });

      return result;

    } catch (error) {
      console.error('❌ 時間制約最適化中にエラーが発生:', error);
      throw error;
    }
  }

  /**
   * 入力値の検証
   * @private
   */
  _validateInputs(shortestRoute, targetDuration) {
    if (!shortestRoute || !shortestRoute.duration || !shortestRoute.coordinates) {
      return { isValid: false, error: '最短経路データが不正です' };
    }

    if (!targetDuration || targetDuration <= 0) {
      return { isValid: false, error: '目標時間が不正です' };
    }

    const timeDifference = targetDuration - shortestRoute.duration;
    if (timeDifference <= 0) {
      return { 
        isValid: false, 
        error: `目標時間が最短経路より短いです: ${targetDuration}秒 < ${shortestRoute.duration}秒` 
      };
    }

    if (timeDifference < 60) {
      return { 
        isValid: false, 
        error: `目標時間との差が小さすぎます（${timeDifference}秒）。最低1分以上の差が必要です` 
      };
    }

    return { isValid: true };
  }

  /**
   * 目標時間範囲内かどうかの判定
   * @private
   */
  _isWithinTargetRange(duration, targetRange) {
    return duration >= targetRange.min && duration <= targetRange.max;
  }

  /**
   * 🔥 修正版: 段階的半径探索による中継点候補生成
   * @private
   */
  _generateWaypointCandidates(route, remainingTime) {
    console.log('📍 改良版中継点候補生成中...');
    
    const coordinates = route.coordinates;
    const origin = coordinates[0];
    const destination = coordinates[coordinates.length - 1];
    
    // 経路の中心点を計算
    const centerPoint = this._calculateMidpoint(origin, destination);
    console.log('🎯 中心点:', centerPoint);
    
    // 段階的な半径で候補点を生成
    const radiusSteps = this._calculateMultipleRadii(remainingTime);
    const allCandidates = [];
    
    radiusSteps.forEach((radius, stepIndex) => {
      console.log(`📏 ステップ ${stepIndex + 1}: 半径 ${radius}m で候補生成`);
      
      // 各半径で候補点を生成（円周上に4点ずつ）
      const pointsPerRadius = 4;
      for (let i = 0; i < pointsPerRadius; i++) {
        const angle = (2 * Math.PI * i) / pointsPerRadius;
        const candidate = this._generatePointAtAngle(centerPoint, radius, angle);
        
        if (this._isValidWaypointCandidate(candidate, origin, destination)) {
          allCandidates.push({
            lat: candidate.lat,
            lng: candidate.lng,
            angle: angle,
            radius: radius,
            step: stepIndex,
            index: allCandidates.length
          });
        }
      }
    });
    
    // 候補点を距離でソート（近い順）
    allCandidates.sort((a, b) => a.radius - b.radius);
    
    // 最大8個に制限
    const finalCandidates = allCandidates.slice(0, this.CANDIDATE_POINTS);
    
    console.log(`✅ 段階的候補点: ${finalCandidates.length}個 (半径: ${radiusSteps.map(r => r + 'm').join(', ')})`);
    return finalCandidates;
  }

  /**
   * 🔥 新規追加: 段階的な半径配列を計算
   * @private
   */
  _calculateMultipleRadii(remainingTime) {
    const remainingMinutes = remainingTime / 60;
    const baseRadius = 400; // 🔥 修正: より小さな基本半径（500m→400m）
    
    // 残り時間に応じて段階数を決定
    let steps = 2; // デフォルト2段階
    if (remainingMinutes > 15) steps = 3;
    if (remainingMinutes > 30) steps = 4;
    
    const radiusSteps = [];
    for (let i = 1; i <= steps; i++) {
      const multiplier = 1 + (i * 0.4); // 🔥 修正: より保守的（0.5→0.4）
      const radius = baseRadius * multiplier;
      radiusSteps.push(Math.round(radius));
    }
    
    return radiusSteps;
  }

  /**
   * 2点の中点を計算
   * @private
   */
  _calculateMidpoint(point1, point2) {
    return {
      lat: (point1.lat + point2.lat) / 2,
      lng: (point1.lng + point2.lng) / 2
    };
  }

  /**
   * 指定された角度と距離の地点を生成
   * @private
   */
  _generatePointAtAngle(centerPoint, distance, angle) {
    // 地球の半径（メートル）
    const R = 6371000;
    
    // 中心点の座標をラジアンに変換
    const lat1 = centerPoint.lat * Math.PI / 180;
    const lng1 = centerPoint.lng * Math.PI / 180;
    
    // 距離を地球の半径で正規化
    const distanceRatio = distance / R;
    
    // 新しい緯度を計算
    const lat2 = Math.asin(
      Math.sin(lat1) * Math.cos(distanceRatio) +
      Math.cos(lat1) * Math.sin(distanceRatio) * Math.cos(angle)
    );
    
    // 新しい経度を計算
    const lng2 = lng1 + Math.atan2(
      Math.sin(angle) * Math.sin(distanceRatio) * Math.cos(lat1),
      Math.cos(distanceRatio) - Math.sin(lat1) * Math.sin(lat2)
    );
    
    return {
      lat: lat2 * 180 / Math.PI,
      lng: lng2 * 180 / Math.PI
    };
  }

  /**
   * 候補点の有効性をチェック
   * @private
   */
  _isValidWaypointCandidate(candidate, origin, destination) {
    // 基本的な座標範囲チェック
    if (candidate.lat < -90 || candidate.lat > 90 || 
        candidate.lng < -180 || candidate.lng > 180) {
      return false;
    }
    
    // 出発地・目的地から最低限の距離を保つ
    const minDistance = this.MIN_DETOUR_DISTANCE / 2; // 150m
    
    const distanceFromOrigin = this._calculateDistance(candidate, origin);
    const distanceFromDestination = this._calculateDistance(candidate, destination);
    
    return distanceFromOrigin >= minDistance && distanceFromDestination >= minDistance;
  }

  /**
   * 2点間の距離を計算（ハヴァサイン公式）
   * @private
   */
  _calculateDistance(point1, point2) {
    const R = 6371000; // 地球の半径（メートル）
    
    const lat1Rad = point1.lat * Math.PI / 180;
    const lat2Rad = point2.lat * Math.PI / 180;
    const deltaLat = (point2.lat - point1.lat) * Math.PI / 180;
    const deltaLng = (point2.lng - point1.lng) * Math.PI / 180;
    
    const a = Math.sin(deltaLat/2) * Math.sin(deltaLat/2) +
            Math.cos(lat1Rad) * Math.cos(lat2Rad) *
            Math.sin(deltaLng/2) * Math.sin(deltaLng/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    
    return R * c;
  }

  /**
   * 全候補点での経路評価を実行
   * @private
   */
  async _evaluateAllCandidates(baseRoute, candidates, options) {
    console.log('📊 候補経路評価開始...');
    
    const results = {
      routes: [],
      validRoutes: 0,
      totalRoutes: candidates.length,
      errors: []
    };

    // 元の経路の開始点と終了点を取得
    const origin = baseRoute.coordinates[0];
    const destination = baseRoute.coordinates[baseRoute.coordinates.length - 1];

    // 各候補点に対して順次経路計算を実行
    for (let i = 0; i < candidates.length; i++) {
      const candidate = candidates[i];
      console.log(`📍 候補点 ${i + 1}/${candidates.length} 評価中: (${candidate.lat.toFixed(6)}, ${candidate.lng.toFixed(6)})`);
      
      try {
        const evaluationResult = await this._evaluateSingleCandidate(
          origin, 
          destination, 
          candidate, 
          options, 
          i
        );
        
        if (evaluationResult) {
          results.routes.push(evaluationResult);
          results.validRoutes++;
          console.log(`✅ 候補点 ${i + 1}: ${evaluationResult.duration}秒, ${(evaluationResult.distance/1000).toFixed(2)}km`);
        }
      } catch (error) {
        results.errors.push(`候補点 ${i + 1}: ${error.message}`);
        console.log(`❌ 候補点 ${i + 1}: ${error.message}`);
      }

      // 少し待機して API レート制限を回避
      if (i < candidates.length - 1) {
        await this._sleep(100); // 100ms待機
      }
    }

    console.log(`📊 評価完了: ${results.validRoutes}/${results.totalRoutes}件の有効な経路を生成`);
    
    if (results.validRoutes === 0) {
      console.log('⚠️ 有効な候補経路が見つかりませんでした');
      if (results.errors.length > 0) {
        console.log('❌ エラー詳細:', results.errors.slice(0, 3));
      }
    }
    
    return results;
  }

  /**
   * 単一候補点での経路評価
   * @private
   */
  async _evaluateSingleCandidate(origin, destination, candidate, options, candidateIndex) {
    try {
      // 中継点を含む経路を計算
      const routeResult = await this.mapService.calculateRoute(
        origin,
        destination,
        [candidate], // 中継点として候補点を追加
        options.profile || 'walking',
        {
          includeSteps: false, // 詳細ステップは不要（高速化のため）
          includeAnnotations: false,
          overview: 'full' // 完全なジオメトリが必要
        }
      );

      if (!routeResult.success || !routeResult.data) {
        throw new Error(`経路計算失敗: ${routeResult.message || '不明なエラー'}`);
      }

      // 結果データの正規化
      const routeData = routeResult.data;
      
      // 基本的なデータ検証
      if (!routeData.duration || !routeData.distance) {
        throw new Error('無効な経路データ（時間または距離が不正）');
      }

      let duration = parseInt(routeData.duration) || 0;
      const distance = parseInt(routeData.distance) || 0;

      // 徒歩の場合は時間を補正
      if (options.profile === 'walking' && distance > 0) {
        const walkingSpeedMps = 1.25; // 4.5 km/h = 1.25 m/s
        duration = Math.round(distance / walkingSpeedMps);
        console.log(`🚶‍♂️ 候補点${candidateIndex + 1}の徒歩時間補正: ${routeData.duration}秒 → ${duration}秒`);
      }

      // 基本的な妥当性チェック
      if (duration <= 0 || distance <= 0) {
        throw new Error('無効な経路データ（時間または距離が0以下）');
      }

      const normalizedRoute = {
        duration: duration,
        distance: distance,
        coordinates: routeData.coordinates || [],
        geometry: routeData.geometry || '',
        waypoint: candidate,
        candidateIndex: candidateIndex,
        source: 'osrm_with_waypoint'
      };

      return normalizedRoute;

    } catch (error) {
      // エラーログを記録して再スロー
      console.warn(`⚠️ 候補点 ${candidateIndex + 1} の評価でエラー:`, error.message);
      throw error;
    }
  }

  /**
   * 🔥 修正版: 最適な候補の選択
   * @private
   */
  _selectBestCandidate(routes, targetDuration) {
    if (!routes || routes.length === 0) {
      console.log('❌ 選択可能な経路がありません');
      return null;
    }

    console.log('🎯 改良版最適候補選択中...');
    
    const routesWithScore = routes.map(route => {
      const timeDifference = Math.abs(route.duration - targetDuration);
      const utilizationRate = route.duration / targetDuration;
      
      let score = 0;
      
      // 🔥 修正: 時間利用率のスコア（目標範囲を重視）
      if (utilizationRate >= 0.95 && utilizationRate <= 1.00) {
        score += 100; // 理想範囲（95-100%）
      } else if (utilizationRate >= 0.90 && utilizationRate <= 1.05) {
        score += 80;  // 良好範囲（90-105%）
      } else if (utilizationRate >= 0.80 && utilizationRate <= 1.10) {
        score += 60;  // 許容範囲（80-110%）
      } else if (utilizationRate < 0.80) {
        // 活用率が低すぎる場合
        score += 30 + (utilizationRate * 50); // 活用率に比例
      } else {
        // 目標時間を超過
        score += Math.max(0, 40 - ((utilizationRate - 1.0) * 100));
      }
      
      // 時間差のペナルティ（分単位）
      const timeDifferenceMinutes = timeDifference / 60;
      score -= timeDifferenceMinutes * 1.5;
      
      // 🔥 修正: 目標時間を超過した場合の追加ペナルティ
      if (route.duration > targetDuration) {
        const excessMinutes = (route.duration - targetDuration) / 60;
        score -= excessMinutes * 3; // 超過時間に対して重いペナルティ
      }
      
      return {
        route: route,
        score: score,
        timeDifference: timeDifference,
        utilizationRate: utilizationRate
      };
    });

    // スコア順でソート
    routesWithScore.sort((a, b) => b.score - a.score);

    console.log('📊 改良版候補経路評価結果:');
    const topCandidates = routesWithScore.slice(0, Math.min(3, routesWithScore.length));
    topCandidates.forEach((item, index) => {
      const utilizationPercent = (item.utilizationRate * 100).toFixed(1);
      const timeDiffMinutes = (item.timeDifference / 60).toFixed(1);
      const inRange = item.utilizationRate >= 0.90 && item.utilizationRate <= 1.05 ? '✅' : '❌';
      console.log(`  ${index + 1}位: ${item.route.duration}秒 (利用率${utilizationPercent}% ${inRange}, 差${timeDiffMinutes}分, スコア${item.score.toFixed(1)})`);
    });

    const bestCandidate = routesWithScore[0];
    const utilizationPercent = (bestCandidate.utilizationRate * 100).toFixed(1);
    
    console.log(`🏆 改良版最適候補: 候補点${bestCandidate.route.candidateIndex + 1} (利用率${utilizationPercent}%, スコア${bestCandidate.score.toFixed(1)})`);
    
    return bestCandidate.route;
  }

  /**
   * 🔥 修正版: 改善の判定
   * @private
   */
  _isImprovement(candidateRoute, currentRoute, targetDuration) {
    const currentDifference = Math.abs(currentRoute.duration - targetDuration);
    const candidateDifference = Math.abs(candidateRoute.duration - targetDuration);
    
    const currentUtilization = currentRoute.duration / targetDuration;
    const candidateUtilization = candidateRoute.duration / targetDuration;
    
    let isImprovement = false;
    let reason = '';
    
    // 1. 目標時間範囲内かどうかをチェック
    const isInTargetRange = candidateUtilization >= 0.90 && candidateUtilization <= 1.05;
    const isCurrentInRange = currentUtilization >= 0.90 && currentUtilization <= 1.05;
    
    // 2. 改善判定ロジック
    if (isInTargetRange && !isCurrentInRange) {
      // 候補が目標範囲内で、現在が範囲外なら改善
      isImprovement = true;
      reason = '目標範囲内に到達';
    } else if (isInTargetRange && isCurrentInRange) {
      // 両方とも範囲内なら、より目標に近い方を選択
      isImprovement = candidateDifference < currentDifference;
      reason = '範囲内でより精密';
    } else if (!isInTargetRange && !isCurrentInRange) {
      // 両方とも範囲外なら、目標に近づいているかチェック
      if (candidateUtilization < currentUtilization && candidateUtilization > 0.85) {
        // 目標に近づいている場合
        isImprovement = true;
        reason = '目標に近づいている';
      }
    }
    
    // 3. 目標時間を大幅に超過した場合は改善とみなさない
    if (candidateUtilization > 1.10) {
      isImprovement = false;
      reason = '目標時間を大幅超過';
    }
    
    console.log('🔍 改良版改善判定:', {
      current: `${currentRoute.duration}秒 (利用率${(currentUtilization * 100).toFixed(1)}%)`,
      candidate: `${candidateRoute.duration}秒 (利用率${(candidateUtilization * 100).toFixed(1)}%)`,
      improvement: isImprovement ? '✅ 改善' : '❌ 改善なし',
      reason: reason,
      targetRange: '90-105%'
    });
    
    return isImprovement;
  }

  /**
   * 非同期待機用のヘルパー関数
   * @private
   */
  _sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * 結果の構築
   * @private
   */
  _buildResult(route, targetDuration, iterations) {
    return {
      duration: route.duration,
      distance: route.distance,
      coordinates: route.coordinates,
      geometry: route.geometry,
      detourFactor: route.duration / targetDuration,
      iterations: iterations,
      algorithm: 'TimeConstrainedDetour'
    };
  }
}

module.exports = TimeConstrainedDetourService;