const jwt = require('jsonwebtoken');
const { AppError } = require('./errorHandler');
const SECRET_KEY = process.env.JWT_SECRET || 'your_jwt_secret';

module.exports = (req, res, next) => {
  const token = req.cookies?.token; // ← ここがポイント

  if (!token) {
    return next(new AppError('認証トークンが見つかりません（Cookie）', 401));
  }

  try {
    const decoded = jwt.verify(token, SECRET_KEY);
    req.user = decoded;
    next();
  } catch (err) {
    return next(new AppError('トークンの検証に失敗しました', 403));
  }
};
