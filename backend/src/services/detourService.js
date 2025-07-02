/**
 * TimeConstrainedDetourService.js - 時間制約を最大限活用する遠回りルート生成サービス
 * Phase 2.0: 完全改良版
 * - 設定の外出し（マジックナンバー解決）
 * - 真の動的半径計算（逆算ベース）
 * - 現実的な改善判定ロジック
 */

const polyline = require('@mapbox/polyline');

class TimeConstrainedDetourService {
  /**
   * 時間制約を最大限活用する遠回りサービスのコンストラクタ
   * @param {Object} mapService - MapServiceのインスタンス（OSRM API呼び出し用）
   */
  constructor(mapService) {
    this.mapService = mapService;
    
    // 🔥 改善1: 全ての設定値を一箇所に集約（マジックナンバー削除）
    this.config = {
      // 基本パラメータ
      TARGET_TIME_TOLERANCE: 60,    // ±1分の許容誤差（秒）
      MAX_ITERATIONS: 8,            // 最大試行回数
      MIN_DETOUR_DISTANCE: 300,     // 最小遠回り距離（メートル）
      CANDIDATE_POINTS: 8,          // 円周上の候補点数
      
      // 動的半径計算パラメータ
      radius: {
        WALKING_SPEED_MPS: 1.25,    // 歩行速度 4.5 km/h = 1.25 m/s
        BASE_RADIUS_FACTOR: 0.35,   // 基本半径係数
        MIN_RADIUS: 200,            // 最小半径（メートル）
        MAX_RADIUS: 4000,           // 最大半径（メートル）
        MIN_STEPS: 3,               // 最小段階数
        MAX_STEPS: 6,               // 最大段階数
        // 段階的倍率（距離に応じて使い分け）
        RADIUS_MULTIPLIERS: [1.0, 1.4, 1.9, 2.5, 3.2, 4.0]
      },
      
      // 🔥 改善3: 現実的な改善判定パラメータ
      evaluation: {
        // 利用率による判定基準（大幅に緩和）
        EXCELLENT_RANGE: { min: 0.95, max: 1.05 },  // 優秀範囲（95-105%）
        GOOD_RANGE: { min: 0.80, max: 1.20 },       // 良好範囲（80-120%）
        ACCEPTABLE_RANGE: { min: 0.60, max: 1.40 }, // 許容範囲（60-140%）
        MINIMUM_IMPROVEMENT: 0.40,                   // 最低改善基準（40%利用率以上）
        
        // スコア計算重み
        UTILIZATION_WEIGHT: 60,     // 利用率の重み
        PROXIMITY_WEIGHT: 25,       // 目標時間近接度の重み
        EFFICIENCY_WEIGHT: 15,      // 効率性の重み
        
        // ペナルティ設定（軽減）
        TIME_DIFF_PENALTY_FACTOR: 0.8,    // 時間差ペナルティ係数
        OVERUSE_PENALTY_FACTOR: 1.5,      // 超過ペナルティ係数
        UNDERUSE_BONUS_FACTOR: 0.3         // 低利用率でもボーナス
      }
    };
    
    console.log('🎯 TimeConstrainedDetourService initialized (Phase 2.0 - 完全改良版)');
    console.log('⚙️ 主要パラメータ:', {
      tolerance: this.config.TARGET_TIME_TOLERANCE,
      maxIterations: this.config.MAX_ITERATIONS,
      minDetourDistance: this.config.MIN_DETOUR_DISTANCE,
      candidatePoints: this.config.CANDIDATE_POINTS,
      minimumImprovement: `${(this.config.evaluation.MINIMUM_IMPROVEMENT * 100).toFixed(0)}%`,
      acceptableRange: `${(this.config.evaluation.ACCEPTABLE_RANGE.min * 100).toFixed(0)}-${(this.config.evaluation.ACCEPTABLE_RANGE.max * 100).toFixed(0)}%`
    });
  }

  /**
   * 🔧 設定値の動的更新（テスト・チューニング用）
   */
  updateConfig(newConfig) {
    this.config = { ...this.config, ...newConfig };
    console.log('⚙️ 設定更新:', newConfig);
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
      console.log('🚀 時間制約最適化遠回りルート生成開始 (Phase 2.0)');
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

      // 2. 🔥 改善: より現実的な目標時間範囲の設定
      const targetRange = {
        min: targetDuration * 0.85, // 85%以上
        max: targetDuration * 1.15  // 115%以下
      };
      
      console.log('🎯 目標時間範囲 (改良版):', {
        min: `${Math.round(targetRange.min)}秒 (${Math.round(targetRange.min/60)}分)`,
        max: `${Math.round(targetRange.max)}秒 (${Math.round(targetRange.max/60)}分)`,
        tolerance: '85-115% (従来90-105%から拡大)'
      });

      // 3. 初期状態の設定
      let currentRoute = shortestRoute;
      let bestRoute = shortestRoute;
      let iteration = 0;

      // 4. メイン反復ループ
      while (iteration < this.config.MAX_ITERATIONS) {
        console.log(`\n🔄 反復 ${iteration + 1}/${this.config.MAX_ITERATIONS}`);
        
        // 現在の時間差を計算
        const timeDifference = targetDuration - currentRoute.duration;
        console.log(`⏱️ 現在の時間差: ${timeDifference}秒`);
        
        // 収束判定
        if (this._isWithinTargetRange(currentRoute.duration, targetRange)) {
          console.log('✅ 目標時間範囲内に収束しました！');
          break;
        }
        
        // 🔥 改善: より柔軟な終了条件
        if (timeDifference < 60 && currentRoute.duration > shortestRoute.duration * 1.2) {
          console.log('⚠️ 十分な改善が得られたため最適化を終了');
          break;
        }

        // 5. 🔥 改善: 動的半径による中継点候補の生成
        const candidates = this._generateDynamicWaypointCandidates(currentRoute, timeDifference, shortestRoute.distance);
        console.log(`📍 生成された候補点: ${candidates.length}個`);

        // 6. 各候補での経路評価
        const routeEvaluations = await this._evaluateAllCandidates(currentRoute, candidates, options);
        console.log(`📊 評価完了: ${routeEvaluations.validRoutes}/${routeEvaluations.totalRoutes}件が有効`);

        // 7. 🔥 改善: より寛容な候補選択
        const bestCandidate = this._selectBestCandidateImproved(routeEvaluations.routes, targetDuration);
        
        if (bestCandidate && this._isImprovementImproved(bestCandidate, currentRoute, targetDuration)) {
          console.log(`📈 改善発見: ${bestCandidate.duration}秒 (利用率: ${(bestCandidate.duration/targetDuration*100).toFixed(1)}%)`);
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
      
      console.log('🎉 遠回りルート生成完了 (Phase 2.0):', {
        finalDuration: result.duration,
        targetDuration: targetDuration,
        utilizationRate: `${((result.duration / targetDuration) * 100).toFixed(1)}%`,
        improvementFactor: `${(result.duration / shortestRoute.duration).toFixed(2)}倍`,
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

    // 🔥 改善: より柔軟な最小時間差（30秒に短縮）
    if (timeDifference < 30) {
      return { 
        isValid: false, 
        error: `目標時間との差が小さすぎます（${timeDifference}秒）。最低30秒以上の差が必要です` 
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
   * 🔥 改善2: 真の動的半径計算による中継点候補生成
   * 希望時間から必要距離を逆算して最適な半径を計算
   * @private
   */
  _generateDynamicWaypointCandidates(route, remainingTime, shortestDistance) {
    console.log('📍 動的半径による中継点候補生成中...');
    
    const coordinates = route.coordinates;
    const origin = coordinates[0];
    const destination = coordinates[coordinates.length - 1];
    
    // 経路の中心点を計算
    const centerPoint = this._calculateMidpoint(origin, destination);
    console.log('🎯 中心点:', centerPoint);
    
    // 🔥 新機能: 希望時間から動的に半径を計算
    const radiusSteps = this._calculateDynamicRadii(remainingTime, shortestDistance);
    const allCandidates = [];
    
    radiusSteps.forEach((radius, stepIndex) => {
      console.log(`📏 ステップ ${stepIndex + 1}: 半径 ${radius}m で候補生成`);
      
      // 各半径で候補点を生成（円周上に多様な配置）
      const pointsPerRadius = Math.min(6, Math.max(4, Math.ceil(8 / radiusSteps.length)));
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
    
    // 候補点を半径でソート（小さい順）
    allCandidates.sort((a, b) => a.radius - b.radius);
    
    // 最大候補数に制限
    const finalCandidates = allCandidates.slice(0, this.config.CANDIDATE_POINTS);
    
    console.log(`✅ 動的候補点: ${finalCandidates.length}個 (半径: ${radiusSteps.map(r => r + 'm').join(', ')})`);
    return finalCandidates;
  }

  /**
   * 🔥 新機能: 希望時間から逆算した動的半径計算
   * 閾値に依存せず、物理的に必要な半径を計算
   * @private
   */
  _calculateDynamicRadii(remainingTime, shortestDistance) {
    const remainingMinutes = remainingTime / 60;
    console.log(`🧮 動的半径計算: 残り時間 ${remainingMinutes.toFixed(1)}分, 最短距離 ${shortestDistance}m`);
    
    // 1. 必要な追加距離を計算
    const additionalTime = remainingTime;
    const additionalDistance = additionalTime * this.config.radius.WALKING_SPEED_MPS;
    
    console.log(`📊 計算基礎:`, {
      additionalTime: `${additionalTime}秒`,
      additionalDistance: `${additionalDistance.toFixed(0)}m`,
      walkingSpeed: `${this.config.radius.WALKING_SPEED_MPS}m/s`
    });
    
    // 2. 理論的最適半径を計算（三角形の幾何学）
    const theoreticalRadius = this._calculateTheoreticalRadius(additionalDistance, shortestDistance);
    
    // 3. 実用的な半径に調整
    const practicalRadius = Math.max(
      this.config.radius.MIN_RADIUS,
      Math.min(theoreticalRadius, this.config.radius.MAX_RADIUS)
    );
    
    // 4. 段階的半径配列を生成
    const radiusSteps = this._generateRadiusSteps(practicalRadius, remainingTime);
    
    console.log(`📏 動的半径計算結果:`, {
      theoretical: `${theoreticalRadius.toFixed(0)}m`,
      practical: `${practicalRadius.toFixed(0)}m`,
      steps: radiusSteps.map(r => `${r}m`).join(', ')
    });
    
    return radiusSteps;
  }

  /**
   * 🔥 理論的最適半径の計算
   * 三角形の幾何学を使用して必要な半径を逆算
   * @private
   */
  _calculateTheoreticalRadius(additionalDistance, shortestDistance) {
    // 追加距離の半分が片道の迂回分
    const oneWayDetour = additionalDistance / 2;
    
    // 三角形の幾何学：出発地-目的地の中点から垂直方向に配置
    const halfDirectDistance = shortestDistance / 2;
    
    // ピタゴラスの定理: oneWayDetour^2 = radius^2 + halfDirectDistance^2
    const radiusSquared = Math.pow(oneWayDetour, 2) - Math.pow(halfDirectDistance, 2);
    
    if (radiusSquared <= 0) {
      // 幾何学的に不可能な場合は比例計算
      console.log(`⚠️ 幾何学的制約により比例計算を使用`);
      return additionalDistance * this.config.radius.BASE_RADIUS_FACTOR;
    }
    
    const theoreticalRadius = Math.sqrt(radiusSquared);
    
    console.log(`📐 幾何学計算:`, {
      oneWayDetour: `${oneWayDetour.toFixed(0)}m`,
      halfDirectDistance: `${halfDirectDistance.toFixed(0)}m`,
      theoreticalRadius: `${theoreticalRadius.toFixed(0)}m`
    });
    
    return theoreticalRadius;
  }

  /**
   * 🔥 段階的半径配列の生成
   * 理論値を中心とした効率的な探索範囲を作成
   * @private
   */
  _generateRadiusSteps(optimalRadius, remainingTime) {
    const remainingMinutes = remainingTime / 60;
    
    // 段階数を時間に応じて動的決定
    let stepCount;
    if (remainingMinutes <= 10) {
      stepCount = 3;
    } else if (remainingMinutes <= 30) {
      stepCount = 4;
    } else if (remainingMinutes <= 60) {
      stepCount = 5;
    } else {
      stepCount = 6;
    }
    
    const steps = [];
    const multipliers = this.config.radius.RADIUS_MULTIPLIERS.slice(0, stepCount);
    
    // 最適半径を中心とした段階的配列
    for (let i = 0; i < stepCount; i++) {
      const multiplier = multipliers[i];
      const radius = Math.round(optimalRadius * multiplier);
      
      // 範囲内に制限
      const clampedRadius = Math.max(
        this.config.radius.MIN_RADIUS,
        Math.min(radius, this.config.radius.MAX_RADIUS)
      );
      
      steps.push(clampedRadius);
    }
    
    // 重複を除去し、ソート
    const uniqueSteps = [...new Set(steps)].sort((a, b) => a - b);
    
    console.log(`🎯 ${stepCount}段階の動的半径: [${uniqueSteps.join(', ')}]m`);
    
    return uniqueSteps;
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
    const minDistance = this.config.MIN_DETOUR_DISTANCE / 2; // 150m
    
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

      // API レート制限を回避
      if (i < candidates.length - 1) {
        await this._sleep(100);
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
          includeSteps: false,
          includeAnnotations: false,
          overview: 'full'
        }
      );

      if (!routeResult.success || !routeResult.data) {
        throw new Error(`経路計算失敗: ${routeResult.message || '不明なエラー'}`);
      }

      // 結果データの正規化
      const routeData = routeResult.data;
      
      if (!routeData.duration || !routeData.distance) {
        throw new Error('無効な経路データ（時間または距離が不正）');
      }

      let duration = parseInt(routeData.duration) || 0;
      const distance = parseInt(routeData.distance) || 0;

      // 徒歩の場合は時間を補正
      if (options.profile === 'walking' && distance > 0) {
        const walkingSpeedMps = this.config.radius.WALKING_SPEED_MPS;
        duration = Math.round(distance / walkingSpeedMps);
        console.log(`🚶‍♂️ 候補点${candidateIndex + 1}の徒歩時間補正: ${routeData.duration}秒 → ${duration}秒`);
      }

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
      console.warn(`⚠️ 候補点 ${candidateIndex + 1} の評価でエラー:`, error.message);
      throw error;
    }
  }

  /**
   * 🔥 改善版: より寛容で実用的な最適候補選択
   * @private
   */
  _selectBestCandidateImproved(routes, targetDuration) {
    if (!routes || routes.length === 0) {
      console.log('❌ 選択可能な経路がありません');
      return null;
    }

    console.log('🎯 改良版最適候補選択中...');
    
    const routesWithScore = routes.map(route => {
      const utilizationRate = route.duration / targetDuration;
      const score = this._calculateImprovedScore(route, targetDuration);
      
      return {
        route: route,
        score: score,
        utilizationRate: utilizationRate,
        category: this._categorizeUtilization(utilizationRate)
      };
    });

    // スコア順でソート
    routesWithScore.sort((a, b) => b.score - a.score);

    console.log('📊 改良版候補経路評価結果:');
    const topCandidates = routesWithScore.slice(0, Math.min(3, routesWithScore.length));
    topCandidates.forEach((item, index) => {
      const utilizationPercent = (item.utilizationRate * 100).toFixed(1);
      console.log(`  ${index + 1}位: ${item.route.duration}秒 (利用率${utilizationPercent}% ${item.category}, スコア${item.score.toFixed(1)})`);
    });

    const bestCandidate = routesWithScore[0];
    
    // 🔥 改善: より寛容な採用基準
    if (bestCandidate.score > 20) { // スコア20以上ならOK（従来は100以上）
      console.log(`🏆 採用: ${bestCandidate.category} (スコア${bestCandidate.score.toFixed(1)})`);
      return bestCandidate.route;
    } else {
      console.log(`❌ 全候補のスコアが低すぎるため採用なし (最高スコア: ${bestCandidate.score.toFixed(1)})`);
      return null;
    }
  }

  /**
   * 🔥 改良版スコア計算
   * より現実的で寛容な評価基準
   * @private
   */
  _calculateImprovedScore(route, targetDuration) {
    const utilizationRate = route.duration / targetDuration;
    const config = this.config.evaluation;
    
    let score = 0;
    
    // 利用率による基本スコア（大幅に緩和）
    if (utilizationRate >= config.EXCELLENT_RANGE.min && 
        utilizationRate <= config.EXCELLENT_RANGE.max) {
      score += 100; // 優秀範囲（95-105%）
    } else if (utilizationRate >= config.GOOD_RANGE.min && 
               utilizationRate <= config.GOOD_RANGE.max) {
      score += 85;  // 良好範囲（80-120%）
    } else if (utilizationRate >= config.ACCEPTABLE_RANGE.min && 
               utilizationRate <= config.ACCEPTABLE_RANGE.max) {
      score += 70;  // 許容範囲（60-140%）
    } else if (utilizationRate >= config.MINIMUM_IMPROVEMENT) {
      score += 50;  // 最低改善基準（40%+）
    } else {
      score += 30;  // それ以下でも基本点
    }
    
    // 利用率に応じた追加ボーナス
    if (utilizationRate >= 0.70) {
      score += utilizationRate * 20; // 利用率が高いほどボーナス
    }
    
    // 目標時間からの距離ペナルティ（軽減）
    const timeDifference = Math.abs(route.duration - targetDuration);
    const timePenalty = (timeDifference / 60) * config.TIME_DIFF_PENALTY_FACTOR;
    score -= timePenalty;
    
    // 超過時のペナルティ（軽減）
    if (utilizationRate > 1.20) {
      const excessPenalty = (utilizationRate - 1.20) * 15;
      score -= excessPenalty;
    }
    
    return Math.max(0, score); // 最低0点
  }

  /**
   * 利用率の分類
   * @private
   */
  _categorizeUtilization(utilizationRate) {
    const percent = utilizationRate * 100;
    if (percent >= 95 && percent <= 105) return '🎯 優秀';
    if (percent >= 80 && percent <= 120) return '✅ 良好';  
    if (percent >= 60 && percent <= 140) return '⚠️ 許容';
    if (percent >= 40) return '📈 改善';
    return '❌ 不足';
  }

  /**
   * 🔥 完全改良版: 現実的な改善判定ロジック
   * 85.4%利用率でも積極的に採用する
   * @private
   */
  _isImprovementImproved(candidateRoute, currentRoute, targetDuration) {
    const currentUtilization = currentRoute.duration / targetDuration;
    const candidateUtilization = candidateRoute.duration / targetDuration;
    
    console.log('🔍 改良版改善判定 (Phase 2.0):', {
      current: `${currentRoute.duration}秒 (利用率${(currentUtilization * 100).toFixed(1)}%)`,
      candidate: `${candidateRoute.duration}秒 (利用率${(candidateUtilization * 100).toFixed(1)}%)`,
      targetDuration: `${targetDuration}秒`
    });
    
    const config = this.config.evaluation;
    
    // 🔥 判定基準1: 最低改善閾値（40%）
    if (currentUtilization < config.MINIMUM_IMPROVEMENT && 
        candidateUtilization >= config.MINIMUM_IMPROVEMENT) {
      console.log(`✅ 改善理由: 最低基準(${(config.MINIMUM_IMPROVEMENT*100).toFixed(0)}%)達成`);
      return true;
    }
    
    // 🔥 判定基準2: 大幅な利用率向上（1.3倍以上）
    const improvementRatio = candidateUtilization / currentUtilization;
    if (improvementRatio >= 1.3 && candidateUtilization >= 0.50) {
      console.log(`✅ 改善理由: 大幅向上 (${improvementRatio.toFixed(1)}倍, 50%+)`);
      return true;
    }
    
    // 🔥 判定基準3: 許容範囲内での改善
    const isCurrentInAcceptable = currentUtilization >= config.ACCEPTABLE_RANGE.min && 
                                  currentUtilization <= config.ACCEPTABLE_RANGE.max;
    const isCandidateInAcceptable = candidateUtilization >= config.ACCEPTABLE_RANGE.min && 
                                   candidateUtilization <= config.ACCEPTABLE_RANGE.max;
    
    if (isCandidateInAcceptable && !isCurrentInAcceptable) {
      console.log(`✅ 改善理由: 許容範囲(${(config.ACCEPTABLE_RANGE.min*100).toFixed(0)}-${(config.ACCEPTABLE_RANGE.max*100).toFixed(0)}%)到達`);
      return true;
    }
    
    // 🔥 判定基準4: 両方とも許容範囲内なら、より良い方を選択
    if (isCandidateInAcceptable && isCurrentInAcceptable) {
      const currentScore = this._calculateImprovedScore({ duration: currentRoute.duration }, targetDuration);
      const candidateScore = this._calculateImprovedScore({ duration: candidateRoute.duration }, targetDuration);
      
      if (candidateScore > currentScore) {
        console.log(`✅ 改善理由: スコア向上 (${currentScore.toFixed(1)} → ${candidateScore.toFixed(1)})`);
        return true;
      }
    }
    
    // 🔥 判定基準5: 単純な利用率向上（60%以上で）
    if (candidateUtilization >= 0.60 && candidateUtilization > currentUtilization) {
      console.log(`✅ 改善理由: 利用率向上 (60%+)`);
      return true;
    }
    
    // 改善なしの場合
    console.log(`❌ 改善なし理由:`, {
      candidateUtilization: `${(candidateUtilization * 100).toFixed(1)}%`,
      minimumRequired: `${(config.MINIMUM_IMPROVEMENT * 100).toFixed(0)}%`,
      acceptableRange: `${(config.ACCEPTABLE_RANGE.min * 100).toFixed(0)}-${(config.ACCEPTABLE_RANGE.max * 100).toFixed(0)}%`,
      improvementRatio: improvementRatio.toFixed(2)
    });
    
    return false;
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
      algorithm: 'TimeConstrainedDetour_v2.0'
    };
  }
}

module.exports = TimeConstrainedDetourService;