-- ファイル名: backend/src/db/seeds/003-seed-unnamed-places.sql

/**
 * @fileoverview 名前なし場所のシードデータ
 * @description 名前がnullの場所データをテスト用にデータベースに挿入する
 * @author 中西陽之介
 * @created 2025-07-03
 * @updated 2025-07-03
 * @version 1.0.0
 */

-- 名前がnullの場所データを挿入
INSERT INTO places (userId, lat, lng, description, address, created_at, updated_at)
VALUES
  (2, 35.6811673, 139.7670641, 'この場所には名前がありません1', '東京都千代田区丸の内', NOW(), NOW()),
  (2, 35.6895014, 139.6917368, 'この場所には名前がありません2', '東京都新宿区', NOW(), NOW());
