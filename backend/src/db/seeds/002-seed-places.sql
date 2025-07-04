-- ファイル名: backend/src/db/seeds/002-seed-places.sql

/**
 * @fileoverview 場所のシードデータ
 * @description テスト用の場所データをデータベースに挿入する
 * @author 中西陽之介
 * @created 2025-07-03
 * @updated 2025-07-03
 * @version 1.0.0
 */

-- 既存のデータと衝突しないように挿入する
DO $$
BEGIN
  -- テスト場所1
  IF NOT EXISTS (SELECT 1 FROM places WHERE name = 'テスト場所1' AND name IS NOT NULL) THEN
    INSERT INTO places (userId, name, description, lat, lng, address, created_at, updated_at)
    VALUES (2, 'テスト場所1', 'テスト用の場所1の説明です', 35.6812362, 139.7649361, '東京都千代田区', NOW(), NOW());
  END IF;
  
  -- テスト場所2
  IF NOT EXISTS (SELECT 1 FROM places WHERE name = 'テスト場所2' AND name IS NOT NULL) THEN
    INSERT INTO places (userId, name, description, lat, lng, address, created_at, updated_at)
    VALUES (2, 'テスト場所2', 'テスト用の場所2の説明です', 35.6828387, 139.7594549, '東京都千代田区', NOW(), NOW());
  END IF;
  
  -- テスト場所3
  IF NOT EXISTS (SELECT 1 FROM places WHERE name = 'テスト場所3' AND name IS NOT NULL) THEN
    INSERT INTO places (userId, name, description, lat, lng, address, created_at, updated_at)
    VALUES (2, 'テスト場所3', 'テスト用の場所3の説明です', 35.6580339, 139.7016358, '東京都渋谷区', NOW(), NOW());
  END IF;
END $$;
