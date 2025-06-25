// backend/src/routes/places.js
const express = require('express');
const router = express.Router();
const placeController = require('../controllers/placeController');
const { validateIdParam, validatePlaceData } = require('../middleware/validation'); 
const { uploadImage } = require('../middleware/uploadMiddleware'); 
// JWT認証は使用しないので、authenticateUserのインポートはありません

/**
 * 場所管理API
 * @route /api/places
 */

router.get('/user/:id', validateIdParam, placeController.getPlacesByUserId);

router.get('/category/:category', placeController.getPlacesByCategory);
router.get('/nearby', placeController.getNearbyPlaces);
router.post('/upload-image', uploadImage, placeController.uploadPlaceImage);

router.get('/', placeController.getAllPlaces);

router.get('/:id', validateIdParam, placeController.getPlaceById);
router.put('/:id', validateIdParam, validatePlaceData, placeController.updatePlace);
router.delete('/:id', validateIdParam, placeController.deletePlace);

router.post('/', validatePlaceData, placeController.createPlace);

module.exports = router;
