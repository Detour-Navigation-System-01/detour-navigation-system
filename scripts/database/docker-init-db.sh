#!/bin/bash
set -e

echo "===== Docker環境のデータベース初期化 ====="
echo ""
echo "データベースが起動するまで10秒待機します..."
sleep 10

echo "マイグレーションを実行します..."
node src/utils/run-migration.js

echo "シードデータを投入します..."
node src/utils/run-seeds.js

echo ""
echo "===== データベース初期化完了 ====="
