@echo off
echo 画像アップロードテスト用HTMLを開きます...
start "" "c:\Users\Yonosuke\Desktop\detour-navigation-system\tests\image-upload-test.html"

echo バックエンドサーバーが稼働していることを確認してください。
echo ポート3001でバックエンドが動作していない場合は、別のターミナルで以下を実行してください:
echo cd backend && npm run dev
echo.
echo 終了するには任意のキーを押してください...
pause > nul
