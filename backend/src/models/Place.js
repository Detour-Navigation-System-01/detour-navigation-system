// backend/src/models/Place.js
/**
 * @fileoverview Placeモデル
 * @description PlaceRepositoryを通じてDB操作を行うモデルクラス。場所データの作成、取得、更新、削除、検索を提供する。
 * @author 瀬下美華
 * @created 2025-06-25
 * @updated 2025-07-02
 * @version 1.1.0
 */
const placeRepository = require('../repositories/PlaceRepository'); // PlaceRepositoryのインスタンスをインポート

class Place {
  /**
   * 新しい場所データを作成します
   * @param {Object} placeData - 登録する場所の情報
   * @returns {Promise<Object>} 作成された場所データ
   */
  static async create(placeData) {
    return placeRepository.create(placeData); // BaseRepositoryから継承したメソッド
  }
  /**
   * IDを指定して場所を取得します
   * @param {number} id - 場所のID
   * @returns {Promise<Object|null>} 対象の場所データ（存在しない場合はnull）
   */
  static async findById(id) {
    return placeRepository.findById(id); // BaseRepositoryから継承したメソッド
  }
  /**
   * 条件に合致するすべての場所を取得します
   * @param {Object} [options={}] - 並び替え、フィルター、ページネーション等のオプション
   * @returns {Promise<{ data: Object[], total: number }>} 検索結果と総件数
   */
  static async findAll(options = {}) {
    return placeRepository.findAll(options); // BaseRepositoryから継承したメソッド
  }
  /**
   * IDを指定して場所情報を更新します
   * @param {number} id - 更新対象の場所ID
   * @param {Object} placeData - 更新内容を含むオブジェクト
   * @returns {Promise<Object>} 更新された場所データ
   */
  static async update(id, placeData) {
    return placeRepository.update(id, updateData); // BaseRepositoryから継承したメソッド
  }
  /**
   * IDを指定して場所を削除します
   * @param {number} id - 削除対象の場所ID
   * @returns {Promise<void>}
   */
  static async delete(id) {
    return placeRepository.delete(id); // BaseRepositoryから継承したメソッド
  }
  /**
   * カテゴリで場所を検索します
   * @param {string} category - カテゴリ名
   * @returns {Promise<Object[]>} 該当する場所データの配列
   */
  static async getByCategory(category) {
    return placeRepository.findByCategory(category); // PlaceRepository固有のメソッド
  }
  /**
   * 指定した地理的境界内に存在する場所を検索します
   * @param {number} north - 北端緯度
   * @param {number} south - 南端緯度
   * @param {number} east - 東端経度
   * @param {number} west - 西端経度
   * @returns {Promise<Object[]>} 境界内の場所リスト
   */
  static async searchByBounds(north, south, east, west) {
    return placeRepository.findByBounds(north, south, east, west); // PlaceRepository固有のメソッド
  }
  /**
   * 指定した座標と半径に基づき近隣の場所を検索します
   * @param {number} lat - 中心の緯度
   * @param {number} lng - 中心の経度
   * @param {number} radius - 半径（km）
   * @returns {Promise<Object[]>} 条件に該当する場所の配列
   */
  static async getNearby(lat, lng, radius) {
    return placeRepository.findNearby(lat, lng, radius); // PlaceRepository固有のメソッド
  }
}

module.exports = Place;