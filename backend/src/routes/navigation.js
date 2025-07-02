/**
 * @fileoverview ナビゲーションAPIルーティング
 * @description ナビゲーション機能に関するAPIエンドポイントの定義
 * @author 中西陽之介
 * @created 2025-06-18
 * @updated 2025-07-03
 * @version 1.0.1
 */

const express = require('express');
const router = express.Router();
const MapService = require('../services/mapService');

// MapServiceのインスタンス作成
const mapService = new MapService();

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

module.exports = router;
