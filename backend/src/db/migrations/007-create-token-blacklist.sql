-- ファイル名: backend/src/db/migrations/007-create-token-blacklist.sql

/**
 * @fileoverview トークンブラックリストテーブル作成マイグレーション
 * @description 無効化されたJWTトークンを管理するテーブルを定義。ログアウト時やセキュリティ対策に利用。
 * @author 中西陽之介
 * @created 2025-06-18
 * @updated 2025-07-03
 * @version 1.0.0
 */

CREATE TABLE token_blacklist (
  id SERIAL PRIMARY KEY,
  token TEXT NOT NULL,         -- 無効化するトークン（またはトークンのハッシュ）
  jti TEXT,                    -- JWT IDがある場合はそれを保存（オプション）
  user_id INTEGER,             -- 関連するユーザーID（削除ユーザー追跡用）
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL, -- トークンの有効期限（この日時以降は削除可能）
  
  CONSTRAINT token_unique UNIQUE (token)
);

-- インデックス作成
CREATE INDEX idx_token_blacklist_token ON token_blacklist(token);
CREATE INDEX idx_token_blacklist_expiry ON token_blacklist(expires_at);

-- クリーンアップ関数の作成（期限切れのトークンを削除）
CREATE OR REPLACE FUNCTION cleanup_expired_tokens()
RETURNS void AS $$
BEGIN
  DELETE FROM token_blacklist WHERE expires_at < NOW();
END;
$$ LANGUAGE plpgsql;

-- トリガー作成（オプション - 定期的なクリーンアップ用）
-- 注意: これは大規模システムには向かない場合があります（スケジュールタスクが望ましい）
