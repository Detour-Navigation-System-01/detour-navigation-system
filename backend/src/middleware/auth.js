const jwt = require('jsonwebtoken');
const { AppError } = require('./errorHandler');
const tokenBlacklistRepo = require('../repositories/TokenBlacklistRepository');
const SECRET_KEY = process.env.JWT_SECRET || 'your_jwt_secret';

module.exports = async (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return next(new AppError('認証トークンが必要です', 401));
  }

  const token = authHeader.split(' ')[1];
  try {
    // トークンがブラックリストに含まれているかチェック
    const isBlacklisted = await tokenBlacklistRepo.isBlacklisted(token);
    if (isBlacklisted) {
      return next(new AppError('このトークンは無効化されています', 401));
    }

    const decoded = jwt.verify(token, SECRET_KEY);
    req.user = decoded; // ここに userId や username が入る
    req.token = token; // トークン自体も保存（ログアウト時などに使用）
    next();
  } catch (err) {
    return next(new AppError('トークンの検証に失敗しました', 403));
  }
};