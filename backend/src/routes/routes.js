/**
 * 経路計算関連のルーター
 */

const express = require('express');
const router = express.Router();
const MapService = require('../services/mapService');
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
 * @desc    出発地から目的地までの経路を計算
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
      includeAnnotations = false
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
    
    // MapServiceを使用して経路計算（従来の方法）
    const result = await mapService.calculateRoute(
      origin,
      destination,
      waypoints,
      profile,
      { includeSteps, includeAnnotations }
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
 * @access  Public
 */
router.post('/save', (req, res) => routeController.calculateRoute(req, res));

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
 * @desc    経路の詳細を取得する
 * @access  Public
 */
router.get('/:id', (req, res) => routeController.getRouteDetails(req, res));

module.exports = router;
