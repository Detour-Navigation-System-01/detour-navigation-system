/**
 * @fileoverview トークンブラックリストリポジトリ
 * @description 無効化されたJWTトークンの管理を担当するリポジトリ
 * @author 中西陽之介
 * @created 2025-06-18
 * @updated 2025-07-03
 * @version 1.0.0
 */
// 対応するマイグレーションファイル: backend/src/db/migrations/007-create-token-blacklist.sql

const BaseRepository = require('./BaseRepository');
const pool = require('../utils/db');
class TokenBlacklistRepository extends BaseRepository {
  constructor() {
    super(pool, 'token_blacklist');
  }

  /**
   * トークンをブラックリストに追加
   * @param {string} token - 無効化するトークン
   * @param {Object} payload - トークンのペイロード（デコード済み）
   * @returns {Promise<Object>} 作成されたブラックリストエントリ
   */
  async addToBlacklist(token, payload) {
    try {
      const userId = payload.id;
      const expiresAt = new Date(payload.exp * 1000); // JWTの有効期限をDateオブジェクトに変換
      
      const query = `
        INSERT INTO ${this.tableName} (token, user_id, expires_at)
        VALUES ($1, $2, $3)
        RETURNING *
      `;
      
      const result = await this.pool.query(query, [token, userId, expiresAt]);
      return result.rows[0];
    } catch (error) {
      console.error('トークンのブラックリスト追加エラー:', error);
      throw error;
    }
  }

  /**
   * トークンがブラックリストに含まれているか確認
   * @param {string} token - チェックするトークン
   * @returns {Promise<boolean>} ブラックリストに含まれている場合はtrue
   */
  async isBlacklisted(token) {
    try {
      const query = `
        SELECT EXISTS(
          SELECT 1 FROM ${this.tableName}
          WHERE token = $1
        ) as is_blacklisted
      `;
      
      const result = await this.pool.query(query, [token]);
      return result.rows[0].is_blacklisted;
    } catch (error) {
      console.error('トークンのブラックリストチェックエラー:', error);
      throw error;
    }
  }

  /**
   * 特定のユーザーのすべてのトークンをブラックリストに追加
   * @param {number} userId - ユーザーID
   * @param {Date} expiresAt - トークンの有効期限
   * @returns {Promise<Object>} 作成されたブラックリストエントリ
   */
  async blacklistAllUserTokens(userId, expiresAt) {
    try {
      // 注意: この実装は簡易版です。実際には特定のトークンを指定する必要があるかもしれません。
      // 現在の実装では、ユーザーIDのみで「このユーザーのすべてのトークンを無効化」という記録を残します。
      const query = `
        INSERT INTO ${this.tableName} (token, user_id, expires_at)
        VALUES ($1, $2, $3)
        RETURNING *
      `;
      
      // user_id:expiresAt という形式で特殊トークンとして保存（実際のトークン文字列ではない）
      const specialToken = `user:${userId}:invalidated_at:${Date.now()}`;
      const result = await this.pool.query(query, [specialToken, userId, expiresAt]);
      return result.rows[0];
    } catch (error) {
      console.error(`ユーザーID: ${userId} のトークン無効化エラー:`, error);
      throw error;
    }
  }

  /**
   * 期限切れのトークンを削除（定期的なクリーンアップ用）
   * @returns {Promise<number>} 削除されたトークンの数
   */
  async cleanupExpiredTokens() {
    try {
      const query = `
        DELETE FROM ${this.tableName}
        WHERE expires_at < NOW()
        RETURNING id
      `;
      
      const result = await this.pool.query(query);
      const count = result.rowCount;
      
      if (count > 0) {
        console.log(`${count}件の期限切れトークンをブラックリストから削除しました`);
      }
      
      return count;
    } catch (error) {
      console.error('期限切れトークンのクリーンアップエラー:', error);
      throw error;
    }
  }
}

// シングルトンとしてエクスポート
module.exports = new TokenBlacklistRepository();
