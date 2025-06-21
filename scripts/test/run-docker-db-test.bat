@echo off
chcp 932 > nul
echo ===== Docker環境データベース接続テスト =====
echo.

cd %~dp0\..\..
echo Docker環境でのデータベース接続テストを実行します...
echo.
cd backend
node ../tests/db/docker-db-test.js
cd ..
echo.
echo ===== テスト完了 =====
