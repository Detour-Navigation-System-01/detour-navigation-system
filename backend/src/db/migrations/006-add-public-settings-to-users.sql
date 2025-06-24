-- 006-add-public-settings-to-users.sql

ALTER TABLE users
ADD COLUMN public_settings BOOLEAN DEFAULT true;
