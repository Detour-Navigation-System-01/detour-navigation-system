// backend/src/repositories/RouteRepository.js
// 💡 エラー解決のための修正版

const BaseRepository = require('./BaseRepository');
const pool = require('../utils/db');

class RouteRepository extends BaseRepository {
  constructor() {
    super(pool, 'routes');
  }

  /**
   * 💡 数値データを安全に整数に変換（エラー解決のキーポイント）
   */
  _safeParseInt(value, defaultValue = 0) {
    if (value === null || value === undefined || value === '') {
      return defaultValue;
    }
    
    // 文字列の場合は数値に変換
    const numValue = typeof value === 'string' ? parseFloat(value) : value;
    
    if (isNaN(numValue)) {
      console.warn(`⚠️ 無効な数値: ${value}, デフォルト値 ${defaultValue} を使用`);
      return defaultValue;
    }
    
    // 小数点以下を切り捨てて整数に変換
    return Math.floor(numValue);
  }

  /**
   * 経路とステップを保存（エラー修正版）
   */
  async createWithSteps(routeData, steps = []) {
    const client = await this.pool.connect();
    
    try {
      await client.query('BEGIN');
      
      console.log('🔧 保存前データ確認:', {
        distance: routeData.distance,
        duration: routeData.duration,
        origin_lat: parseFloat(routeData.origin_lat),
        origin_lng: parseFloat(routeData.origin_lng),
        destination_lat: parseFloat(routeData.destination_lat),
        destination_lng: parseFloat(routeData.destination_lng),
        userId: routeData.userId,
        detour_level: routeData.detour_level
      });

      // ❗ 重要：すべての数値フィールドを安全に変換
      const safeRouteData = {
        name: routeData.name || 'Generated Route',
        description: routeData.description || '',
        origin_id: this._safeParseInt(routeData.origin_id),
        destination_id: this._safeParseInt(routeData.destination_id),
        userId: routeData.userId ? this._safeParseInt(routeData.userId) : null,
        distance: this._safeParseInt(routeData.distance),      // 💡 これがエラーの原因だった
        duration: this._safeParseInt(routeData.duration),      // 💡 これも変換が必要
        geometry: routeData.geometry || null,
        detour_level: this._safeParseInt(routeData.detour_level, 1),
        route_type: routeData.route_type || 'normal',
        overview_polyline: routeData.overview_polyline || null
      };

      console.log('✅ 変換後データ:', {
        distance: safeRouteData.distance,
        duration: safeRouteData.duration,
        origin_id: safeRouteData.origin_id,
        destination_id: safeRouteData.destination_id,
        detour_level: safeRouteData.detour_level
      });

      // データ妥当性チェック
      if (safeRouteData.distance <= 0 || safeRouteData.duration <= 0) {
        throw new Error(`Invalid route data: distance=${safeRouteData.distance}, duration=${safeRouteData.duration}`);
      }

      // ルート保存
      const routeQuery = `
        INSERT INTO routes (
          name, description, origin_lat, origin_lng, destination_lat, destination_lng,
          userId, distance, duration, geometry, detour_level, route_type, overview_polyline
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13) 
        RETURNING *
      `;
      
      const routeValues = [
        routeData.name,
        routeData.description,
        parseFloat(routeData.origin_lat),
        parseFloat(routeData.origin_lng),
        parseFloat(routeData.destination_lat),
        parseFloat(routeData.destination_lng),
        routeData.userId,
        this._safeParseInt(routeData.distance),
        this._safeParseInt(routeData.duration),
        routeData.geometry,
        this._safeParseInt(routeData.detour_level),
        routeData.route_type,
        routeData.overview_polyline
      ];
      
      console.log('📝 実行クエリパラメータ（型確認）:', 
        routeValues.map((val, idx) => ({ 
          index: idx + 1, 
          value: val, 
          type: typeof val 
        }))
      );
      
      const routeResult = await client.query(routeQuery, routeValues);
      const savedRoute = routeResult.rows[0];
      
      console.log('✅ ルート保存成功:', savedRoute.id);

      // ステップ保存
      if (steps && steps.length > 0) {
        console.log(`📍 ${steps.length}個のステップを保存中...`);
        
        for (let i = 0; i < steps.length; i++) {
          const step = steps[i];
          
          const stepQuery = `
            INSERT INTO route_steps (
              route_id, sequence, instruction, distance, duration,
              start_lat, start_lng, end_lat, end_lng, maneuver
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
          `;
          
          const stepValues = [
            savedRoute.id,
            i + 1,
            step.instruction || `Step ${i + 1}`,
            this._safeParseInt(step.distance, 0),    // 💡 ステップの距離も変換
            this._safeParseInt(step.duration, 0),    // 💡 ステップの時間も変換
            step.start_lat || null,
            step.start_lng || null,
            step.end_lat || null,
            step.end_lng || null,
            step.maneuver || null
          ];
          
          await client.query(stepQuery, stepValues);
        }
        
        console.log('✅ 全ステップ保存完了');
      }

      await client.query('COMMIT');
      console.log('🎉 経路保存処理完了:', savedRoute.id);
      
      return savedRoute;
      
    } catch (error) {
      await client.query('ROLLBACK');
      console.error('❌ 経路保存エラー:', error);
      console.error('エラー詳細:', {
        message: error.message,
        code: error.code,
        position: error.position,
        where: error.where
      });
      throw error;
    } finally {
      client.release();
    }
  }

  // 他のメソッドは既存のまま...
  async findByIdWithSteps(id) {
    try {
      const routeQuery = `SELECT * FROM routes WHERE id = $1`;
      const routeResult = await this.pool.query(routeQuery, [id]);
      
      if (routeResult.rows.length === 0) {
        return null;
      }
      
      const route = routeResult.rows[0];
      
      const stepsQuery = `
        SELECT * FROM route_steps 
        WHERE route_id = $1 
        ORDER BY sequence ASC
      `;
      const stepsResult = await this.pool.query(stepsQuery, [id]);
      
      route.steps = stepsResult.rows;
      return route;
    } catch (error) {
      console.error(`経路(ID: ${id})の詳細取得エラー:`, error);
      throw error;
    }
  }

  async findByUserId(userId, options = {}) {
    const { limit = 10, offset = 0 } = options;
    
    try {
      const query = `
        SELECT r.*
        FROM routes r
        WHERE r.userId = $1
        ORDER BY r.created_at DESC
        LIMIT $2 OFFSET $3
      `;
      
      const result = await this.pool.query(query, [userId, limit, offset]);
      return result.rows;
    } catch (error) {
      console.error(`ユーザー(ID: ${userId})の経路履歴取得エラー:`, error);
      throw error;
    }
  }
}

module.exports = RouteRepository;