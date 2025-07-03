-- ファイル名: backend/src/db/migrations/002-create-places-table.sql

/**
 * @fileoverview placesテーブル作成マイグレーション
 * @description ユーザーが登録する「場所」の情報を保存するテーブルを定義。ユーザーとのリレーション、位置情報、カテゴリなどを含む。
 * @author 瀬下美華
 * @created 2025-06-25
 * @updated 2025-07-02
 * @version 1.2.1
 */

CREATE TABLE places (
  id SERIAL PRIMARY KEY,
  userId INTEGER NOT NULL,  -- ユーザーIDカラムを追加 (ユーザーテーブルのIDと紐づく)
  name VARCHAR(100) NOT NULL UNIQUE,  -- UNIQUE制約を追加
  description TEXT,
  category VARCHAR(50),
  address VARCHAR(255),
  prefecture VARCHAR(50),
  lat DECIMAL(10, 7) NOT NULL,  -- 緯度（最大7桁の小数点精度）
  lng DECIMAL(10, 7) NOT NULL,  -- 経度（最大7桁の小数点精度）
  image_url VARCHAR(255),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT fk_user
  FOREIGN KEY(userId)
  REFERENCES users(id)
  ON DELETE CASCADE

);

-- インデックスの作成
CREATE INDEX idx_places_name ON places(name);
CREATE INDEX idx_places_category ON places(category);
CREATE INDEX idx_places_prefecture ON places(prefecture);
CREATE INDEX idx_places_location ON places(lat, lng);
CREATE INDEX idx_places_userId ON places(userId);

-- 追加確認用のコメント：この SQL が正常に実行されると places テーブルが作成されます。
