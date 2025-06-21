@echo off
chcp 932 > nul
echo ===== データベース関連スクリプト =====
echo.

cd %~dp0\..

set SCRIPT_DIR=scripts\database
set TEST_DIR=tests\db

echo 1. データベースマイグレーション実行（標準）
echo 2. データベースマイグレーション実行（デバッグモード）
echo 3. コンテナ内でマイグレーション直接実行
echo 4. データベース接続テスト（通常環境）
echo 5. データベース接続テスト（Docker環境）
echo 0. 終了

:menu
set /p choice="実行したい操作を選択してください (0-5): "

if "%choice%"=="1" goto migration_standard
if "%choice%"=="2" goto migration_debug
if "%choice%"=="3" goto migration_direct
if "%choice%"=="4" goto db_test
if "%choice%"=="5" goto docker_db_test
if "%choice%"=="0" goto end

echo 無効な選択です。もう一度お試しください。
goto menu

:migration_standard
echo.
echo データベースマイグレーションを実行しています...
call %SCRIPT_DIR%\run-migration.bat
goto end

:migration_debug
echo.
echo デバッグモードでデータベースマイグレーションを実行しています...
call %SCRIPT_DIR%\run-migration-debug.bat
goto end

:migration_direct
echo.
echo コンテナ内で直接マイグレーションを実行しています...
call %SCRIPT_DIR%\run-migration-direct.bat
goto end

:db_test
echo.
echo データベース接続テストを実行しています...
cd backend
node ..\%TEST_DIR%\db-connection-test.js
cd ..
goto end

:docker_db_test
echo.
echo Docker環境でのデータベース接続テストを実行しています...
cd backend
node ..\%TEST_DIR%\docker-db-test.js
cd ..
goto end

:end
echo.
echo 操作を完了しました。
