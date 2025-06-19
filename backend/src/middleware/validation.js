// backend/src/middleware/validation.js

/**
 * リクエスト入力のバリデーションミドルウェア
 * このモジュールは、APIエンドポイントへの入力を検証するためのミドルウェア関数を提供する
 * 各種データの検証や型変換を行い、無効な入力を早期に検出して適切なエラーメッセージを返す
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

// 場所データの検証
const validatePlaceData = (req, res, next) => {
  const { name, description, category, address, prefecture, lat, lng } = req.body;
  const errors = [];

  // POST（新規作成）の場合は必須フィールドを確認
  if (req.method === 'POST') {
    if (!name) errors.push('場所の名称は必須です');
    if (!category) errors.push('カテゴリーは必須です');
    if (!address) errors.push('住所は必須です');
    if (!prefecture) errors.push('都道府県は必須です');
    if (lat === undefined) errors.push('緯度は必須です');
    if (lng === undefined) errors.push('経度は必須です');
  }

  // 緯度と経度の形式を検証
  if (lat !== undefined && (isNaN(lat) || lat < -90 || lat > 90)) {
    errors.push('緯度は-90から90の範囲の数値である必要があります');
  }
  if (lng !== undefined && (isNaN(lng) || lng < -180 || lng > 180)) {
    errors.push('経度は-180から180の範囲の数値である必要があります');
  }

  // nameが存在する場合、長さを検証
  if (name && (name.length < 1 || name.length > 100)) {
    errors.push('名称は1～100文字である必要があります');
  }

  // descriptionが存在する場合、長さを検証
  if (description && description.length > 1000) {
    errors.push('説明は1000文字以内である必要があります');
  }

  // エラーがある場合は400エラーを返す
  if (errors.length > 0) {
    return next(new AppError(errors.join('、'), 400));
  }

  // 緯度と経度を数値型に変換
  if (lat !== undefined) req.body.lat = parseFloat(lat);
  if (lng !== undefined) req.body.lng = parseFloat(lng);

  next();
};

// ルートデータの検証
const validateRouteData = (req, res, next) => {
  const { name, origin_id, destination_id, waypoints, description } = req.body;
  const errors = [];

  // POST（新規作成）の場合は必須フィールドを確認
  if (req.method === 'POST') {
    if (!name) errors.push('ルート名は必須です');
    if (!origin_id) errors.push('出発地点IDは必須です');
    if (!destination_id) errors.push('目的地IDは必須です');
  }

  // nameが存在する場合、長さを検証
  if (name && (name.length < 1 || name.length > 100)) {
    errors.push('ルート名は1～100文字である必要があります');
  }

  // descriptionが存在する場合、長さを検証
  if (description && description.length > 1000) {
    errors.push('説明は1000文字以内である必要があります');
  }

  // waypointsの形式を検証
  if (waypoints) {
    if (!Array.isArray(waypoints)) {
      errors.push('waypointsは配列である必要があります');
    } else {
      // 各waypointがplace_idを持っていることを確認
      for (let i = 0; i < waypoints.length; i++) {
        if (!waypoints[i].place_id) {
          errors.push(`waypoints[${i}]にはplace_idが必要です`);
        }
      }
    }
  }

  // origin_idとdestination_idが数値かどうかを確認
  if (origin_id && isNaN(parseInt(origin_id))) {
    errors.push('出発地点IDは数値である必要があります');
  }
  if (destination_id && isNaN(parseInt(destination_id))) {
    errors.push('目的地IDは数値である必要があります');
  }

  // エラーがある場合は400エラーを返す
  if (errors.length > 0) {
    return next(new AppError(errors.join('、'), 400));
  }

  // IDを数値型に変換
  if (origin_id) req.body.origin_id = parseInt(origin_id);
  if (destination_id) req.body.destination_id = parseInt(destination_id);

  next();
};

module.exports = {
  validateUserData,
  validateIdParam,
  validatePlaceData,
  validateRouteData
};
