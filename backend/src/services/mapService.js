/**
 * マップサービスクラス - 外部地図API(OSRM)とのインテグレーションを処理
 */

const axios = require('axios');
require('dotenv').config();

class MapService {
  /**
   * MapServiceのコンストラクタ
   * @constructor
   */
  constructor() {
    this.baseUrl = process.env.OSRM_API_URL;
    
    if (!this.baseUrl) {
      throw new Error('OSRM API URL is not defined in environment variables');
    }
    
    console.log(`MapService initialized with base URL: ${this.baseUrl}`);
  }

  /**
   * OSRMサーバーとの接続をテストするメソッド
   * 東京駅から皇居までの固定ルートでテスト
   * @returns {Promise<Object>} テスト結果
   */
  async testConnection() {
    try {
      // 東京駅の座標 (経度, 緯度)
      const startPoint = [139.7671, 35.6812];
      // 皇居の座標 (経度, 緯度)
      const endPoint = [139.7528, 35.6853];
      
      const coordinatesString = `${startPoint[0]},${startPoint[1]};${endPoint[0]},${endPoint[1]}`;
      const url = `${this.baseUrl}/route/v1/driving/${coordinatesString}?overview=full`;
      
      console.log(`Sending test request to: ${url}`);
      
      const response = await axios.get(url);
      
      if (response.status === 200 && response.data.code === 'Ok') {
        console.log('OSRM connection test successful');
        return {
          success: true,
          message: 'Connection to OSRM API successful',
          data: {
            distance: response.data.routes[0].distance,
            duration: response.data.routes[0].duration,
            coordinates: response.data.routes[0].geometry
          }
        };
      } else {
        console.error('OSRM connection test failed with unexpected response', response.data);
        return {
          success: false,
          message: 'Unexpected response from OSRM API',
          error: response.data
        };
      }
    } catch (error) {
      console.error('Error testing connection to OSRM:', error.message);
      return {
        success: false,
        message: 'Failed to connect to OSRM API',
        error: error.message
      };
    }
  }
}

module.exports = MapService;
