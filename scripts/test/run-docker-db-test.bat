@echo off
echo ===== Docker環境データベース接続テスト =====
echo.

cd %~dp0\..\..
echo Docker環境でのデータベース接続テストを実行します...
echo.
node tests/db/docker-db-test.js
echo.
echo ===== テスト完了 =====
