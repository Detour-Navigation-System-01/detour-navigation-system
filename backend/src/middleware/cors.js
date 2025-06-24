// backend/src/middleware/cors.js
const cors = require('cors');

const corsOptions = {
  origin: 'http://localhost:3000',
  credentials: true, 
};

module.exports = () => cors(corsOptions); 
