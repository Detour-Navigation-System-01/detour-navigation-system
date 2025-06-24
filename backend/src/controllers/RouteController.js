/**
 * RouteController.js - 経路関連のHTTPリクエストを処理するコントローラー
 */

const RouteService = require('../services/routeService');

class RouteController {
  constructor() {
    this.routeService = new RouteService();
  }

  /**
   * 経路計算とデータ保存を行う
   * @param {Object} req - HTTPリクエストオブジェクト
   * @param {Object} res - HTTPレスポンスオブジェクト
   */
  async calculateRoute(req, res) {
    try {
      // リクエストボディからデータを取得
      const { 
        origin, 
        destination, 
        waypoints, 
        profile, 
        name,
        description,
        routeType,
        detourLevel
      } = req.body;
      
      // 必須パラメータの検証
      if (!origin) {
        return res.status(400).json({
          success: false,
          message: '出発地情報が必要です'
        });
      }
      
      if (!destination) {
        return res.status(400).json({
          success: false,
          message: '目的地情報が必要です'
        });
      }
      
      // ユーザーIDの取得（認証済みの場合）
      const userId = req.user ? req.user.id : null;
      
      // RouteServiceを使用して経路計算と保存
      const result = await this.routeService.calculateAndSaveRoute(
        {
          origin,
          destination,
          waypoints,
          profile,
          name,
          description,
          routeType,
          detourLevel
        },
        { userId }
      );
      
      // 結果に基づいてレスポンス
      if (result.success) {
        return res.status(200).json({
          success: true,
          message: '経路が正常に計算され保存されました',
          data: result.data
        });
      } else {
        return res.status(500).json({
          success: false,
          message: result.message,
          error: result.error
        });
      }
      
    } catch (error) {
      console.error('経路計算処理中にエラーが発生しました:', error);
      return res.status(500).json({
        success: false,
        message: '経路計算処理中にエラーが発生しました',
        error: error.message
      });
    }
  }

  /**
   * 代替経路のオプションを計算する
   * @param {Object} req - HTTPリクエストオブジェクト
   * @param {Object} res - HTTPレスポンスオブジェクト
   */
  async calculateAlternatives(req, res) {
    try {
      // リクエストボディからデータを取得
      const { 
        origin, 
        destination, 
        profile, 
        numAlternatives 
      } = req.body;
      
      // 必須パラメータの検証
      if (!origin) {
        return res.status(400).json({
          success: false,
          message: '出発地情報が必要です'
        });
      }
      
      if (!destination) {
        return res.status(400).json({
          success: false,
          message: '目的地情報が必要です'
        });
      }
      
      // RouteServiceを使用して代替経路計算
      const result = await this.routeService.calculateAlternativeRoutes(
        {
          origin,
          destination,
          profile
        },
        { numAlternatives }
      );
      
      // 結果に基づいてレスポンス
      if (result.success) {
        return res.status(200).json({
          success: true,
          message: result.message,
          data: result.data
        });
      } else {
        return res.status(500).json({
          success: false,
          message: result.message,
          error: result.error
        });
      }
      
    } catch (error) {
      console.error('代替経路計算処理中にエラーが発生しました:', error);
      return res.status(500).json({
        success: false,
        message: '代替経路計算処理中にエラーが発生しました',
        error: error.message
      });
    }
  }

  /**
   * 経路履歴を取得する
   * @param {Object} req - HTTPリクエストオブジェクト
   * @param {Object} res - HTTPレスポンスオブジェクト
   */
  async getRouteHistory(req, res) {
    try {
      // ユーザーIDの取得
      const userId = req.user ? req.user.id : null;
      
      if (!userId) {
        return res.status(401).json({
          success: false,
          message: '経路履歴の取得にはログインが必要です'
        });
      }
      
      // クエリパラメータを取得
      const { limit, offset, includeWaypoints } = req.query;
      
      // RouteServiceを使用して履歴を取得
      const result = await this.routeService.getRouteHistory(userId, {
        limit: parseInt(limit) || 10,
        offset: parseInt(offset) || 0,
        includeWaypoints: includeWaypoints === 'true'
      });
      
      // 結果に基づいてレスポンス
      if (result.success) {
        return res.status(200).json({
          success: true,
          message: result.message,
          data: result.data
        });
      } else {
        return res.status(500).json({
          success: false,
          message: result.message,
          error: result.error
        });
      }
      
    } catch (error) {
      console.error('経路履歴の取得中にエラーが発生しました:', error);
      return res.status(500).json({
        success: false,
        message: '経路履歴の取得中にエラーが発生しました',
        error: error.message
      });
    }
  }

  /**
   * 経路詳細を取得する
   * @param {Object} req - HTTPリクエストオブジェクト
   * @param {Object} res - HTTPレスポンスオブジェクト
   */
  async getRouteDetails(req, res) {
    try {
      // URLパラメータから経路IDを取得
      const routeId = req.params.id;
      
      if (!routeId) {
        return res.status(400).json({
          success: false,
          message: '経路IDが必要です'
        });
      }
      
      // RouteServiceを使用して詳細を取得
      const result = await this.routeService.getRouteDetails(routeId);
      
      // 結果に基づいてレスポンス
      if (result.success) {
        return res.status(200).json({
          success: true,
          message: result.message,
          data: result.data
        });
      } else {
        // 見つからない場合は404、その他のエラーは500
        const statusCode = result.error === 'Route not found' ? 404 : 500;
        
        return res.status(statusCode).json({
          success: false,
          message: result.message,
          error: result.error
        });
      }
      
    } catch (error) {
      console.error('経路詳細の取得中にエラーが発生しました:', error);
      return res.status(500).json({
        success: false,
        message: '経路詳細の取得中にエラーが発生しました',
        error: error.message
      });
    }
  }
}

module.exports = RouteController;
