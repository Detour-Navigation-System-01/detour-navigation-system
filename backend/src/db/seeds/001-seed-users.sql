-- ユーザーのシードデータ
INSERT INTO users (username, email, password, first_name, last_name, created_at, updated_at)
VALUES
  ('testuser', 'test@example.com', '$2b$10$1JC0wKx0q8JX.P5MUuU4sOuZmAmkz8o4EGMifZ5R.K5GgQ.WMNP46', 'テスト', 'ユーザー', NOW(), NOW()),
  ('admin', 'admin@example.com', '$2b$10$1JC0wKx0q8JX.P5MUuU4sOuZmAmkz8o4EGMifZ5R.K5GgQ.WMNP46', '管理者', 'ユーザー', NOW(), NOW())
ON CONFLICT (username) DO NOTHING;
