@echo off
chcp 932 > nul
echo ===== データベース接続テスト実行 =====
echo.

cd %~dp0\..\..
echo バックエンドディレクトリに移動してテストを実行します...

cd backend
node ..\tests\db\db-connection-test.js

echo.
echo ===== テスト完了 =====
