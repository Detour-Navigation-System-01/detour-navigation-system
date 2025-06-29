const jwt = require('jsonwebtoken');
const { AppError } = require('./errorHandler');
const SECRET_KEY = process.env.JWT_SECRET || 'your_jwt_secret';

module.exports = (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return next(new AppError('認証トークンが必要です', 401));
  }

  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, SECRET_KEY);
    req.user = decoded; // ここに userId や username が入る
    next();
  } catch (err) {
    return next(new AppError('トークンの検証に失敗しました', 403));
  }
};