// routes/test_route.js を作成

const express = require('express');
const router = express.Router();
const app = express();
const port = process.env.PORT || 3000;
const { testDbConnection } = require('./db_test'); // db_test.js をインポート

// 例: /test-db というURLにアクセスしたらDB接続テストを実行する
router.get('/test-db', async (req, res) => {
  try {
    const currentTime = await testDbConnection();
    res.status(200).json({ message: 'DB connection successful', currentTime: currentTime });
  } catch (error) {
    res.status(500).json({ message: 'DB connection failed', error: error.message });
  }
});

module.exports = router;