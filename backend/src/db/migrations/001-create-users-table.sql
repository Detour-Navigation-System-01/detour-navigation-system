/*
  ファイル名: 001-create-users-table.sql
  概要: ユーザー情報を管理するusersテーブルを作成するマイグレーション
  作成者: 笠置啓太
  作成日: 2025-06-17
  更新日: 2025-06-17
  バージョン: 1.0.0
*/

-- ファイル名: backend/src/db/migrations/001-create-users-table.sql
CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  username VARCHAR(50) NOT NULL UNIQUE,
  email VARCHAR(100) NOT NULL UNIQUE,
  password VARCHAR(100) NOT NULL,
  first_name VARCHAR(50),
  last_name VARCHAR(50),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- インデックスの作成、インデックスとは、データベースの検索を高速化するためのデータ構造です。
CREATE INDEX idx_users_username ON users(username);
CREATE INDEX idx_users_email ON users(email);