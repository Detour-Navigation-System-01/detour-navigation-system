#!/bin/bash
set -e

echo "===== Docker環境のデータベース初期化を開始します ====="

# データベース起動を待機
echo "データベースの起動を待機しています..."
sleep 5

# マイグレーションとシードを実行
echo "データベースの初期化を実行します..."
cd /app
node src/db-init.js

echo "===== 初期化が完了しました ====="
