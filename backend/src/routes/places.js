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

router.get('/search-by-bounds', async (req, res) => {
    const { north, south, east, west } = req.query;
    
if (!north || !south || !east || !west ||
      isNaN(north) || isNaN(south) || isNaN(east) || isNaN(west)) {
    return res.status(400).json({ error: 'Missing or invalid geographic coordinates. Please provide valid north, south, east, and west parameters.' });
}
const latNorth = parseFloat(north);
const latSouth = parseFloat(south);
const lngEast = parseFloat(east);
const lngWest = parseFloat(west);
try {
    // 2. データベースクエリの実行
    const queryText = `
      SELECT id, name, description, category, address, prefecture, lat, lng, image_url
      FROM places
      WHERE lat <= $1 AND lat >= $2
        AND lng <= $3 AND lng >= $4;
    `;
    const queryParams = [latNorth, latSouth, lngEast, lngWest];

    const { rows } = await db.query(queryText, queryParams);

    // 3. レスポンスの送信
    // 取得した行データをJSON形式でクライアントに返す
    res.json(rows);

  } catch (err) {
    console.error('Error executing query', err.stack);
    res.status(500).json({ error: 'An error occurred while fetching places.' });
  }
});

module.exports = router;
