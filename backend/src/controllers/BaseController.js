// backend/src/controllers/BaseController.js

/**
 * 基本コントローラークラス
 * すべてのコントローラーの基盤となる共通機能を提供
 */
class BaseController {
  /**
   * コントローラーの名前を設定してインスタンスを初期化
   * @param {string} resourceName - 制御するリソースの名前（例: "user", "place"）
   */
  constructor(resourceName) {
    this.resourceName = resourceName;
  }

  /**
   * 成功レスポンスを生成
   * @param {Object} res - Expressレスポンスオブジェクト
   * @param {number} statusCode - HTTPステータスコード
   * @param {string} message - 成功メッセージ
   * @param {Object|Array} data - レスポンスデータ
   * @param {Object} meta - メタ情報（ページネーションなど）
   */
  sendSuccess(res, { statusCode = 200, message = '成功', data = null, meta = {} }) {
    return res.status(statusCode).json({
      status: 'success',
      message,
      data,
      meta
    });
  }

  /**
   * エラーレスポンスを生成
   * @param {Object} res - Expressレスポンスオブジェクト
   * @param {number} statusCode - HTTPステータスコード
   * @param {string} message - エラーメッセージ
   * @param {Object} errors - エラー詳細（複数可）
   */
  sendError(res, { statusCode = 400, message = 'エラーが発生しました', errors = {} }) {
    return res.status(statusCode).json({
      status: 'error',
      message,
      errors
    });
  }

  /**
   * ページネーション用メタ情報を生成
   * @param {number} total - 総レコード数
   * @param {number} page - 現在のページ番号
   * @param {number} limit - 1ページあたりの件数
   * @returns {Object} メタ情報
   */
  createPaginationMeta(total, page, limit) {
    const totalPages = Math.ceil(total / limit);
    
    return {
      total,
      page,
      limit,
      totalPages,
      hasNextPage: page < totalPages,
      hasPrevPage: page > 1
    };
  }

  /**
   * クエリパラメータからページネーション情報を取得
   * @param {Object} query - リクエストクエリオブジェクト
   * @returns {Object} ページネーション設定
   */
  getPaginationOptions(query) {
    const page = parseInt(query.page, 10) || 1;
    const limit = parseInt(query.limit, 10) || 10;
    const offset = (page - 1) * limit;
    
    return { page, limit, offset };
  }

  /**
   * クエリパラメータからソート情報を取得
   * @param {Object} query - リクエストクエリオブジェクト
   * @param {string} defaultSort - デフォルトのソートフィールド
   * @returns {Object} ソート設定
   */
  getSortOptions(query, defaultSort = 'created_at') {
    const sort = query.sort || defaultSort;
    const order = (query.order || 'desc').toLowerCase();
    const direction = ['asc', 'desc'].includes(order) ? order.toUpperCase() : 'DESC';
    
    return { sort, direction };
  }

  /**
   * リクエストからフィルターオプションを取得
   * @param {Object} query - リクエストクエリオブジェクト
   * @param {Array} allowedFields - フィルタリング可能なフィールド
   * @returns {Object} フィルター条件
   */
  getFilterOptions(query, allowedFields = []) {
    const filters = {};
    
    allowedFields.forEach(field => {
      if (query[field] !== undefined) {
        filters[field] = query[field];
      }
    });
    
    return filters;
  }
}

module.exports = BaseController;
