// この簡易的なCLIツールは、Node.jsのpgパッケージがインストールされているかを確認します
try {
  // pgパッケージの読み込みを試行
  require('pg');
  console.log('✅ pgパッケージはインストール済みです。データベース接続テストを実行できます。');
  process.exit(0);
} catch (error) {
  console.error('❌ pgパッケージがインストールされていません。');
  console.log('データベース接続をテストするには、次のコマンドを実行してインストールしてください:');
  console.log('npm install pg');
  process.exit(1);
}
