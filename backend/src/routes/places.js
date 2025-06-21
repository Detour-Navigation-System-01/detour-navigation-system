// backend/src/routes/places.js
const express = require('express');
const router = express.Router();
const placeController = require('../controllers/placeController');
const { validatePlaceData, validateIdParam } = require('../middleware/validation');

/**
 * 場所管理API
 * @route /api/places
 */

// 場所一覧を取得
router.get('/places', placeController.getAllPlaces);

// 特定の場所を取得
router.get('/places/:id', validateIdParam, placeController.getPlaceById);

// 新しい場所を作成
router.post('/places', validatePlaceData, placeController.createPlace);

// 場所情報を更新
router.put('/places/:id', validateIdParam, validatePlaceData, placeController.updatePlace);

// 場所を削除
router.delete('/places/:id', validateIdParam, placeController.deletePlace);

// カテゴリー別の場所を取得
router.get('/places/category/:category', placeController.getPlacesByCategory);

// 近隣の場所を検索
router.get('/places/nearby', placeController.getNearbyPlaces);

module.exports = router;
