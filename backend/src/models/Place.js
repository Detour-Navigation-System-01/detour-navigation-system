// backend/src/models/Place.js
const placeRepository = require('../repositories/PlaceRepository'); // PlaceRepositoryのインスタンスをインポート

class Place {
  static async create(placeData) {
    return placeRepository.create(placeData); // BaseRepositoryから継承したメソッド
  }
  static async findById(id) {
    return placeRepository.findById(id); // BaseRepositoryから継承したメソッド
  }
  static async findAll(options = {}) {
    return placeRepository.findAll(options); // BaseRepositoryから継承したメソッド
  }
  static async update(id, placeData) {
    // ... updateData のフィルタリングロジック ...
    return placeRepository.update(id, updateData); // BaseRepositoryから継承したメソッド
  }
  static async delete(id) {
    return placeRepository.delete(id); // BaseRepositoryから継承したメソッド
  }
  static async getByCategory(category) {
    return placeRepository.findByCategory(category); // PlaceRepository固有のメソッド
  }
  static async searchByBounds(north, south, east, west) {
    return placeRepository.findByBounds(north, south, east, west); // PlaceRepository固有のメソッド
  }
  static async getNearby(lat, lng, radius) {
    return placeRepository.findNearby(lat, lng, radius); // PlaceRepository固有のメソッド
  }
}

module.exports = Place;