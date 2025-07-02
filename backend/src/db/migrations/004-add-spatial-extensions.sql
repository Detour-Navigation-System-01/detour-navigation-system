-- ファイル名: backend/src/db/migrations/004-add-spatial-extensions.sql

/**
 * @fileoverview 位置情報拡張機能追加マイグレーション
 * @description 地理空間クエリに必要なPostgreSQLの拡張機能をインストール（cube, earthdistance）
 * @author 中西陽之介
 * @created 2025-06-14
 * @updated 2025-07-03
 * @version 1.0.0
 */

-- 位置情報検索用の拡張機能をインストール

-- cube拡張をインストール（earthdistanceの依存関係）
CREATE EXTENSION IF NOT EXISTS cube;

-- earthdistance拡張をインストール（地球上の2点間の距離を計算するため）
CREATE EXTENSION IF NOT EXISTS earthdistance;
