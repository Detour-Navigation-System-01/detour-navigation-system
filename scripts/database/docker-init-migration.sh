#!/bin/bash
set -e

echo "===== Docker環境のデータベースマイグレーション初期化 ====="
echo ""
echo "データベースが起動するまで10秒待機します..."
sleep 10

echo "マイグレーションを実行します..."
node src/utils/run-migration.js

echo ""
echo "===== マイグレーション完了 ====="
