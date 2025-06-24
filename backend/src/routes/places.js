// backend/src/routes/places.js
const express = require('express');
const router = express.Router();
const placeController = require('../controllers/placeController');
const { validateIdParam, validatePlaceData } = require('../middleware/validation'); 
const { uploadImage } = require('../middleware/uploadMiddleware'); // 新しいミドルウェアをインポート

/**
 * 場所管理API
 * @route /api/places
 */

// 場所一覧を取得
router.get('/', placeController.getAllPlaces);

// カテゴリー別の場所を取得 (特定IDの前に配置する必要があります)
router.get('/category/:category', placeController.getPlacesByCategory);

// 近隣の場所を検索 (特定IDの前に配置する必要があります)
router.get('/nearby', placeController.getNearbyPlaces);

// 特定の場所を取得
router.get('/:id', validateIdParam, placeController.getPlaceById);

// 新しい場所を作成
router.post('/', validatePlaceData, placeController.createPlace);

// 場所情報を更新
router.put('/:id', validateIdParam, validatePlaceData, placeController.updatePlace);

// 場所を削除
router.delete('/:id', validateIdParam, placeController.deletePlace);

// '/upload-image' パスで、uploadImageミドルウェアを使ってファイルを受け取り、controllerで処理
router.post('/upload-image', uploadImage, placeController.uploadPlaceImage);
module.exports = router;
