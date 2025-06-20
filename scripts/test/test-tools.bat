@echo off
setlocal enabledelayedexpansion
cls
color 0A

echo ===================================================
echo               テスト実行ツール集約バッチ
echo ===================================================
echo.
echo 実行したいテストの番号を入力してください:
echo.
echo  [1] APIテスト実行
echo  [2] コントローラーテスト実行
echo  [3] データベース接続テスト実行
echo  [4] Docker環境データベーステスト実行
echo  [5] ユーザーモデルテスト実行
echo  [0] 終了
echo.

:MENU
set /p choice="選択（0-5）: "

if "%choice%"=="1" (
    call %~dp0\run-api-test.bat
) else if "%choice%"=="2" (
    call %~dp0\run-controller-test.bat
) else if "%choice%"=="3" (
    call %~dp0\run-db-test.bat
) else if "%choice%"=="4" (
    call %~dp0\run-docker-db-test.bat
) else if "%choice%"=="5" (
    call %~dp0\run-user-model-test.bat
) else if "%choice%"=="0" (
    goto :END
) else (
    echo 無効な選択です。0-5の番号を入力してください。
    goto :MENU
)

echo.
set /p continue="続けて別のテストを実行しますか？ (Y/N): "
if /i "!continue!"=="Y" (
    cls
    goto :MENU
) else (
    goto :END
)

:END
echo.
echo テストツール集約バッチを終了します。
echo ご利用ありがとうございました。
echo.
