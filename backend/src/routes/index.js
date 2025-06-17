const express = require('express');
const router = express.Router();

//テスト用エンドポイント
router.get('/', (req, res) => {
  res.send('Hello from index route!'); 
});

//APIテスト用エンドポイント
router.get('/ping',(req, res)=>{
  res.json({message: 'pong from backend!'})
})



module.exports = router;