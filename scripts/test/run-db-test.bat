@echo off
chcp 932 > nul
echo ===== データベース接続テスト =====
echo.

cd %~dp0\..\..
echo データベース接続テストを実行します...
echo.
cd backend
node ../tests/db/db-connection-test.js
cd ..
echo.
echo ===== テスト完了 =====
