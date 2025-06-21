-- ファイル名: backend/src/db/migrations/004-add-spatial-extensions.sql
-- 位置情報検索用の拡張機能をインストール

-- cube拡張をインストール（earthdistanceの依存関係）
CREATE EXTENSION IF NOT EXISTS cube;

-- earthdistance拡張をインストール（地球上の2点間の距離を計算するため）
CREATE EXTENSION IF NOT EXISTS earthdistance;
