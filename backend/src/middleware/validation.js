// backend/src/middleware/validation.js

/**
 * リクエスト入力のバリデーションミドルウェア
 * このモジュールは、APIエンドポイントへの入力を検証するためのミドルウェア関数を提供する
 */
const { AppError } = require('./errorHandler');

// ユーザー登録/更新の入力データを検証
const validateUserData = (req, res, next) => {
  const { username, email, password } = req.body;
  const errors = [];

  // POST（新規作成）の場合は必須フィールドを確認
  if (req.method === 'POST') {
    if (!username) errors.push('ユーザー名は必須です');
    if (!email) errors.push('メールアドレスは必須です');
    if (!password) errors.push('パスワードは必須です');
  }

  // emailが存在する場合、形式を検証
  if (email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      errors.push('有効なメールアドレスを入力してください');
    }
  }

  // usernameが存在する場合、長さと文字を検証
  if (username) {
    if (username.length < 3 || username.length > 30) {
      errors.push('ユーザー名は3～30文字である必要があります');
    }
    // 英数字とアンダースコアのみ許可
    const usernameRegex = /^[a-zA-Z0-9_]+$/;
    if (!usernameRegex.test(username)) {
      errors.push('ユーザー名には英数字とアンダースコアのみ使用できます');
    }
  }

  // passwordが存在する場合、長さを検証
  if (password && password.length < 6) {
    errors.push('パスワードは6文字以上である必要があります');
  }

  // エラーがある場合は400エラーを返す
  if (errors.length > 0) {
    return next(new AppError(errors.join('、'), 400));
  }

  next();
};

// IDパラメータを検証
const validateIdParam = (req, res, next) => {
  const { id } = req.params;
  
  if (!id || isNaN(parseInt(id))) {
    return next(new AppError('有効なIDを指定してください', 400));
  }
  
  // IDを数値に変換してリクエストオブジェクトに追加
  req.parsedId = parseInt(id);
  next();
};

module.exports = {
  validateUserData,
  validateIdParam
};
