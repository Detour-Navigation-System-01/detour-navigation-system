-- ファイル名: backend/src/db/migrations/002-create-places-table.sql
CREATE TABLE places (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  description TEXT,
  category VARCHAR(50),
  address VARCHAR(255),
  prefecture VARCHAR(50),
  lat DECIMAL(10, 7) NOT NULL,  -- 緯度（最大7桁の小数点精度）
  lng DECIMAL(10, 7) NOT NULL,  -- 経度（最大7桁の小数点精度）
  image_url VARCHAR(255),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- インデックスの作成
CREATE INDEX idx_places_name ON places(name);
CREATE INDEX idx_places_category ON places(category);
CREATE INDEX idx_places_prefecture ON places(prefecture);

-- 緯度・経度に基づくインデックスも作成
CREATE INDEX idx_places_location ON places(lat, lng);

-- 追加確認用のコメント：この SQL が正常に実行されると places テーブルが作成されます。
