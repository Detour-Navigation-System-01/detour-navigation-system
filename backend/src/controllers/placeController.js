// backend/src/controllers/placeController.js

const BaseController = require('./BaseController');
const { catchAsync } = require('../middleware/errorHandler');
const placeService = require('../services/placeService');

const Place = require('../models/Place');
const path = require('path');

/**
 * 場所コントローラークラス
 * 場所関連のリクエストを処理
 */
class PlaceController extends BaseController {
  constructor() {
    super('place'); // リソース名を指定して基底クラスのコンストラクタを呼び出す
  }

  /**
   * 場所一覧を取得
   */
  getAllPlaces = catchAsync(async (req, res) => {
    console.log('場所一覧取得処理を開始します');
    
    // クエリパラメータからオプションを取得
    const { page, limit, offset } = this.getPaginationOptions(req.query);
    const { sort, direction } = this.getSortOptions(req.query, 'created_at');
    const filters = this.getFilterOptions(req.query, ['name', 'category', 'prefecture']);
    
    // サービスにオプションを渡して場所取得
    const options = { 
      orderBy: sort, 
      direction, 
      limit, 
      offset, 
      filters 
    };
    
    const result = await placeService.getAllPlaces(options);
    const places = result.data;
    
    console.log(`${places.length}件の場所情報を取得しました`);
    
    // 成功レスポンスを送信
    return this.sendSuccess(res, {
      message: '場所一覧を取得しました',
      data: places,
      meta: this.createPaginationMeta(result.total, page, limit)
    });
  });

  /**
   * 特定の場所を取得
   */
  getPlaceById = catchAsync(async (req, res) => {
    // validateIdParamミドルウェアで検証済みのIDを使用
    const placeId = req.parsedId;
    
    console.log(`場所ID: ${placeId} の情報を取得します`);
    const place = await placeService.getPlaceById(placeId);
    
    // 成功レスポンスを送信
    return this.sendSuccess(res, {
      message: `場所ID: ${placeId} の情報を取得しました`,
      data: place
    });
  });

  /**
   * 新しい場所を作成
   */
  createPlace = catchAsync(async (req, res) => {
    const { name, description, category, address, prefecture, lat, lng, image_url } = req.body;
    
    // JWTから認証済みユーザーのIDを取得
    const authUserId = req.user?.id;
    if (!authUserId) {
      return this.sendError(res, {
        statusCode: 401,
        message: '認証されていないユーザーです'
      });
    }
    
    console.log(`認証ユーザーID: ${authUserId} が新しい場所を登録します:`, { name });

    const newPlace = await placeService.createPlace({
      name,
      description,
      category,
      address,
      prefecture,
      lat,
      lng,
      image_url: image_url || null, // image_urlがない場合はnullをセット
      userId: authUserId // 認証済みユーザーIDを使用
    });
    
    // 成功レスポンスを送信
    return this.sendSuccess(res, {
      statusCode: 201,
      message: '場所が正常に登録されました',
      data: newPlace
    });
  });

  /**
   * 場所情報を更新（作成者のみ可能）
   */
  updatePlace = catchAsync(async (req, res) => {
    const placeId = req.parsedId;
    const authUserId = req.user?.id;
    
    // 更新前に場所の所有者チェック
    const place = await placeService.getPlaceById(placeId);
    
    // デバッグ情報を出力（データベースのカラム名はuserId）
    console.log(`場所の所有者チェック - 場所ID: ${placeId}, 場所データ:`, place);
    console.log(`認証ユーザーID: ${authUserId} (型: ${typeof authUserId})`);
    
    // 場所の作成者IDと認証ユーザーIDが一致するかチェック（型変換を行う、フィールド名はuserIdを使用）
    if (parseInt(place.userid) !== authUserId) {
      console.log(`認証ユーザーID: ${authUserId} が他のユーザーの場所ID: ${placeId} (所有者ID: ${place.userid}) を更新しようとしています`);
      return this.sendError(res, {
        statusCode: 403,
        message: 'この場所を更新する権限がありません'
      });
    }
    
    const { name, description, category, address, prefecture, lat, lng, image_url } = req.body;
    
    // 更新データをオブジェクトに集約
    const updateData = {};
    if (name !== undefined) updateData.name = name;
    if (description !== undefined) updateData.description = description;
    if (category !== undefined) updateData.category = category;
    if (address !== undefined) updateData.address = address;
    if (prefecture !== undefined) updateData.prefecture = prefecture;
    if (lat !== undefined) updateData.lat = lat;
    if (lng !== undefined) updateData.lng = lng;
    if (image_url !== undefined) updateData.image_url = image_url;
    
    console.log(`場所ID: ${placeId} の情報を更新します (ユーザーID: ${authUserId})`);
    const updatedPlace = await placeService.updatePlace(placeId, updateData);
    
    // 成功レスポンスを送信
    return this.sendSuccess(res, {
      message: '場所情報が正常に更新されました',
      data: updatedPlace
    });
  });

  /**
   * 場所を削除（作成者のみ可能）
   */
  deletePlace = catchAsync(async (req, res) => {
    const placeId = req.parsedId;
    const authUserId = req.user?.id;
    
    // 削除前に場所の所有者チェック
    const place = await placeService.getPlaceById(placeId);
    
    // デバッグ情報を出力（データベースのカラム名はuserId）
    console.log(`場所の所有者チェック - 場所ID: ${placeId}, 場所データ:`, place);
    console.log(`認証ユーザーID: ${authUserId} (型: ${typeof authUserId})`);
    
    // 場所の作成者IDと認証ユーザーIDが一致するかチェック（型変換を行う、フィールド名はuserIdを使用）
    if (parseInt(place.userid) !== authUserId) {
      console.log(`認証ユーザーID: ${authUserId} が他のユーザーの場所ID: ${placeId} (所有者ID: ${place.userid}) を削除しようとしています`);
      return this.sendError(res, {
        statusCode: 403,
        message: 'この場所を削除する権限がありません'
      });
    }
    
    console.log(`場所ID: ${placeId} を削除します (ユーザーID: ${authUserId})`);
    await placeService.deletePlace(placeId);
    
    // 成功レスポンスを送信
    return this.sendSuccess(res, {
      message: `ID: ${placeId} の場所が正常に削除されました`
    });
  });
  
  /**
   * カテゴリー別の場所を取得
   */
  getPlacesByCategory = catchAsync(async (req, res) => {
    const category = req.params.category;
    const { page, limit, offset } = this.getPaginationOptions(req.query);
    
    console.log(`カテゴリー: ${category} の場所を取得します`);
    const result = await placeService.getPlacesByCategory(category, { limit, offset });
    
    // 成功レスポンスを送信
    return this.sendSuccess(res, {
      message: `カテゴリー: ${category} の場所を取得しました`,
      data: result.data,
      meta: this.createPaginationMeta(result.total, page, limit)
    });
  });
  
  /**
   * 近隣の場所を検索
   */
  getNearbyPlaces = catchAsync(async (req, res) => {
    const { lat, lng, radius = 5 } = req.query;
    
    if (!lat || !lng) {
      return this.sendError(res, {
        statusCode: 400,
        message: '緯度と経度が必要です'
      });
    }
    
    console.log(`緯度: ${lat}, 経度: ${lng} の近隣場所を検索します (半径: ${radius}km)`);
    const places = await placeService.getNearbyPlaces(parseFloat(lat), parseFloat(lng), parseFloat(radius));
    
    // 成功レスポンスを送信
    return this.sendSuccess(res, {
      message: '近隣の場所を取得しました',
      data: places
    });
  });    /**
   * @desc 画像をローカルにアップロードし、そのURLを返す
   * @route POST /api/places/upload-image
   * @access Private (認証済みユーザーのみ)
   */
  uploadPlaceImage = catchAsync(async (req, res) => {
    // 認証ユーザーIDの確認
    const authUserId = req.user?.id;
    if (!authUserId) {
      return this.sendError(res, {
        statusCode: 401,
        message: '認証されていないユーザーです'
      });
    }
    
    // uploadImageミドルウェアがreq.fileにファイル情報をセットしてくれる
    if (!req.file) {
      return this.sendError(res, {
        statusCode: 400,
        message: 'No image file uploaded.'
      });
    }

    const fileName = req.file.filename; // multerが生成したファイル名
    
    // クライアントがアクセスするための完全なURLを構築
    // 例: http://localhost:3001/images/your-uploaded-image.jpg
    const imageUrl = `${req.protocol}://${req.get('host')}/images/${fileName}`;

    // 成功レスポンスを送信
    return this.sendSuccess(res, {
      message: '画像がアップロードされました',
      data: { 
        fileName: fileName,
        imageUrl: imageUrl,
        path: `/images/${fileName}` 
      }
    });
    return this.sendSuccess(res, {
      message: '近隣の場所を取得しました',
      data: places
    });
  });

  /**
   * ユーザーIDを指定してそのアカウントの保存スポット情報だけを取得
   */
  getPlacesByUserId = catchAsync(async (req, res) => {
    // validateIdParamミドルウェアで検証済みのユーザーIDを使用
    const userId = req.parsedId;

    console.log(`ユーザーID: ${userId} に紐づく場所情報を取得します`);

    // クエリパラメータからページネーションオプションを取得
    const { page, limit, offset } = this.getPaginationOptions(req.query);

    const options = {
      orderBy: 'created_at',
      direction: 'desc',
      limit,
      offset
    };

    const result = await placeService.getPlacesByUserId(userId, options);
    const places = result.data;

    console.log(`ユーザーID: ${userId} のために ${places.length}件の場所情報を取得しました`);

    // 成功レスポンスを送信
    return this.sendSuccess(res, {
      message: `ユーザーID: ${userId} に紐づく場所一覧を取得しました`,
      data: places,
      meta: this.createPaginationMeta(result.total, page, limit)
    });
  });

  /**
   * 現在認証されているユーザー自身の登録場所を取得
   */
  getPlacesByCurrentUser = catchAsync(async (req, res) => {
    // JWTから認証済みユーザーのIDを取得
    const authUserId = req.user?.id;
    if (!authUserId) {
      return this.sendError(res, {
        statusCode: 401,
        message: '認証されていないユーザーです'
      });
    }

    console.log(`現在のユーザーID: ${authUserId} に紐づく場所情報を取得します`);

    // クエリパラメータからページネーションオプションを取得
    const { page, limit, offset } = this.getPaginationOptions(req.query);

    const options = {
      orderBy: 'created_at',
      direction: 'desc',
      limit,
      offset
    };

    const result = await placeService.getPlacesByUserId(authUserId, options);
    const places = result.data;

    console.log(`現在のユーザーID: ${authUserId} のために ${places.length}件の場所情報を取得しました`);

    // 成功レスポンスを送信
    return this.sendSuccess(res, {
      message: '自分が登録した場所一覧を取得しました',
      data: places,
      meta: this.createPaginationMeta(result.total, page, limit)
    });
  });

  /**
   * 公開設定ONのユーザーのスポットを取得
   */
  getPublicPlaces = catchAsync(async (req, res) => {
    console.log('公開設定ONのユーザーのスポット一覧取得処理を開始します');
    
    // クエリパラメータからオプションを取得
    const { page, limit, offset } = this.getPaginationOptions(req.query);
    const { sort, direction } = this.getSortOptions(req.query, 'created_at');
    const filters = this.getFilterOptions(req.query, ['name', 'category', 'prefecture']);
    
    // サービスにオプションを渡して場所取得
    const options = { 
      orderBy: sort, 
      direction, 
      limit, 
      offset, 
      filters 
    };
    
    const result = await placeService.getPublicPlaces(options);
    const places = result.data;
    
    console.log(`${places.length}件の公開スポットを取得しました`);
    
    // 成功レスポンスを送信
    return this.sendSuccess(res, {
      message: '公開設定ONのユーザーのスポット一覧を取得しました',
      data: places,
      meta: this.createPaginationMeta(result.total, page, limit)
    });
  });
}

// シングルトンインスタンスとしてエクスポート
module.exports = new PlaceController();
