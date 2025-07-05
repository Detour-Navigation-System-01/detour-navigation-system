-- ファイル名: backend/src/db/migrations/010-set-timezone-to-jst.sql

/**
 * @fileoverview タイムゾーン設定マイグレーション
 * @description データベースのタイムゾーンを日本時間(Asia/Tokyo)に変更
 * @author 中西陽之介
 * @created 2025-07-05
 * @updated 2025-07-05
 * @version 1.0.0
 */

-- データベース全体のタイムゾーンを日本時間に設定
ALTER DATABASE wanderdb SET timezone TO 'Asia/Tokyo';

-- 現在のセッションのタイムゾーンを設定（即時反映のため）
SET timezone TO 'Asia/Tokyo';

-- テストクエリを実行して確認
SELECT NOW() AS current_time_jst;

-- 既存データの確認用（オプション）
-- SELECT id, name, created_at AT TIME ZONE 'UTC' AT TIME ZONE 'Asia/Tokyo' AS created_at_jst FROM places LIMIT 5;
