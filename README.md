# detour-navigation-system
高度情報演習1Bの遠回りナビゲーションシステム

detour-navigation-system/
frontend/
├── public/                # 静的ファイル置き場
│   ├── images/           # 画像ファイル（ロゴ、アイコン等）
│   ├── icons/            # UIアイコン
│   ├── favicon.ico       # ファビコン
│   └── manifest.json     # PWA設定（モバイルアプリ化用）
│
├── src/                  # アプリケーション本体
│   ├── app/              # Next.js App Router（ページ管理）""UI層""
│   │   ├── layout.tsx    # 全体共通レイアウト
│   │   ├── page.tsx      # トップページ（/）
│   │   ├── navigation/   # ナビゲーション関連ページ
│   │   │   ├── page.tsx  # ナビ画面（/navigation）
│   │   │   └── result/   # ルート結果画面
│   │   │       └── page.tsx
│   │   ├── profile/      # ユーザープロフィール
│   │   │   └── page.tsx
│   │   ├── history/      # ナビ履歴 
│   │   │   └── page.tsx
│   │   ├──login/　　　　　#ログインページ
│   │   │   └── page.tsx
│   │   ├──signup/        #サインアップページ
│   │   │   └── page.tsx
│   │   ├──favorites/     #お気に入り一覧
│   │   │   └── page.tsx
│   │   ├──user/          
│   │   │   └── [userId]
│   │   │        └── page.tsx
│   │   └── api/          # API Routes（フロント側API）
│   │       └── route.ts  # 内部API処理
│   │
│   ├── components/       # 再利用可能コンポーネント ""アプリケーション層""
│   │   ├── ui/           # 基本UIコンポーネント
│   │   │   ├── Button.tsx        # ボタンコンポーネント
│   │   │   ├── Input.tsx         # 入力フィールド
│   │   │   ├── Modal.tsx         # モーダルダイアログ
│   │   │   └── Loading.tsx       # ローディング表示
│   │   ├── map/          # 地図関連コンポーネント
│   │   │   ├── MapContainer.tsx  # 地図表示メイン
│   │   │   ├── RouteDisplay.tsx  # ルート描画
│   │   │   └── LocationPin.tsx   # ピン表示
│   │   ├── navigation/   # ナビゲーション機能
│   │   │   ├── SearchForm.tsx    # 目的地検索フォーム
│   │   │   ├── RouteOptions.tsx  # ルートオプション選択
│   │   │   └── DetourSettings.tsx # 遠回り設定
│   │   └── layout/       # レイアウト関連
│   │       ├── Header.tsx        # ヘッダー
│   │       ├── Footer.tsx        # フッター
│   │       └── Sidebar.tsx       # サイドバー
│   │
│   ├── styles/           # スタイル設定
│   │   ├── globals.css   # 全体共通CSS
│   │   ├── components.css # コンポーネント専用CSS
│   │   └── tailwind.css  # Tailwind CSS設定
│   │
│   ├── lib/              # ライブラリ・ユーティリティ ""インフラ層""
│   │   ├── api.ts        # バックエンドAPI呼び出し
│   │   ├── utils.ts      # 共通ユーティリティ関数
│   │   ├── auth.ts       # 認証関連処理
│   │   └── constants.ts  # 定数定義
│   │
│   └── types/            # TypeScript型定義
│       ├── api.ts        # API関連の型
│       ├── user.ts       # ユーザー情報の型
│       └── navigation.ts # ナビゲーション関連の型
│
├── .env.local            # フロントエンド環境変数
├── Dockerfile            # フロントエンドDocker設定
├── package.json          # 依存関係・スクリプト
├── next.config.js        # Next.js設定
├── tailwind.config.js    # Tailwind CSS設定
└── tsconfig.json         # TypeScript設定



backend/
├── src/                  # アプリケーション本体
│   ├── app.js           # Express アプリケーション設定
│   ├── server.js        # サーバー起動エントリーポイント
│   │
│   ├── routes/          # APIルート定義
│   │   ├── index.js     # ルートルーティング（/api/）
│   │   ├── navigation.js # ナビゲーション関連API（/api/navigation/）
│   │   ├── users.js     # ユーザー関連API（/api/users/）
│   │   ├── favorites.js #沖に離スポット管理API
│   │   ├── auth.js      #認証，ログインAPI
│   │
│   ├── controllers/     # ビジネスロジック処理
│   │   ├── navigationController.js  # ルート計算・遠回りアルゴリズム
│   │   ├── userController.js        # ユーザー管理処理
│   │   ├── authController.js      # 認証関連処理
│   │   ├── favoriteController.js  # お気に入り処理作
│   │
│   ├── models/          # データベース操作（ORM/クエリ）
│   │   ├── User.js      # ユーザーテーブル操作
│   │   ├── Route.js     # ルート情報テーブル操作
│   │   ├── Favorite.js  # お気に入り処理操作
│   │
│   ├── middleware/      # ミドルウェア
│   │   ├── auth.js      # 認証チェック
│   │   ├── validation.js # 入力値検証
│   │   ├── cors.js      # CORS設定
│   │   └── errorHandler.js # エラーハンドリング
│   │
│   ├── services/        # 外部サービス連携
│   │   ├── mapService.js    # 地図API連携（Google Maps等）
│   │   ├── routeService.js  # ルート計算サービス
│   │   └── placeService.js  # 観光スポット情報取得
│   │
│   ├── utils/           # 共通ユーティリティ
│   │   ├── database.js  # DB接続設定
│   │   ├── logger.js    # ログ出力設定
│   │   ├── helpers.js   # 汎用ヘルパー関数
│   │   └── constants.js # 定数定義
│   │
│   └── config/          # 設定ファイル
│       ├── database.js  # DB設定
│       ├── auth.js      # 認証設定
│       └── app.js       # アプリ全体設定
│
├── tests/               # テストコード
│   ├── unit/           # 単体テスト
│   ├── integration/    # 結合テスト
│   └── fixtures/       # テスト用データ
│
├── .env                 # バックエンド環境変数
├── Dockerfile           # バックエンドDocker設定
├── package.json         # 依存関係・スクリプト
└── nodemon.json         # 開発時自動再起動設定

db/
├── init/                # データベース初期化
│   ├── 01-create-tables.sql     # テーブル作成SQL
│   ├── 02-insert-sample-data.sql # サンプルデータ投入
│   └── 03-create-indexes.sql    # インデックス作成
│
├── migrations/          # データベースマイグレーション
│   ├── 001-initial-schema.sql
│   ├── 002-add-user-preferences.sql
│   └── 003-add-place-categories.sql
│
├── seeds/               # 初期データ
│   ├── users.sql
│   ├── places.sql
│   └── categories.sql
│
└── backups/             # バックアップファイル置き場

初回はビルドする
docker-compose up --build

起動コマンド
docker-compose up

フロントエンド
http://localhost:3000

バックエンドAPI
http://localhost:3001

PostgreSQL → localhost:5432 で接続可能

## バックエンド開発スケジュール

バックエンドの実装は以下のステップで段階的に進めていきます。各ステップで視覚的なフィードバックを確認しながら進めます。

### フェーズ1: 基本構造の構築と動作確認

1. **基本的なExpressサーバーの構築**
   - 単純なHello World APIの作成
   - 基本的なルーティング
   - 動作確認方法: ブラウザ/Postmanでレスポンス確認

2. **データベース接続の確認**
   - PostgreSQL接続テスト
   - 単純なクエリの実行
   - 動作確認方法: コンソールログで接続成功と結果表示

### フェーズ2: 基本的なCRUD操作の実装

3. **ユーザーテーブル作成と基本操作**
   - テーブル作成スクリプト
   - 基本的なCRUD操作の関数実装
   - 動作確認方法: 各操作後のデータをコンソールに表示

4. **基本的なRESTful API実装**
   - ユーザー登録/取得/更新/削除API
   - リクエスト処理とレスポンス形式統一
   - 動作確認方法: Postmanでリクエスト送信とレスポンス検証

### フェーズ3: アーキテクチャの段階的改善

5. **コード分割とルーティング整理**
   - ルーターの分離
   - 基本的なエラーハンドリング
   - 動作確認方法: 各ルート動作とエラーレスポンス確認

6. **リポジトリパターンの導入**
   - データアクセス層の実装
   - リポジトリをAPIルートと接続
   - 動作確認方法: リポジトリを通したデータ取得を確認

7. **サービス層の追加**
   - ビジネスロジックの分離
   - バリデーション実装
   - 動作確認方法: 正常系と異常系の処理を確認

8. **コントローラーの導入**
   - リクエスト処理とサービス呼び出しの分離
   - 統一したレスポンス形式
   - 動作確認方法: 各エンドポイントの動作確認

### フェーズ4: 機能拡張と洗練

9. **認証機能の実装**
   - JWT認証の導入
   - 保護されたルートの作成
   - 動作確認方法: トークン認証フローの確認

10. **遠回りルート計算機能**
    - 基本的な経路計算
    - 遠回りアルゴリズムの実装
    - 動作確認方法: テストデータでの経路生成結果確認

11. **データベース最適化**
    - インデックス作成
    - クエリ最適化
    - 動作確認方法: クエリ実行時間の計測

12. **エラーハンドリングとロギング強化**
    - 集中型エラーハンドリング
    - ロギング機能の実装
    - 動作確認方法: 各種エラーシナリオのテスト

### フェーズ5: 品質向上とテスト

13. **単体テストの作成**
    - サービス層のテスト
    - リポジトリのモックテスト
    - 動作確認方法: テスト実行結果

14. **統合テストの追加**
    - エンドツーエンドAPIテスト
    - 実際のデータベースを使ったテスト
    - 動作確認方法: 統合テスト実行結果

15. **ドキュメント生成**
    - API仕様書の自動生成
    - コード内ドキュメントの充実
    - 動作確認方法: 生成されたドキュメントの確認

### 進め方

各ステップは以下の流れで進めていきます：

1. **小さな変更を実装**: 機能を最小単位で実装
2. **視覚的フィードバック**: console.logやHTTPレスポンスで結果を確認
3. **動作確認**: 複数のケースで動作を検証
4. **フィードバックと調整**: 問題があれば修正
5. **次のステップへ**: 正常動作を確認してから次へ進む

各ステップの完了基準を明確にして、一つずつ着実に進めていきます。

