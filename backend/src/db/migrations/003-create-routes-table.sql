-- ファイル名: backend/src/db/migrations/003-create-routes-table.sql

/**
 * @fileoverview routesテーブル作成マイグレーション
 * @description ユーザーが計算・保存する経路情報を格納するテーブルを定義。出発地・目的地・経由地点などを含む。
 * @author 中西陽之介
 * @created 2025-06-14
 * @updated 2025-07-03
 * @version 1.0.0
 */

CREATE TABLE routes (
  id SERIAL PRIMARY KEY,
  userId INTEGER NOT NULL,
  name VARCHAR(100) NOT NULL,
  description TEXT,
  origin_lat DECIMAL(10, 7) NOT NULL,  -- 出発地の緯度
  origin_lng DECIMAL(10, 7) NOT NULL,  -- 出発地の経度
  destination_lat DECIMAL(10, 7) NOT NULL,  -- 目的地の緯度
  destination_lng DECIMAL(10, 7) NOT NULL,  -- 目的地の経度
  distance INTEGER,  -- メートル単位
  duration INTEGER,  -- 秒単位
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT fk_user FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE

);

-- 経由地点のテーブル（中間テーブル）
CREATE TABLE route_waypoints (
  id SERIAL PRIMARY KEY,
  route_id INTEGER NOT NULL,
  place_id INTEGER NOT NULL,
  sequence INTEGER NOT NULL, -- 経由順序
  UNIQUE (route_id, sequence), -- 同じルート内で同じ順序を持つ経由地点がないことを保証
  CONSTRAINT fk_route FOREIGN KEY (route_id) REFERENCES routes(id) ON DELETE CASCADE,
  CONSTRAINT fk_place FOREIGN KEY (place_id) REFERENCES places(id) ON DELETE CASCADE
);

-- インデックスの作成
CREATE INDEX idx_routes_name ON routes(name);
CREATE INDEX idx_routes_user ON routes(userId);
CREATE INDEX idx_routes_origin_dest ON routes(origin_lat, origin_lng, destination_lat, destination_lng);
CREATE INDEX idx_route_waypoints_route ON route_waypoints(route_id);
CREATE INDEX idx_route_waypoints_place ON route_waypoints(place_id);
