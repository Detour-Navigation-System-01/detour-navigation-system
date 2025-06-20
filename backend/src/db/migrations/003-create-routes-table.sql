-- ファイル名: backend/src/db/migrations/003-create-routes-table.sql
CREATE TABLE routes (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  description TEXT,
  origin_id INTEGER NOT NULL REFERENCES places(id) ON DELETE CASCADE,
  destination_id INTEGER NOT NULL REFERENCES places(id) ON DELETE CASCADE,
  user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
  distance INTEGER,  -- メートル単位
  duration INTEGER,  -- 秒単位
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 経由地点のテーブル（中間テーブル）
CREATE TABLE route_waypoints (
  id SERIAL PRIMARY KEY,
  route_id INTEGER NOT NULL REFERENCES routes(id) ON DELETE CASCADE,
  place_id INTEGER NOT NULL REFERENCES places(id) ON DELETE CASCADE,
  sequence INTEGER NOT NULL, -- 経由順序
  UNIQUE (route_id, sequence) -- 同じルート内で同じ順序を持つ経由地点がないことを保証
);

-- インデックスの作成
CREATE INDEX idx_routes_name ON routes(name);
CREATE INDEX idx_routes_user ON routes(user_id);
CREATE INDEX idx_routes_origin_dest ON routes(origin_id, destination_id);
CREATE INDEX idx_route_waypoints_route ON route_waypoints(route_id);
CREATE INDEX idx_route_waypoints_place ON route_waypoints(place_id);
