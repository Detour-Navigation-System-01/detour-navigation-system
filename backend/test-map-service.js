/**
 * MapService の経路計算機能をテストするスクリプト
 * 計算された経路をHTML形式で表示し、Leaflet地図上で視覚化します
 * Docker環境内でも実行できるように調整されています
 * 実行方法
 * ・docker exec -it detour-navigation-system-backend-1 bash
 * ・node /app/test-map-service.js
 * ・test-results/map-service-test-results.html をブラウザで開く
 */

require('dotenv').config();
const fs = require('fs');
const path = require('path');
const MapService = require('./src/services/mapService');

// テストに使用する座標（いくつかのサンプル地点）
const testLocations = {
  tokyoStation: { lat: 35.6812, lng: 139.7671, name: '東京駅' },
  imperialPalace: { lat: 35.6853, lng: 139.7528, name: '皇居' },
  asakusa: { lat: 35.7147, lng: 139.7967, name: '浅草' },
  shibuya: { lat: 35.6580, lng: 139.7016, name: '渋谷' },
  shinjuku: { lat: 35.6938, lng: 139.7034, name: '新宿' },
  ueno: { lat: 35.7140, lng: 139.7767, name: '上野' }
};

// テスト用の経路組み合わせ
const routeTests = [
  {
    name: 'Route 1: 東京駅 → 皇居',
    origin: testLocations.tokyoStation,
    destination: testLocations.imperialPalace,
    waypoints: []
  },
  {
    name: 'Route 2: 東京駅 → 浅草',
    origin: testLocations.tokyoStation,
    destination: testLocations.asakusa,
    waypoints: []
  },
  {
    name: 'Route 3: 渋谷 → 新宿 → 上野',
    origin: testLocations.shibuya,
    destination: testLocations.ueno,
    waypoints: [testLocations.shinjuku]
  }
];

// レポート用HTML
let htmlReport = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>MapService 経路計算テスト結果</title>
  <style>
    body { font-family: Arial, sans-serif; margin: 20px; }
    h1 { color: #333; }
    .route-section { margin-bottom: 30px; border: 1px solid #ddd; padding: 15px; border-radius: 5px; }
    .route-header { background-color: #f5f5f5; padding: 10px; margin-bottom: 15px; border-radius: 3px; }
    .route-details { margin-bottom: 15px; }
    .route-details table { border-collapse: collapse; width: 100%; }
    .route-details th, .route-details td { border: 1px solid #ddd; padding: 8px; text-align: left; }
    .route-details th { background-color: #f2f2f2; }
    .map-container { height: 400px; margin-bottom: 20px; }
    .success { color: green; }
    .error { color: red; }
    .steps { margin-top: 20px; }
    .step { margin-bottom: 10px; padding: 10px; background-color: #f9f9f9; border-left: 3px solid #007bff; }
  </style>
  <!-- Leaflet CSS と JS -->
  <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" integrity="sha256-p4NxAoJBhIIN+hmNHrzRCf9tD/miZyoHS5obTRR9BMY=" crossorigin="" />
  <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js" integrity="sha256-20nQCchB9co0qIjJZRGuk2/Z9VM+kNiyxNV1lvTlZBo=" crossorigin=""></script>
  <script src="https://unpkg.com/@mapbox/polyline@1.2.0/src/polyline.js"></script>
</head>
<body>
  <h1>MapService 経路計算テスト結果</h1>
  <p>テスト実行日時: ${new Date().toLocaleString('ja-JP')}</p>
  <div id="test-results">
    <!-- テスト結果がここに挿入されます -->
  </div>
</body>
</html>
`;

// MapServiceのインスタンス作成
const mapService = new MapService();

/**
 * テストを実行し、HTMLレポートを生成する
 */
async function runTests() {
  console.log('MapService 経路計算テストを開始します...');
  
  let testResultsHtml = '';
  
  try {
    for (let i = 0; i < routeTests.length; i++) {
      const test = routeTests[i];
      console.log(`テスト ${i+1}/${routeTests.length}: ${test.name}`);
      
      // テスト実行
      const result = await mapService.calculateRoute(
        test.origin,
        test.destination,
        test.waypoints,
        'driving',
        { includeSteps: true }
      );
      
      // HTMLにテスト結果を追加
      testResultsHtml += generateRouteHtml(test, result, i);
      
      console.log(`テスト ${i+1} 完了: ${result.success ? '成功' : '失敗'}`);
      if (!result.success) {
        console.error(`  エラー: ${result.message}`);
      } else {
        console.log(`  距離: ${result.data.distance}m, 所要時間: ${result.data.duration}秒`);
      }
    }
    
    // 最終的なHTMLを生成
    const finalHtml = htmlReport.replace('<!-- テスト結果がここに挿入されます -->', testResultsHtml);
    
    // HTMLファイルとして保存
    const outputDir = './test-results';
    const outputPath = path.join(outputDir, 'map-service-test-results.html');
    
    // 保存ディレクトリが存在しない場合は作成
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }
    
    fs.writeFileSync(outputPath, finalHtml);
    
    console.log(`\nテスト完了！結果は以下のファイルに保存されました:`);
    console.log(outputPath);
    console.log('\nブラウザでこのファイルを開いて、地図上に表示された経路を確認してください。');
    
  } catch (error) {
    console.error('テスト実行中にエラーが発生しました:', error);
  }
}

/**
 * ルートのHTML表現を生成する
 */
function generateRouteHtml(test, result, index) {
  if (!result.success) {
    return `
      <div class="route-section">
        <div class="route-header">
          <h2>${test.name}</h2>
          <p class="error">エラー: ${result.message}</p>
        </div>
        <pre>${JSON.stringify(result.error, null, 2)}</pre>
      </div>
    `;
  }
  
  const routeData = result.data;
  
  // 出発地、経由地、目的地のマーカー位置を準備
  const markers = [
    { position: test.origin, title: test.origin.name || '出発地', icon: 'start' }
  ];
  
  test.waypoints.forEach((waypoint, i) => {
    markers.push({ position: waypoint, title: waypoint.name || `経由地 ${i+1}`, icon: 'waypoint' });
  });
  
  markers.push({ position: test.destination, title: test.destination.name || '目的地', icon: 'end' });
  
  // ステップ情報の表示
  let stepsHtml = '';
  if (routeData.steps && routeData.steps.length > 0) {
    stepsHtml = `
      <div class="steps">
        <h3>ターンバイターン指示</h3>
        ${routeData.steps.map(step => `
          <div class="step">
            <strong>${step.instruction}</strong><br>
            距離: ${step.distance}m, 所要時間: ${step.duration}秒
          </div>
        `).join('')}
      </div>
    `;
  }
  
  // Leaflet用のJavaScript
  const mapScript = `
    document.addEventListener('DOMContentLoaded', function() {
      // 地図の初期化
      const map = L.map('map-container-${index}').setView([${test.origin.lat}, ${test.origin.lng}], 13);
      
      // OpenStreetMapタイルレイヤーの追加
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
      }).addTo(map);
      
      // マーカーアイコンの定義
      const icons = {
        start: L.icon({
          iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-green.png',
          shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
          iconSize: [25, 41],
          iconAnchor: [12, 41],
          popupAnchor: [1, -34],
          shadowSize: [41, 41]
        }),
        waypoint: L.icon({
          iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-blue.png',
          shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
          iconSize: [25, 41],
          iconAnchor: [12, 41],
          popupAnchor: [1, -34],
          shadowSize: [41, 41]
        }),
        end: L.icon({
          iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png',
          shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
          iconSize: [25, 41],
          iconAnchor: [12, 41],
          popupAnchor: [1, -34],
          shadowSize: [41, 41]
        })
      };
      
      // マーカーの追加
      const bounds = [];
      ${markers.map(marker => `
        const marker${marker.icon} = L.marker([${marker.position.lat}, ${marker.position.lng}], {
          icon: icons.${marker.icon}
        }).addTo(map);
        marker${marker.icon}.bindPopup("${marker.title}");
        bounds.push([${marker.position.lat}, ${marker.position.lng}]);
      `).join('')}
      
      // ルートの描画
      try {
        const encodedPolyline = "${routeData.geometry}";
        const decodedCoordinates = polyline.decode(encodedPolyline);
        
        const routePath = L.polyline(decodedCoordinates, {
          color: '#0066CC',
          weight: 5,
          opacity: 0.7
        }).addTo(map);
        
        // 地図の表示範囲を経路全体に合わせる
        map.fitBounds(routePath.getBounds(), { padding: [30, 30] });
      } catch (e) {
        console.error("ポリラインのデコードに失敗しました", e);
        // エラーが発生した場合はマーカーの位置に合わせる
        map.fitBounds(bounds, { padding: [30, 30] });
      }
    });
  `;
  
  return `
    <div class="route-section">
      <div class="route-header">
        <h2>${test.name}</h2>
        <p class="success">✓ ルート計算成功</p>
      </div>
      
      <div class="route-details">
        <table>
          <tr>
            <th>距離</th>
            <td>${routeData.distance}メートル (${(routeData.distance / 1000).toFixed(2)}km)</td>
          </tr>
          <tr>
            <th>所要時間</th>
            <td>${routeData.duration}秒 (${(routeData.duration / 60).toFixed(2)}分)</td>
          </tr>
          <tr>
            <th>出発地</th>
            <td>${test.origin.name || `${test.origin.lat}, ${test.origin.lng}`}</td>
          </tr>
          <tr>
            <th>目的地</th>
            <td>${test.destination.name || `${test.destination.lat}, ${test.destination.lng}`}</td>
          </tr>
          ${test.waypoints.length > 0 ? `
          <tr>
            <th>経由地</th>
            <td>${test.waypoints.map(wp => wp.name || `${wp.lat}, ${wp.lng}`).join(', ')}</td>
          </tr>
          ` : ''}
        </table>
      </div>
      
      <h3>経路マップ</h3>
      <div id="map-container-${index}" class="map-container"></div>
      
      ${stepsHtml}
      
      <script>${mapScript}</script>
    </div>
  `;
}

// テストの実行（メイン関数として呼び出された場合のみ）
if (require.main === module) {
  runTests();
}

module.exports = { runTests };
