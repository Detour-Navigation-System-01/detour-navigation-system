/*
  ファイル名: 006-add-public-settings-to-users.sql
  概要: usersテーブルにpublic_settingsカラムを追加し、ユーザー情報の公開設定を管理できるようにする
  作成者: 笠置啓太
  作成日: 2025-07-01
  更新日: 2025-07-01
  バージョン: 1.0.0
*/

-- 006-add-public-settings-to-users.sql

ALTER TABLE users
ADD COLUMN public_settings BOOLEAN DEFAULT true;
