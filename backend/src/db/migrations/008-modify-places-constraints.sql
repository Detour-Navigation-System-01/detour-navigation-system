-- ファイル名: backend/src/db/migrations/008-modify-places-constraints.sql

/**
 * @fileoverview placesテーブル制約修正マイグレーション
 * @description 場所テーブルの必須項目を緯度・経度のみに変更し、その他の項目を任意にする
 * @author 中西陽之介
 * @created 2025-07-03
 * @updated 2025-07-03
 * @version 1.0.0
 */

-- 一時的にユニーク制約を削除
ALTER TABLE places DROP CONSTRAINT IF EXISTS places_name_key;

-- 名前の NOT NULL 制約を削除
ALTER TABLE places ALTER COLUMN name DROP NOT NULL;

-- nameカラムの制約を変更後、nullを許容しつつも値がある場合はユニーク制約を適用
CREATE UNIQUE INDEX idx_places_unique_name ON places (name) WHERE name IS NOT NULL;

-- コメント追加
COMMENT ON COLUMN places.lat IS '緯度（必須）';
COMMENT ON COLUMN places.lng IS '経度（必須）';
COMMENT ON COLUMN places.name IS '場所の名称（任意、指定時は一意）';
