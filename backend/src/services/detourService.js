/**
 * TimeConstrainedDetourService.js - 全候補評価階層探索アルゴリズム
 * Phase 4.1: 完全評価型最大品質追求
 * - 粗探索 → 局所改善 → 微調整を必ず全実行
 * - フェーズ内も全候補を必ず評価（早期終了なし）
 * - 中継地点steps表示の改善
 */

class TimeConstrainedDetourService {
  constructor(mapService) {
    this.mapService = mapService;
    
    // 階層的探索の設定（全フェーズ実行版）
    this.config = {
      // 基本パラメータ
      TARGET_TIME_TOLERANCE: 60,
      MAX_TOTAL_ITERATIONS: 18,        // 🔥 増加：全フェーズ実行のため
      MIN_DETOUR_DISTANCE: 200,
      
      // 階層的探索パラメータ（全候補必須評価）
      phases: {
        // Phase 1: 粗探索（全候補評価）
        coarse: {
          candidateCount: 6,           
          radiusMultipliers: [0.8, 1.5, 2.5, 4.0, 6.0, 8.0], 
          maxEvaluations: 6            // 全6候補を必ず評価
        },
        
        // Phase 2: 局所改善（全候補評価）
        local: {
          candidateCount: 8,           
          // searchRadius: 動的に計算（_calculateLocalSearchRadius）
          radiusMultipliers: [0.2, 0.4, 0.7, 1.0, 1.3, 1.7, 2.1, 2.6],
          maxEvaluations: 8            // 全8候補を必ず評価
        },
        
        // Phase 3: 微調整（全候補評価）
        fine: {
          candidateCount: 4,           
          // searchRadius: 動的に計算（_calculateFinetuningRadius）
          radiusMultipliers: [0.3, 0.6, 1.0, 1.4],
          maxEvaluations: 4            // 全4候補を必ず評価
        }
      },
      
      // 動的パラメータ (時間差に基づく半径計算用)
      radius: {
        WALKING_SPEED_MPS: 1.25,        // 歩行速度 1.25m/秒
        BASE_RADIUS_FACTOR: 0.4,        // 基本半径計算の係数
        MIN_RADIUS: 150,                // 最小半径 (m)
        MAX_RADIUS: 3000                // 最大半径 (m)
      },
      
      // 評価パラメータ
      evaluation: {
        EXCELLENT_RANGE: { min: 0.92, max: 1.08 },
        GOOD_RANGE: { min: 0.80, max: 1.25 },
        ACCEPTABLE_RANGE: { min: 0.60, max: 1.50 },
        MINIMUM_IMPROVEMENT: 0.40,
        MAX_OVERLAP_RATIO: 0.30,
        IDEAL_OVERLAP_RATIO: 0.15
      }
    };
    
    console.log('🎯 TimeConstrainedDetourService initialized (Phase 4.1 - 全候補評価階層探索)');
    console.log('⚙️ 新アルゴリズム特徴:', {
      approach: '粗探索 → 局所改善 → 微調整（全必須実行）',
      candidateEvaluation: '全候補必須評価（早期終了なし）',
      phaseSkip: 'なし（最大品質追求）',
      maxIterations: this.config.MAX_TOTAL_ITERATIONS,
      totalCandidates: this.config.phases.coarse.candidateCount + 
                      this.config.phases.local.candidateCount + 
                      this.config.phases.fine.candidateCount,
      stepsImprovement: '中継地点表示の改善'
    });
  }

  /**
   * メイン関数：階層的探索による遠回り経路生成
   */
  async generateTimeOptimizedDetour(shortestRoute, targetDuration, options = {}) {
    try {
      console.log('🚀 全候補評価階層探索遠回りルート生成開始 (Phase 4.1)');
      console.log('📊 初期条件:', { 
        shortestDuration: shortestRoute.duration, 
        targetDuration,
        timeDifference: targetDuration - shortestRoute.duration,
        algorithm: 'Full-Candidate Hierarchical Search + Maximum Quality Pursuit'
      });

      // 1. 基本検証
      const validation = this._validateInputs(shortestRoute, targetDuration);
      if (!validation.isValid) {
        throw new Error(validation.error);
      }

      // 2. 探索の初期化
      const origin = shortestRoute.coordinates[0];
      const destination = shortestRoute.coordinates[shortestRoute.coordinates.length - 1];
      const timeDifference = targetDuration - shortestRoute.duration;
      
      console.log(`🔍 探索半径情報: 目標時間差=${timeDifference}秒`);
      
      let bestRoute = shortestRoute;
      let totalEvaluations = 0;
      let phaseResults = [];

      // 3. Phase 1: 粗探索（必ず実行）
      console.log('\n🔍 Phase 1: 粗探索開始');
      const coarseResult = await this._executeCoarseSearch(
        origin, destination, timeDifference, targetDuration, options
      );
      
      totalEvaluations += coarseResult.evaluations;
      phaseResults.push(coarseResult);
      
      if (coarseResult.bestCandidate) {
        bestRoute = coarseResult.bestCandidate;
        console.log(`✅ 粗探索完了: スコア${coarseResult.bestScore.toFixed(1)} (${coarseResult.evaluations}回評価)`);
      }

      // 4. Phase 2: 局所改善（必ず実行）
      console.log('\n🎯 Phase 2: 局所改善開始');
      const localResult = await this._executeLocalImprovement(
        origin, destination, bestRoute, targetDuration, options, phaseResults
      );
      
      totalEvaluations += localResult.evaluations;
      phaseResults.push(localResult);
      
      if (localResult.bestCandidate && localResult.isImprovement) {
        bestRoute = localResult.bestCandidate;
        console.log(`✅ 局所改善完了: スコア${localResult.bestScore.toFixed(1)} (${localResult.evaluations}回評価, 改善+${localResult.improvement.toFixed(1)})`);
      } else {
        console.log(`📊 局所改善完了: 改善なし (現在のベストを維持)`);
      }

      // 5. Phase 3: 微調整（必ず実行）
      console.log('\n🔧 Phase 3: 微調整開始');
      const fineResult = await this._executeFinetuning(
        origin, destination, bestRoute, targetDuration, options, phaseResults
      );
      
      totalEvaluations += fineResult.evaluations;
      phaseResults.push(fineResult);
      
      if (fineResult.bestCandidate && fineResult.isImprovement) {
        bestRoute = fineResult.bestCandidate;
        console.log(`✅ 微調整完了: スコア${fineResult.bestScore.toFixed(1)} (${fineResult.evaluations}回評価, 改善+${fineResult.improvement.toFixed(1)})`);
      } else {
        console.log(`📊 微調整完了: 改善なし (現在のベストを維持)`);
      }

      // 6. 最終結果の構築
      const result = this._buildHierarchicalResult(bestRoute, targetDuration, phaseResults, totalEvaluations);
      
      // 探索半径の変化を要約表示
      const coarseRadius = phaseResults.find(r => r.phase === 'coarse')?.baseRadius;
      const localRadius = phaseResults.find(r => r.phase === 'local')?.searchRadius;
      const fineRadius = phaseResults.find(r => r.phase === 'fine')?.searchRadius;
      
      console.log('📏 探索半径サマリー:', {
        phase1_粗探索: coarseRadius ? `${coarseRadius.toFixed(0)}m` : '不明',
        phase2_局所改善: localRadius ? `${localRadius.toFixed(0)}m` : '不明',
        phase3_微調整: fineRadius ? `${fineRadius.toFixed(0)}m` : '不明',
        phase1to2: coarseRadius && localRadius ? 
          `${(localRadius/coarseRadius*100).toFixed(1)}%` : '不明',
        phase2to3: localRadius && fineRadius ? 
          `${(fineRadius/localRadius*100).toFixed(1)}%` : '不明',
      });
      
      console.log('🎉 全候補評価階層探索遠回りルート生成完了:', {
        finalDuration: result.duration,
        targetDuration: targetDuration,
        utilizationRate: `${((result.duration / targetDuration) * 100).toFixed(1)}%`,
        improvementFactor: `${(result.duration / shortestRoute.duration).toFixed(2)}倍`,
        totalEvaluations: totalEvaluations,
        phasesExecuted: `${phaseResults.length}/3 (全必須実行)`,
        candidatesEvaluated: `${totalEvaluations}/${this.config.MAX_TOTAL_ITERATIONS} (全候補評価)`,
        efficiency: `${(totalEvaluations / this.config.MAX_TOTAL_ITERATIONS * 100).toFixed(0)}%使用`,
        algorithm: 'Full_Candidate_Hierarchical_v4.1'
      });

      return result;

    } catch (error) {
      console.error('❌ 階層的探索最適化中にエラーが発生:', error);
      throw error;
    }
  }

  /**
   * Phase 1: 粗探索の実行（全候補評価）
   * @private
   */
  async _executeCoarseSearch(origin, destination, timeDifference, targetDuration, options) {
    console.log('🔍 粗探索: 大きな範囲で有望な領域を特定（全候補必須評価）');
    
    const config = this.config.phases.coarse;
    const baseRadius = this._calculateBaseRadius(timeDifference);
    
    console.log(`🔍 Phase 1 半径: ${baseRadius.toFixed(0)}m (粗探索基準)`);
    
    // 大きな間隔で候補点を生成
    const candidates = this._generateRadialCandidates(
      origin, destination, baseRadius, config.radiusMultipliers, config.candidateCount
    );
    
    console.log(`📍 粗探索候補: ${candidates.length}個 (半径: ${baseRadius.toFixed(0)}m基準)`);
    
    let bestCandidate = null;
    let bestScore = 0;
    let evaluations = 0;
    const allResults = [];
    
    // 🔥 修正：全候補を必ず評価（早期終了なし）
    for (let i = 0; i < candidates.length; i++) {
      const candidate = candidates[i];
      
      try {
        const route = await this._evaluateWaypointCandidate(
          origin, destination, candidate, options
        );
        
        if (route) {
          const score = this._calculateRouteScore(route, targetDuration);
          evaluations++;
          
          console.log(`  候補${i+1}/${candidates.length}: スコア${score.toFixed(1)} (${route.duration}秒, 重複${(route.overlapRatio*100).toFixed(1)}%)`);
          
          allResults.push({ candidate: route, score: score, index: i });
          
          if (score > bestScore) {
            bestScore = score;
            bestCandidate = route;
          }
        }
        
        // API制限対策
        await this._sleep(100);
        
      } catch (error) {
        console.log(`  候補${i+1}/${candidates.length}: 評価失敗 - ${error.message}`);
      }
    }
    
    // 🔥 新機能：全結果の統計表示
    if (allResults.length > 0) {
      const scores = allResults.map(r => r.score);
      const avgScore = scores.reduce((a, b) => a + b, 0) / scores.length;
      const minScore = Math.min(...scores);
      const maxScore = Math.max(...scores);
      
      console.log(`📊 粗探索統計: 平均${avgScore.toFixed(1)} 最小${minScore.toFixed(1)} 最大${maxScore.toFixed(1)} (${allResults.length}/${candidates.length}成功)`);
    }
    
    return {
      phase: 'coarse',
      bestCandidate: bestCandidate,
      bestScore: bestScore,
      evaluations: evaluations,
      totalCandidates: candidates.length,
      baseRadius: baseRadius,  // 半径情報を追加
      allResults: allResults
    };
  }

  /**
   * Phase 2: 局所改善の実行（全候補評価）
   * @private
   */
  async _executeLocalImprovement(origin, destination, currentBest, targetDuration, options, phaseResults = []) {
    console.log('🎯 局所改善: 現在のベスト候補周辺を詳細探索（全候補必須評価）');
    
    if (!currentBest.waypoint) {
      console.log('⚠️ 現在のベストにwaypointがないため局所改善をスキップ');
      return { phase: 'local', evaluations: 0, isImprovement: false };
    }
    
    const config = this.config.phases.local;
    const currentScore = this._calculateRouteScore(currentBest, targetDuration);
    
    // 🔥 修正: 前のフェーズの結果に基づいて動的に探索半径を計算
    const timeDifference = Math.abs(targetDuration - currentBest.duration);
    console.log(`⏱️ 局所改善: 目標時間差=${timeDifference}秒 (目標${targetDuration}秒 - 現在${currentBest.duration}秒)`);
    const dynamicSearchRadius = this._calculateLocalSearchRadius(timeDifference);
    
    console.log(`🔍 Phase 2 半径: ${dynamicSearchRadius.toFixed(0)}m (局所改善用)`);
    if (phaseResults && Array.isArray(phaseResults) && phaseResults.length > 0) {
      const phase1Result = phaseResults.find(r => r && r.phase === 'coarse');
      if (phase1Result && phase1Result.baseRadius) {
        console.log(`📊 半径変化: Phase 1→2: ${phase1Result.baseRadius.toFixed(0)}m → ${dynamicSearchRadius.toFixed(0)}m (${dynamicSearchRadius < phase1Result.baseRadius ? '縮小' : '拡大'})`);
      }
    }
    
    // 現在のベスト候補周辺で新しい候補を生成（動的半径使用）
    const candidates = this._generateLocalCandidates(
      currentBest.waypoint, dynamicSearchRadius, config.radiusMultipliers, config.candidateCount
    );
    
    console.log(`📍 局所改善候補: ${candidates.length}個 (基準点周辺${dynamicSearchRadius.toFixed(0)}m)`);
    
    let bestCandidate = null;
    let bestScore = currentScore;
    let evaluations = 0;
    const allResults = [];
    
    // 🔥 修正：全候補を必ず評価（早期終了なし）
    for (let i = 0; i < candidates.length; i++) {
      const candidate = candidates[i];
      
      try {
        const route = await this._evaluateWaypointCandidate(
          origin, destination, candidate, options
        );
        
        if (route) {
          const score = this._calculateRouteScore(route, targetDuration);
          evaluations++;
          
          const improvement = score - currentScore;
          console.log(`  局所候補${i+1}/${candidates.length}: スコア${score.toFixed(1)} (改善${improvement >= 0 ? '+' : ''}${improvement.toFixed(1)})`);
          
          allResults.push({ candidate: route, score: score, improvement: improvement, index: i });
          
          if (score > bestScore) {
            bestScore = score;
            bestCandidate = route;
          }
        }
        
        await this._sleep(100);
        
      } catch (error) {
        console.log(`  局所候補${i+1}/${candidates.length}: 評価失敗 - ${error.message}`);
      }
    }
    
    // 🔥 新機能：局所改善の統計表示
    if (allResults.length > 0) {
      const improvements = allResults.map(r => r.improvement);
      const avgImprovement = improvements.reduce((a, b) => a + b, 0) / improvements.length;
      const positiveImprovements = improvements.filter(imp => imp > 0).length;
      
      console.log(`📊 局所改善統計: 平均改善${avgImprovement.toFixed(1)} 改善候補${positiveImprovements}/${allResults.length}`);
    }
    
    const isImprovement = bestScore > currentScore;
    
    return {
      phase: 'local',
      bestCandidate: bestCandidate,
      bestScore: bestScore,
      evaluations: evaluations,
      isImprovement: isImprovement,
      improvement: isImprovement ? bestScore - currentScore : 0,
      searchRadius: dynamicSearchRadius,  // 半径情報を追加
      allResults: allResults
    };
  }

  /**
   * Phase 3: 微調整の実行（全候補評価）
   * @private
   */
  async _executeFinetuning(origin, destination, currentBest, targetDuration, options, phaseResults = []) {
    console.log('🔧 微調整: 最終的な品質向上（全候補必須評価）');
    
    if (!currentBest.waypoint) {
      return { phase: 'fine', evaluations: 0, isImprovement: false };
    }
    
    const config = this.config.phases.fine;
    const currentScore = this._calculateRouteScore(currentBest, targetDuration);
    
    // 🔥 修正: 時間差に基づいて動的に探索半径を計算（微調整はより小さめ）
    const timeDifference = Math.abs(targetDuration - currentBest.duration);
    console.log(`⏱️ 微調整: 目標時間差=${timeDifference}秒 (目標${targetDuration}秒 - 現在${currentBest.duration}秒)`);
    const dynamicSearchRadius = this._calculateFinetuningRadius(timeDifference);
    
    console.log(`🔍 Phase 3 半径: ${dynamicSearchRadius.toFixed(0)}m (微調整用)`);
    if (phaseResults && Array.isArray(phaseResults) && phaseResults.length > 0) {
      const phase2Result = phaseResults.find(r => r && r.phase === 'local');
      if (phase2Result && phase2Result.searchRadius) {
        console.log(`📊 半径変化: Phase 2→3: ${phase2Result.searchRadius.toFixed(0)}m → ${dynamicSearchRadius.toFixed(0)}m (${dynamicSearchRadius < phase2Result.searchRadius ? '縮小' : '拡大'})`);
      }
    }
    
    // より狭い範囲で精密な候補を生成（動的半径使用）
    const candidates = this._generateLocalCandidates(
      currentBest.waypoint, dynamicSearchRadius, config.radiusMultipliers, config.candidateCount
    );
    
    console.log(`📍 微調整候補: ${candidates.length}個 (基準点周辺${dynamicSearchRadius.toFixed(0)}m)`);
    
    let bestCandidate = null;
    let bestScore = currentScore;
    let evaluations = 0;
    const allResults = [];
    
    // 🔥 修正：全候補を必ず評価（早期終了なし）
    for (let i = 0; i < candidates.length; i++) {
      const candidate = candidates[i];
      
      try {
        const route = await this._evaluateWaypointCandidate(
          origin, destination, candidate, options
        );
        
        if (route) {
          const score = this._calculateRouteScore(route, targetDuration);
          evaluations++;
          
          const improvement = score - currentScore;
          console.log(`  微調整候補${i+1}/${candidates.length}: スコア${score.toFixed(1)} (改善${improvement >= 0 ? '+' : ''}${improvement.toFixed(1)})`);
          
          allResults.push({ candidate: route, score: score, improvement: improvement, index: i });
          
          if (score > bestScore) {
            bestScore = score;
            bestCandidate = route;
          }
        }
        
        await this._sleep(100);
        
      } catch (error) {
        console.log(`  微調整候補${i+1}/${candidates.length}: 評価失敗 - ${error.message}`);
      }
    }
    
    // 🔥 新機能：微調整の統計表示
    if (allResults.length > 0) {
      const improvements = allResults.map(r => r.improvement);
      const avgImprovement = improvements.reduce((a, b) => a + b, 0) / improvements.length;
      const positiveImprovements = improvements.filter(imp => imp > 0).length;
      const bestImprovement = Math.max(...improvements);
      
      console.log(`📊 微調整統計: 平均改善${avgImprovement.toFixed(1)} 最大改善${bestImprovement.toFixed(1)} 改善候補${positiveImprovements}/${allResults.length}`);
    }
    
    const isImprovement = bestScore > currentScore;
    
    return {
      phase: 'fine',
      bestCandidate: bestCandidate,
      bestScore: bestScore,
      evaluations: evaluations,
      isImprovement: isImprovement,
      improvement: isImprovement ? bestScore - currentScore : 0,
      searchRadius: dynamicSearchRadius,  // 半径情報を追加
      allResults: allResults
    };
  }

  /**
   * 放射状候補点の生成
   * @private
   */
  _generateRadialCandidates(origin, destination, baseRadius, multipliers, candidateCount) {
    const centerPoint = this._calculateMidpoint(origin, destination);
    const candidates = [];
    
    multipliers.forEach((multiplier, stepIndex) => {
      const radius = baseRadius * multiplier;
      const pointsInRing = Math.ceil(candidateCount / multipliers.length);
      
      for (let i = 0; i < pointsInRing; i++) {
        const angle = (2 * Math.PI * i) / pointsInRing;
        const candidate = this._generatePointAtAngle(centerPoint, radius, angle);
        
        if (this._isValidWaypointCandidate(candidate, origin, destination)) {
          candidates.push({
            lat: candidate.lat,
            lng: candidate.lng,
            radius: radius,
            angle: angle,
            step: stepIndex,
            type: 'radial'
          });
        }
      }
    });
    
    return candidates;
  }

  /**
   * 局所候補点の生成
   * @private
   */
  _generateLocalCandidates(centerPoint, searchRadius, multipliers, candidateCount) {
    const candidates = [];
    
    multipliers.forEach((multiplier, stepIndex) => {
      const radius = searchRadius * multiplier;
      const pointsInRing = Math.ceil(candidateCount / multipliers.length);
      
      for (let i = 0; i < pointsInRing; i++) {
        const angle = (2 * Math.PI * i) / pointsInRing + (stepIndex * Math.PI / 8); // 位相をずらす
        const candidate = this._generatePointAtAngle(centerPoint, radius, angle);
        
        candidates.push({
          lat: candidate.lat,
          lng: candidate.lng,
          radius: radius,
          angle: angle,
          step: stepIndex,
          type: 'local'
        });
      }
    });
    
    return candidates;
  }

  /**
   * 階層的結果の構築
   * @private
   */
  _buildHierarchicalResult(route, targetDuration, phaseResults, totalEvaluations) {
    const utilizationRate = route.duration / targetDuration;
    const efficiency = totalEvaluations / this.config.MAX_TOTAL_ITERATIONS;
    
    return {
      duration: route.duration,
      distance: route.distance,
      coordinates: route.coordinates,
      geometry: route.geometry,
      steps: route.steps || [],
      detourFactor: utilizationRate,
      overlapRatio: route.overlapRatio || 0,
      algorithm: 'Full_Candidate_Hierarchical_v4.1',
      
      // 階層的探索の詳細情報
      searchMetadata: {
        totalEvaluations: totalEvaluations,
        efficiency: efficiency,
        phases: phaseResults.map(phase => ({
          name: phase.phase,
          evaluations: phase.evaluations,
          bestScore: phase.bestScore || 0,
          improvement: phase.improvement || 0
        }))
      }
    };
  }

  // 既存のヘルパーメソッド群（簡略化して掲載）
  _validateInputs(shortestRoute, targetDuration) {
    if (!shortestRoute || !shortestRoute.duration || !shortestRoute.coordinates) {
      return { isValid: false, error: '最短経路データが不正です' };
    }
    if (!targetDuration || targetDuration <= 0) {
      return { isValid: false, error: '目標時間が不正です' };
    }
    const timeDifference = targetDuration - shortestRoute.duration;
    if (timeDifference <= 60) {
      return { isValid: false, error: '目標時間との差が小さすぎます（最低60秒以上必要）' };
    }
    return { isValid: true };
  }

  _calculateBaseRadius(timeDifference) {
    const additionalDistance = timeDifference * this.config.radius.WALKING_SPEED_MPS;
    const baseRadius = additionalDistance * this.config.radius.BASE_RADIUS_FACTOR;
    return Math.max(
      this.config.radius.MIN_RADIUS,
      Math.min(baseRadius, this.config.radius.MAX_RADIUS)
    );
  }

  /**
   * Phase 2: 局所改善用の半径計算
   * 粗探索よりも狭い範囲を重点的に
   * @private
   */
  _calculateLocalSearchRadius(timeDifference) {
    // 局所改善は粗探索の結果から細かく探索
    const additionalDistance = timeDifference * this.config.radius.WALKING_SPEED_MPS;
    
    console.log(`📏 局所改善半径計算: 時間差=${timeDifference}秒, 距離基準=${additionalDistance.toFixed(0)}m`);
    
    // 粗探索より小さい係数を使用
    const localFactor = this.config.radius.BASE_RADIUS_FACTOR * 0.3;
    const localRadius = additionalDistance * localFactor;
    
    // 最小半径/最大半径のバウンド
    const finalRadius = Math.max(
      0, // 局所探索の最小半径
      Math.min(localRadius, 600) // 局所探索の最大半径
    );
    
    console.log(`📏 局所改善半径決定: 係数=${localFactor.toFixed(2)}, 基本半径=${localRadius.toFixed(0)}m, 最終半径=${finalRadius.toFixed(0)}m`);
    
    return finalRadius;
  }

  /**
   * Phase 3: 微調整用の半径計算
   * さらに絞った範囲で探索
   * @private
   */
  _calculateFinetuningRadius(timeDifference) {
    // 微調整フェーズはさらに小さな範囲を探索
    const additionalDistance = timeDifference * this.config.radius.WALKING_SPEED_MPS;
    
    console.log(`📏 微調整半径計算: 時間差=${timeDifference}秒, 距離基準=${additionalDistance.toFixed(0)}m`);
    
    // 局所改善よりさらに小さい係数を使用
    const fineTuningFactor = this.config.radius.BASE_RADIUS_FACTOR * 0.1;
    const fineTuningRadius = additionalDistance * fineTuningFactor;
    
    // 最小半径/最大半径のバウンド
    const finalRadius = Math.max(
      0, // 微調整の最小半径
      Math.min(fineTuningRadius, 300) // 微調整の最大半径
    );
    
    console.log(`📏 微調整半径決定: 係数=${fineTuningFactor.toFixed(2)}, 基本半径=${fineTuningRadius.toFixed(0)}m, 最終半径=${finalRadius.toFixed(0)}m`);
    
    return finalRadius;
  }

  async _evaluateWaypointCandidate(origin, destination, candidate, options) {
    try {
      const routeResult = await this.mapService.calculateRoute(
        origin, destination, [candidate],
        options.profile || 'walking',
        { includeSteps: true, includeAnnotations: true, overview: 'full' }
      );

      if (routeResult.success && routeResult.data) {
        let routeData = routeResult.data;
        
        if (options.profile === 'walking' && routeData.distance > 0) {
          const correctedDuration = Math.round(routeData.distance / this.config.radius.WALKING_SPEED_MPS);
          routeData = { ...routeData, duration: correctedDuration };
        }

        // 🔥 新機能：中継地点でのsteps表示改善
        if (routeData.steps && routeData.steps.length > 0) {
          routeData.steps = this._improveWaypointSteps(routeData.steps, candidate);
        }

        const overlapRatio = await this._calculateRouteOverlapRatio(routeData);

        return {
          duration: routeData.duration,
          distance: routeData.distance,
          coordinates: routeData.coordinates,
          geometry: routeData.geometry,
          steps: routeData.steps,
          waypoint: candidate,
          overlapRatio: overlapRatio,
          source: 'hierarchical_search'
        };
      }
      return null;
    } catch (error) {
      return null;
    }
  }

  /**
   * 🔥 新機能：中継地点でのsteps表示改善
   * 「目的地に到着しました」→「中継地点を通過します」
   * @private
   */
  _improveWaypointSteps(steps, waypoint) {
    if (!steps || steps.length === 0) {
      return steps;
    }

    const improvedSteps = [];
    let waypointFound = false;

    for (let i = 0; i < steps.length; i++) {
      const step = steps[i];
      const isLastStep = i === steps.length - 1;
      
      // 中継地点での「arrive」ステップを検出
      const isWaypointArrival = this._isWaypointArrivalStep(step, waypoint) && !isLastStep;
      
      if (isWaypointArrival) {
        // 中継地点到着ステップを改善
        const improvedStep = {
          ...step,
          instruction: '中継地点を通過します',
          maneuver: 'waypoint'
        };
        improvedSteps.push(improvedStep);
        waypointFound = true;
        
        console.log(`🔧 Steps改善: 中継地点ステップを修正 "${step.instruction}" → "中継地点を通過します"`);
      } else {
        // その他のステップはそのまま
        improvedSteps.push(step);
      }
    }

    console.log(`📋 Steps改善結果: ${waypointFound ? '中継地点ステップ修正済み' : '中継地点ステップなし'} (${improvedSteps.length}ステップ)`);
    
    return improvedSteps;
  }

  /**
   * 中継地点での到着ステップかどうかを判定
   * @private
   */
  _isWaypointArrivalStep(step, waypoint) {
    // maneuverが'arrive'の場合
    if (step.maneuver === 'arrive') {
      return true;
    }
    
    // instructionに「到着」が含まれる場合
    if (step.instruction && (
        step.instruction.includes('到着') || 
        step.instruction.includes('arrived') || 
        step.instruction.includes('destination') ||
        step.instruction.includes('You have arrived')
    )) {
      return true;
    }
    
    // ステップの位置が中継地点に近い場合（50m以内）
    // if (step.start_lat && step.start_lng && waypoint) {
    //   const stepLocation = { lat: step.start_lat, lng: step.start_lng };
    //   const distance = this._calculateDistance(stepLocation, waypoint);
    //   if (distance < 50) { // 50m以内
    //     return true;
    //   }
    // }
    
    return false;
  }

  /**
   * 経路のスコア計算
   * @private
   */
  _calculateRouteScore(route, targetDuration) {
    const utilizationRate = route.duration / targetDuration;
    const overlapRatio = route.overlapRatio || 0;
    const config = this.config.evaluation;
    
    let score = 0;
    
    if (utilizationRate >= config.EXCELLENT_RANGE.min && utilizationRate <= config.EXCELLENT_RANGE.max) {
      score += 100;
    } else if (utilizationRate >= config.GOOD_RANGE.min && utilizationRate <= config.GOOD_RANGE.max) {
      score += 80;
    } else if (utilizationRate >= config.ACCEPTABLE_RANGE.min && utilizationRate <= config.ACCEPTABLE_RANGE.max) {
      score += 60;
    } else {
      score += 30;
    }
    
    if (overlapRatio <= config.IDEAL_OVERLAP_RATIO) {
      score += 20;
    } else if (overlapRatio <= config.MAX_OVERLAP_RATIO) {
      score += 10;
    } else {
      score -= (overlapRatio - config.MAX_OVERLAP_RATIO) * 100;
    }
    
    const timeDifference = Math.abs(route.duration - targetDuration);
    
    // 🔥 修正: 目標時間を超えた場合、より強く減点
    if (route.duration > targetDuration) {
      // 超過時間に対して二次関数的に減点を強化
      const overageMinutes = (route.duration - targetDuration) / 60;
      score -= Math.pow(overageMinutes, 1.5) * 1.2;
    } else {
      // 不足時間に対しては線形減点
      const underageMinutes = (targetDuration - route.duration) / 60;
      score -= underageMinutes * 0.5;
    }
    
    return Math.max(0, score);
  }

  async _calculateRouteOverlapRatio(routeData) {
    // 簡略化版（既存のロジックを使用）
    try {
      if (!routeData || !routeData.coordinates || routeData.coordinates.length < 4) {
        return 0.0;
      }
      const segments = this._extractRoadSegments(routeData.coordinates);
      if (segments.length < 3) return 0.0;
      const overlapInfo = this._detectSegmentOverlaps(segments);
      const totalDistance = this._calculateTotalRouteDistance(routeData.coordinates);
      return totalDistance > 0 ? overlapInfo.overlapDistance / totalDistance : 0.0;
    } catch (error) {
      return 0.0;
    }
  }

  _extractRoadSegments(coordinates) {
    if (!coordinates || coordinates.length < 2) return [];
    const segments = [];
    const minSegmentLength = 50;
    let currentStart = coordinates[0];
    let accumulatedDistance = 0;

    for (let i = 1; i < coordinates.length; i++) {
      const segmentDistance = this._calculateDistance(coordinates[i-1], coordinates[i]);
      accumulatedDistance += segmentDistance;
      if (accumulatedDistance >= minSegmentLength || i === coordinates.length - 1) {
        segments.push({
          start: currentStart,
          end: coordinates[i],
          distance: accumulatedDistance,
          index: segments.length
        });
        currentStart = coordinates[i];
        accumulatedDistance = 0;
      }
    }
    return segments;
  }

  _detectSegmentOverlaps(segments) {
    let overlapCount = 0;
    let overlapDistance = 0;
    const tolerance = 25;

    for (let i = 0; i < segments.length - 2; i++) {
      for (let j = i + 2; j < segments.length; j++) {
        const overlapInfo = this._calculateSegmentOverlap(segments[i], segments[j], tolerance);
        if (overlapInfo.isOverlapping) {
          overlapCount++;
          overlapDistance += overlapInfo.overlapLength;
        }
      }
    }
    return { overlapCount, overlapDistance };
  }

  _calculateSegmentOverlap(seg1, seg2, toleranceMeters) {
    const midpoint1 = {
      lat: (seg1.start.lat + seg1.end.lat) / 2,
      lng: (seg1.start.lng + seg1.end.lng) / 2
    };
    const midpoint2 = {
      lat: (seg2.start.lat + seg2.end.lat) / 2,
      lng: (seg2.start.lng + seg2.end.lng) / 2
    };
    const midpointDistance = this._calculateDistance(midpoint1, midpoint2);
    if (midpointDistance > toleranceMeters) {
      return { isOverlapping: false, overlapLength: 0 };
    }
    return {
      isOverlapping: true,
      overlapLength: Math.min(seg1.distance, seg2.distance),
      midpointDistance: midpointDistance
    };
  }

  // その他のヘルパーメソッド
  _calculateMidpoint(point1, point2) {
    return {
      lat: (point1.lat + point2.lat) / 2,
      lng: (point1.lng + point2.lng) / 2
    };
  }

  _generatePointAtAngle(centerPoint, distance, angle) {
    const R = 6371000;
    const lat1 = centerPoint.lat * Math.PI / 180;
    const lng1 = centerPoint.lng * Math.PI / 180;
    const distanceRatio = distance / R;
    
    const lat2 = Math.asin(
      Math.sin(lat1) * Math.cos(distanceRatio) +
      Math.cos(lat1) * Math.sin(distanceRatio) * Math.cos(angle)
    );
    
    const lng2 = lng1 + Math.atan2(
      Math.sin(angle) * Math.sin(distanceRatio) * Math.cos(lat1),
      Math.cos(distanceRatio) - Math.sin(lat1) * Math.sin(lat2)
    );
    
    return {
      lat: lat2 * 180 / Math.PI,
      lng: lng2 * 180 / Math.PI
    };
  }

  _isValidWaypointCandidate(candidate, origin, destination) {
    if (candidate.lat < -90 || candidate.lat > 90 || 
        candidate.lng < -180 || candidate.lng > 180) {
      return false;
    }
    const minDistance = this.config.MIN_DETOUR_DISTANCE;
    const distanceFromOrigin = this._calculateDistance(candidate, origin);
    const distanceFromDestination = this._calculateDistance(candidate, destination);
    return distanceFromOrigin >= minDistance && distanceFromDestination >= minDistance;
  }

  _calculateDistance(point1, point2) {
    const R = 6371000;
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

  _calculateTotalRouteDistance(coordinates) {
    if (!coordinates || coordinates.length < 2) return 0;
    let totalDistance = 0;
    for (let i = 1; i < coordinates.length; i++) {
      totalDistance += this._calculateDistance(coordinates[i-1], coordinates[i]);
    }
    return totalDistance;
  }

  _sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

module.exports = TimeConstrainedDetourService;