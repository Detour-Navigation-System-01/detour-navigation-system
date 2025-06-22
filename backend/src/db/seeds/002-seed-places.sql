-- 場所のシードデータ
INSERT INTO places (name, description, lat, lng, address, created_at, updated_at)
VALUES
  ('テスト場所1', 'テスト用の場所1の説明です', 35.6812362, 139.7649361, '東京都千代田区', NOW(), NOW()),
  ('テスト場所2', 'テスト用の場所2の説明です', 35.6828387, 139.7594549, '東京都千代田区', NOW(), NOW()),
  ('テスト場所3', 'テスト用の場所3の説明です', 35.6580339, 139.7016358, '東京都渋谷区', NOW(), NOW())
ON CONFLICT (name) DO NOTHING;
