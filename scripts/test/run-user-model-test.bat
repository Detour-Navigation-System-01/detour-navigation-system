@echo off
echo ===== ユーザーモデルテスト =====
echo.

cd %~dp0\..\..
echo ユーザーモデルのテストを実行します...
echo.
node tests/models/test-user-model.js
echo.
echo ===== テスト完了 =====
