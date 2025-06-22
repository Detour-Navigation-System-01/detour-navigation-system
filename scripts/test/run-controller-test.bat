@echo off
echo ===== コントローラーユニットテスト =====
echo.

cd %~dp0\..\..
echo コントローラーのユニットテストを実行します...
echo.
node tests/unit/controller-test.js
echo.
echo ===== テスト完了 =====
