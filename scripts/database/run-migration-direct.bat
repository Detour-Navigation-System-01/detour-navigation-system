@echo off
echo ===== バックエンドコンテナにアクセスして直接マイグレーションを実行 =====
echo.

cd %~dp0\..\..
docker-compose exec backend bash -c "cd /app && node src/utils/run-migration.js"

echo.
echo ===== マイグレーション完了 =====
