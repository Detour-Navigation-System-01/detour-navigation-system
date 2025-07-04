export type User = {
  id: number;
  username: string;
  email: string;
  password?: string; // ← 必要に応じて optional
  first_name: string;
  last_name: string;
  created_at: string;
  updated_at: string;
  public_settings: boolean; // ✅ サーバーと一致
};
