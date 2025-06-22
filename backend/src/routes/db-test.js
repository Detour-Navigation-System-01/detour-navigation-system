/**
 * データベースルーターのテスト用スクリプト
 * 
 * このスクリプトはExpressルーターとして実装され、
 * /api/db-testエンドポイントを提供します。
 */
const express = require('express');
const router = express.Router();
const db = require('../utils/db');

/**
 * データベース接続テスト用エンドポイント
 * 
 * このエンドポイントはPostgreSQLデータベースへの接続を確認し、
 * 現在の時刻を取得して表示します。
 */
router.get('/db-test', async (req, res) => {
  try {
    console.log('🔍 データベース接続をテストしています...');
    
    // シンプルなSELECT文でデータベース接続を確認
    const result = await db.query('SELECT NOW() as current_time');
    
    console.log('✅ データベース接続成功:', result.rows[0]);
    
    res.json({
      success: true,
      message: 'データベース接続に成功しました',
      currentTime: result.rows[0].current_time,
      databaseHost: process.env.DB_HOST || 'デフォルト(db)'
    });
  } catch (error) {
    console.error('❌ データベース接続エラー:', error);
    
    res.status(500).json({
      success: false,
      message: 'データベース接続中にエラーが発生しました',
      error: error.message,
      databaseHost: process.env.DB_HOST || 'デフォルト(db)'
    });
  }
});

module.exports = router;
