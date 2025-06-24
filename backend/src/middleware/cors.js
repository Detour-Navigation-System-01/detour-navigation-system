const cors = require('cors');

const corsOptions = {
  origin: 'http://localhost:3000',
  credential: true,
};

app.use(cors(corsOptions));