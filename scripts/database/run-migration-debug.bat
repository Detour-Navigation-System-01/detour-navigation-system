@echo off
echo ===== Docker環境でのマイグレーション実行（詳細表示） =====
echo.

cd %~dp0\..\..
echo "Dockerコンテナ一覧を確認しています..."
docker-compose ps

echo.
echo "データベースの状態を確認しています..."
docker-compose exec db pg_isready -U postgres || echo "データベースに接続できませんでした。"

echo.
echo "ネットワーク接続を確認しています..."
docker-compose exec backend ping -c 2 db || echo "バックエンドからデータベースにpingできませんでした。"

echo.
echo "環境変数を確認しています..."
docker-compose exec backend env | grep DB_

echo.
echo "マイグレーションを実行します..."
docker-compose exec backend node src/utils/run-migration.js

echo.
echo ===== マイグレーション完了 =====
