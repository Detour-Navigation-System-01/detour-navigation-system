/**
 * @fileoverview エラーハンドリングミドルウェア
 * @description アプリケーション全体のエラー処理を担当し、一貫した形式でクライアントにレスポンスを返す
 * @author 中西陽之介
 * @created 2025-06-15
 * @updated 2025-07-03
 * @version 1.0.0
 */

// カスタムエラークラス - HTTPステータスコードを指定できる
class AppError extends Error {
  constructor(message, statusCode) {
    super(message);
    this.statusCode = statusCode;
    this.status = `${statusCode}`.startsWith('4') ? 'fail' : 'error';
    this.isOperational = true; // 運用上のエラーとして識別

    Error.captureStackTrace(this, this.constructor);
  }
}

// エラーハンドラーミドルウェア
const errorHandler = (err, req, res, next) => {
  // ステータスコードのデフォルト値
  err.statusCode = err.statusCode || 500;
  err.status = err.status || 'error';
  
  // デバッグ情報をコンソールに出力
  console.error('🚨 エラー発生:', {
    message: err.message,
    stack: err.stack,
    statusCode: err.statusCode
  });

  // PostgreSQLのエラーを処理
  if (err.code === '23505') { // 一意性制約違反
    err.message = 'このユーザー名またはメールアドレスは既に使用されています';
    err.statusCode = 409; // Conflict
  }
  
  // クライアントにレスポンス
  res.status(err.statusCode).json({
    status: err.status,
    message: err.message,
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
};

// 存在しないルートのハンドリング
const notFoundHandler = (req, res, next) => {
  const error = new AppError(`リクエストされたパス ${req.originalUrl} が見つかりません`, 404);
  next(error);
};

// 非同期関数のエラーをキャッチするためのラッパー
const catchAsync = (fn) => {
  return (req, res, next) => {
    fn(req, res, next).catch(next);
  };
};

module.exports = {
  AppError,
  errorHandler,
  notFoundHandler,
  catchAsync
};
