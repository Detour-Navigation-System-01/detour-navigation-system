// tests/unit/controller-test.js

/**
 * コントローラーとサービス層の連携をテストするためのスクリプト
 */
const userController = require('../../backend/src/controllers/userController');
const authController = require('../../backend/src/controllers/authController');
const placeController = require('../../backend/src/controllers/placeController');
const BaseController = require('../../backend/src/controllers/BaseController');

console.log('=== コントローラーテスト ===');

// 継承関係の確認
console.log('UserController は BaseController のインスタンスか？', userController instanceof BaseController);
console.log('AuthController は BaseController のインスタンスか？', authController instanceof BaseController);
console.log('PlaceController は BaseController のインスタンスか？', placeController instanceof BaseController);

// APIのエンドポイント一覧
console.log('\n=== APIエンドポイント ===');
console.log('\n-- ユーザーAPI --');
console.log('GET /api/users - 全ユーザー一覧取得');
console.log('GET /api/users/:id - 特定ユーザーの取得');
console.log('POST /api/users - 新規ユーザー作成');
console.log('PUT /api/users/:id - ユーザー情報更新');
console.log('DELETE /api/users/:id - ユーザー削除');

console.log('\n-- 認証API --');
console.log('POST /api/auth/login - ログイン');
console.log('POST /api/auth/register - ユーザー登録');
console.log('POST /api/auth/change-password/:id - パスワード変更');

console.log('\n-- 場所API --');
console.log('GET /api/places - 全場所一覧取得');
console.log('GET /api/places/:id - 特定場所の取得');
console.log('POST /api/places - 新規場所作成');
console.log('PUT /api/places/:id - 場所情報更新');
console.log('DELETE /api/places/:id - 場所削除');
console.log('GET /api/places/category/:category - カテゴリー別場所取得');
console.log('GET /api/places/nearby - 近隣の場所検索');

console.log('\n=== 動作確認方法 ===');
console.log('1. サーバーを起動: npm start');
console.log('2. 以下のテストファイルを使用して各APIをテスト:');
console.log('   - tests/api/users.http');
console.log('   - tests/api/auth.http');
console.log('   - tests/api/places.http');
