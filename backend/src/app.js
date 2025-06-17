const express = require('express');
const app = express();
const indexRoutes = require('./routes/index');

const cors = require('cors');
app.use(cors()); 

app.use(express.json());

app.use('/api',indexRoutes);

app.get('/', (req, res) => {
  res.send('Hello from backend!');
});


module.exports = app;