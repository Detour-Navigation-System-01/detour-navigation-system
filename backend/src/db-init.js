// backend/src/db-init.js
// データベース初期化を実行するためのスタンドアロンスクリプト

// データベース初期化モジュールを読み込む
const { initializeDatabase } = require('./database/init');

// 直接スクリプトとして実行
if (require.main === module) {
  console.log('⚡ データベース初期化スクリプトを開始します...');
  
  // 初期化実行
  initializeDatabase()
    .then(() => {
      console.log('✅ データベース初期化が完了しました');
      process.exit(0);
    })
    .catch(error => {
      console.error('❌ データベース初期化中にエラーが発生しました:', error);
      process.exit(1);
    });
}

module.exports = { initializeDatabase };
