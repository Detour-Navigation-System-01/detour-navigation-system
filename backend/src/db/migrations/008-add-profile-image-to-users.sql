/*
  ファイル名: 008-add-profile-image-to-users.sql
  概要: usersテーブルにprofile_imageカラムを追加し、ユーザーのプロフィール画像を管理できるようにする
  作成者: 笠置啓太
  作成日: 2025-07-02
  更新日: 2025-07-02
  バージョン: 1.0.0
*/

-- 008-add-profile-image-to-users.sql

ALTER TABLE users
ADD COLUMN profile_image VARCHAR(255) DEFAULT 'icon_user.png';
