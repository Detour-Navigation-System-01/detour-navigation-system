// backend/src/routes/places.js
/**
 * @fileoverview Placeルーティング
 * @description 場所に関するエンドポイントを定義（公開スポット、作成、編集、削除など）
 * @author 瀬下美華
 * @created 2025-06-15
 * @updated 2025-07-02
 * @version 1.0.1
 */
const express = require('express');
const router = express.Router();
const placeController = require('../controllers/placeController');
const { validateIdParam, validatePlaceData } = require('../middleware/validation'); 
const { uploadImage } = require('../middleware/uploadMiddleware'); 
const authenticate = require('../middleware/auth'); // JWT認証をインポート

/**
 * 場所管理API
 * @route /api/places
 */

// 認証が不要な公開エンドポイント
router.get('/public', placeController.getPublicPlaces); // 新規: 公開設定ONのユーザーのスポットを取得
router.get('/user/:id', validateIdParam, placeController.getPlacesByUserId);
router.get('/category/:category', placeController.getPlacesByCategory);
router.get('/nearby', placeController.getNearbyPlaces);
router.get('/', placeController.getAllPlaces);
router.get('/:id', validateIdParam, placeController.getPlaceById);

// 認証が必要だが、別途パスパラメータは不要なエンドポイント
router.get('/me/places', authenticate, placeController.getPlacesByCurrentUser);

// 認証が必要なエンドポイント
router.post('/upload-image', authenticate, uploadImage, placeController.uploadPlaceImage);
router.put('/:id', authenticate, validateIdParam, validatePlaceData, placeController.updatePlace);
router.delete('/:id', authenticate, validateIdParam, placeController.deletePlace);
router.post('/', authenticate, validatePlaceData, placeController.createPlace);

module.exports = router;
