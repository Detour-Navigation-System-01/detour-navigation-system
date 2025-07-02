// backend/src/middleware/cors.js
const cors = require('cors');

const corsOptions = {
  // すべてのオリジンを許可（開発環境のみ推奨）
  origin: ['http://localhost:3000', 'http://127.0.0.1:5500', 'null', 'file://', '*'],
  credentials: true, 
  methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
  allowedHeaders: ['Content-Type', 'Authorization']
};

module.exports = () => cors(corsOptions); 
