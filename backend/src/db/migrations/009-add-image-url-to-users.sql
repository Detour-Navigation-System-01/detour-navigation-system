-- ファイル名: backend/src/db/migrations/009-add-image-url-to-users.sql

/**
 * @fileoverview ユーザーテーブルにプロフィール画像URLを追加するマイグレーション
 * @description ユーザープロフィール画像のURL保存用カラムを追加
 * @author 中西陽之介
 * @created 2025-07-05
 * @updated 2025-07-05
 * @version 1.0.0
 */

-- usersテーブルにimage_urlカラムを追加
ALTER TABLE users
ADD COLUMN image_url VARCHAR(255);

-- コメント追加
COMMENT ON COLUMN users.image_url IS 'ユーザーのプロフィール画像URL（任意）';
