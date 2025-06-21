@echo off
echo ===== Docker環境のデータベースマイグレーションを実行 =====
echo.

cd %~dp0\..\..
docker-compose exec backend sh -c "DB_HOST=db DB_PORT=5432 DB_USER=postgres DB_PASSWORD=password DB_NAME=wanderdb node src/utils/run-migration.js"
echo.
echo ===== マイグレーション完了 =====
