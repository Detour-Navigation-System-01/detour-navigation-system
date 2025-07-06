/**
 * @fileoverview 経路計算APIルーティング
 * @description 経路計算に関するAPIエンドポイントの定義と処理のルーティング
 * @author 中西陽之介
 * @created 2025-06-18
 * @updated 2025-07-03
 * @version 1.2.0
 */

const express = require('express');
const router = express.Router();
const MapService = require('../services/mapService');
const RouteService = require('../services/routeService'); // RouteServiceのインポートを追加
const RouteController = require('../controllers/RouteController');
const authenticate = require('../middleware/auth'); // 認証ミドルウェアのインポート

// サービスとコントローラーのインスタンス作成
const mapService = new MapService();
const routeController = new RouteController();

/**
 * @route   GET /api/routes/test
 * @desc    外部APIとの接続テスト
 * @access  Public
 */
router.get('/test', async (req, res) => {
  try {
    console.log('接続テストエンドポイントにリクエストを受信しました');
    
    // MapServiceを使用して接続テスト実行
    const result = await mapService.testConnection();
    
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
    console.error('ルーターでエラーが発生しました:', error);
    return res.status(500).json({
      success: false,
      message: '接続テスト中にエラーが発生しました',
      error: error.message
    });
  }
});

/**
 * @route   POST /api/routes/calculate
 * @desc    出発地から目的地までの経路を計算（保存なし）
 * @desc    requestedDurationパラメータを指定すると遠回り経路を生成
 * @access  Public
 */
router.post('/calculate', async (req, res) => {
  try {
    const { 
      origin, 
      destination, 
      waypoints = [], 
      profile = 'driving',
      includeSteps = false,
      includeAnnotations = false,
      requestedDuration // 希望所要時間を追加
    } = req.body;
    
    // 入力パラメータの検証
    if (!origin || !origin.lat || !origin.lng) {
      return res.status(400).json({
        success: false,
        message: '出発地の座標（lat, lng）が必要です'
      });
    }
    
    if (!destination || !destination.lat || !destination.lng) {
      return res.status(400).json({
        success: false,
        message: '目的地の座標（lat, lng）が必要です'
      });
    }
    
    console.log(`経路計算リクエスト: ${origin.lat},${origin.lng} → ${destination.lat},${destination.lng}`);
    
    // RouteServiceを使用して経路計算（保存はしない）
    // 認証なしでも使えるようにuserIdはnullに
    const routeService = new RouteService();
    const routeResult = await routeService.calculateAndSaveRoute(
      {
        origin,
        destination,
        waypoints,
        profile,
        requestedDuration
      },
      { 
        userId: null, // 未認証ユーザー
        skipSave: true, // 保存をスキップするフラグ
        includeSteps,
        includeAnnotations
      }
    );
    
    if (routeResult.success) {
      return res.status(200).json({
        success: true,
        message: routeResult.message || '経路が正常に計算されました',
        data: routeResult.data
      });
    } else {
      return res.status(400).json({
        success: false,
        message: routeResult.message,
        error: routeResult.error
      });
    }
  } catch (error) {
    console.error('経路計算でエラーが発生しました:', error);
    return res.status(500).json({
      success: false,
      message: '経路計算中にエラーが発生しました',
      error: error.message
    });
  }
});

/**
 * @route   POST /api/routes/calculate-alternatives
 * @desc    代替経路を含めた経路オプションを計算
 * @access  Public
 */
router.post('/calculate-alternatives', async (req, res) => {
  try {
    const { 
      origin, 
      destination, 
      profile = 'driving',
      numAlternatives = 2
    } = req.body;
    
    // 入力パラメータの検証
    if (!origin || !origin.lat || !origin.lng) {
      return res.status(400).json({
        success: false,
        message: '出発地の座標（lat, lng）が必要です'
      });
    }
    
    if (!destination || !destination.lat || !destination.lng) {
      return res.status(400).json({
        success: false,
        message: '目的地の座標（lat, lng）が必要です'
      });
    }
    
    console.log(`代替経路計算リクエスト: ${origin.lat},${origin.lng} → ${destination.lat},${destination.lng}`);
    
    // MapServiceを使用して代替経路計算（従来の方法）
    const result = await mapService.calculateRouteAlternatives(
      origin,
      destination,
      { profile, numAlternatives }
    );
    
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
    console.error('代替経路計算でエラーが発生しました:', error);
    return res.status(500).json({
      success: false,
      message: '代替経路計算中にエラーが発生しました',
      error: error.message
    });
  }
});

/**
 * @route   POST /api/routes/save
 * @desc    経路を計算して保存する（新しいRouteController使用）
 * @access  Private（認証必要）
 */
router.post('/save', authenticate, (req, res) => routeController.calculateRoute(req, res));

/**
 * @route   POST /api/routes/alternatives
 * @desc    代替経路を計算する（新しいRouteController使用）
 * @access  Public
 */
router.post('/alternatives', (req, res) => routeController.calculateAlternatives(req, res));

/**
 * @route   GET /api/routes/history
 * @desc    ユーザーの経路履歴を取得する
 * @access  Private（認証必要）
 */
router.get('/history', authenticate, (req, res) => routeController.getRouteHistory(req, res));

/**
 * @route   GET /api/routes/:id
 * @desc    経路の詳細を取得する（自分が作成した経路のみアクセス可）
 * @access  Private（認証必要）
 */
router.get('/:id', authenticate, (req, res) => routeController.getRouteDetails(req, res));

/**
 * @route   POST /api/routes/test-waypoints
 * @desc    複数ウェイポイント機能のテスト
 * @access  Public
 */
router.post('/test-waypoints', async (req, res) => {
  try {
    const { 
      origin, 
      destination, 
      waypoints = [],
      profile = 'walking'
    } = req.body;
    
    console.log('🧪 複数ウェイポイントテスト開始:', {
      origin,
      destination, 
      waypoints,
      waypointCount: waypoints.length
    });
    
    // 入力検証
    if (!origin || !destination) {
      return res.status(400).json({
        success: false,
        message: '出発地と目的地が必要です'
      });
    }
    
    if (!waypoints || waypoints.length === 0) {
      return res.status(400).json({
        success: false,
        message: '最低1つのウェイポイントが必要です'
      });
    }
    
    // MapService直接呼び出し
    const result = await mapService.calculateRoute(
      origin,
      destination,
      waypoints,
      profile,
      { includeSteps: true }
    );
    
    if (result.success) {
      return res.status(200).json({
        success: true,
        message: `複数ウェイポイント経路計算成功`,
        data: {
          ...result.data,
          testInfo: {
            waypointsUsed: waypoints.length,
            totalDistance: result.data.distance,
            totalDuration: result.data.duration,
            coordinatesCount: result.data.coordinates ? result.data.coordinates.length : 0
          }
        }
      });
    } else {
      return res.status(500).json({
        success: false,
        message: `複数ウェイポイント経路計算失敗: ${result.message}`,
        error: result.error
      });
    }
    
  } catch (error) {
    console.error('複数ウェイポイントテストでエラー:', error);
    return res.status(500).json({
      success: false,
      message: 'テスト中にエラーが発生しました',
      error: error.message
    });
  }
});

module.exports = router;
