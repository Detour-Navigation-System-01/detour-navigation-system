/**
 * OSRM APIの接続テストスクリプト
 */
require('dotenv').config();
const MapService = require('./src/services/mapService');

// MapServiceのインスタンス作成
const mapService = new MapService();

// 接続テスト実行
(async () => {
  try {
    console.log('OSRM APIへの接続テストを開始します...');
    const result = await mapService.testConnection();
    console.log('\nテスト結果:');
    console.log(JSON.stringify(result, null, 2));
    
    if (result.success) {
      console.log('\n✅ 接続テスト成功!');
      console.log(`距離: ${result.data.distance}m`);
      console.log(`所要時間: ${result.data.duration}秒`);
    } else {
      console.log('\n❌ 接続テスト失敗');
      console.log(`エラー: ${result.message}`);
    }
  } catch (error) {
    console.error('❌ テスト実行中にエラーが発生しました:', error);
  }
})();
