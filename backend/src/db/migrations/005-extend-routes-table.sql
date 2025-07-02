-- ファイル名: backend/src/db/migrations/005-extend-routes-table.sql

/**
 * @fileoverview routesテーブル拡張マイグレーション
 * @description 経路計算結果の詳細情報（geometry, overview_polyline, 移動手段, ステップ情報）を保存するための機能拡張
 * @author 中西陽之介
 * @created 2025-06-14
 * @updated 2025-07-03
 * @version 1.0.0
 */

-- 経路計算結果の詳細情報を保存するためにroutesテーブルを拡張

-- geometry カラムを追加（経路の幾何学情報を保存）
ALTER TABLE routes ADD COLUMN geometry TEXT;

-- overview_polyline カラムを追加（Google Maps APIのエンコードされたポリライン形式）
ALTER TABLE routes ADD COLUMN overview_polyline TEXT;

-- profile カラム（移動手段）を追加
ALTER TABLE routes ADD COLUMN profile VARCHAR(50) DEFAULT 'walking';

-- requested_duration カラム（希望所要時間）を追加
ALTER TABLE routes ADD COLUMN requested_duration INTEGER;

-- steps テーブルを作成（ターンバイターンナビゲーションの指示）
CREATE TABLE route_steps (
  id SERIAL PRIMARY KEY,
  route_id INTEGER NOT NULL REFERENCES routes(id) ON DELETE CASCADE,
  sequence INTEGER NOT NULL,  -- 手順の順序
  instruction TEXT NOT NULL,  -- 「右に曲がる」などの指示
  distance INTEGER,           -- この手順での距離（メートル）
  duration INTEGER,           -- この手順での時間（秒）
  start_lat DECIMAL(10, 7),   -- 開始地点の緯度
  start_lng DECIMAL(10, 7),   -- 開始地点の経度
  end_lat DECIMAL(10, 7),     -- 終了地点の緯度
  end_lng DECIMAL(10, 7),     -- 終了地点の経度
  maneuver VARCHAR(50),       -- 操作タイプ（右折、左折など）
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  UNIQUE (route_id, sequence) -- 同じルート内で同じ順序を持つステップがないことを保証
);

-- 新しいインデックスを作成
CREATE INDEX idx_route_steps_route ON route_steps(route_id);
CREATE INDEX idx_routes_profile ON routes(profile);
