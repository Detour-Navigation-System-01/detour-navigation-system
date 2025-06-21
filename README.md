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
│   ├── index.js         # アプリケーションエントリーポイント
│   │
│   ├── routes/          # APIルート定義
│   │   ├── index.js     # ルートルーティング（/api/）
│   │   ├── navigation.js # ナビゲーション関連API
│   │   ├── user.js      # ユーザー関連API
│   │   ├── places.js    # 場所・スポット管理API
│   │   ├── auth.js      # 認証・ログインAPI
│   │   └── api/         # API バージョン管理
│   │
│   ├── controllers/     # コントローラー層（リクエスト処理・レスポンス生成）
│   │   ├── BaseController.js    # 基底コントローラー
│   │   ├── userController.js    # ユーザー管理
│   │   ├── authController.js    # 認証処理
│   │   ├── placeController.js   # 場所管理
│   │   └── navigationController.js # ルート計算
│   │
│   ├── services/        # サービス層（ビジネスロジック）
│   │   ├── userService.js    # ユーザー関連ビジネスロジック
│   │   ├── authService.js    # 認証関連ビジネスロジック
│   │   ├── placeService.js   # 場所関連ビジネスロジック
│   │   ├── mapService.js     # 地図API連携（外部APIとの連携）
│   │   └── routeService.js   # 経路計算サービス
│   │
│   ├── repositories/    # リポジトリ層（データアクセス）
│   │   ├── BaseRepository.js # 基底リポジトリ
│   │   ├── UserRepository.js # ユーザーデータアクセス
│   │   └── PlaceRepository.js # 場所データアクセス
│   │
│   ├── models/          # データモデル
│   │   ├── User.js      # ユーザーモデル
│   │   └── Place.js     # 場所モデル
│   │
│   ├── middleware/      # ミドルウェア
│   │   ├── errorHandler.js # エラーハンドリング
│   │   └── validation.js   # 入力検証
│   │
│   ├── database/        # データベース初期化・管理
│   │   └── init.js      # DB初期化処理
│   │
│   ├── db/              # データベーススキーマ
│   │   ├── migrations/  # テーブル定義SQL
│   │   │   ├── 001-create-users-table.sql
│   │   │   ├── 002-create-places-table.sql
│   │   │   ├── 003-create-favorites-table.sql
│   │   │   └── 004-add-spatial-extensions.sql
│   │   │
│   │   └── seeds/      # 初期データSQL
│   │       ├── 001-seed-users.sql
│   │       └── 002-seed-places.sql
│   │
│   ├── utils/          # ユーティリティ
│   │   ├── db.js       # データベース接続
│   │   ├── run-migration.js # マイグレーション実行
│   │   └── run-seeds.js    # シード実行
│   │
│   └── config/         # 設定ファイル
│       └── database.js # データベース設定
│
├── Dockerfile          # バックエンドDocker設定
└── package.json        # 依存関係・スクリプト

tests/
└── api/              # APIテスト
    ├── users.http    # ユーザーAPIテスト
    ├── auth.http     # 認証APIテスト
    └── places.http   # 場所APIテスト

db/                   # PostgreSQLデータ
├── base/             # PostgreSQLデータファイル
├── global/           # PostgreSQL内部ファイル
└── pg_wal/           # トランザクションログ
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

### 🎯 現在の進捗状況

✅ **完成済み（フェーズ1-3）**
- Express + PostgreSQL基盤
- ユーザー・場所のCRUD API
- リポジトリ・サービス・コントローラー層
- 近隣検索機能（earthdistance使用）

❌ **未実装の重要機能**
- JWT認証・保護されたルート
- 経路計算・遠回りアルゴリズム
- WebSocketリアルタイム通信
- ファイルアップロード

### 🔧 改善された実装計画

#### フェーズ4A: 中核機能の先行実装

1. **外部API連携の基礎実装** ⭐ 最優先
   - 目標: 外部経路計算APIの動作確認
   - エンドポイント: `GET /api/routes/test` → 外部API接続テスト
   - 実装内容:
     - OSRM API または Google Maps API の接続テスト
     - 環境変数設定 (.env にAPIキー追加)
     - エラーハンドリング（API障害時の対応）

2. **基本経路計算API実装** ⭐ 高優先
   - エンドポイント: `POST /api/routes/calculate`
   - 実装内容:
     - RouteController, RouteService, RouteRepository の作成
     - 基本的な経路計算ロジック
     - 計算結果のデータベース保存

3. **JWT認証の実装**
   - 保護されたルート例:
     - `GET /api/routes/history` → 要認証
     - `POST /api/routes/save` → 要認証
   - 実装内容:
     - JWT トークン生成・検証
     - 認証ミドルウェア作成
     - ログイン時のトークン発行

#### フェーズ4B: 高度機能の実装

1. **遠回りアルゴリズムの実装**
   - 段階的な実装:
     - Step1: 基本的な迂回（距離を1.2-2.0倍に）
     - Step2: 興味深い場所を経由点として組み込み
     - Step3: ユーザーの嗜好学習
   - 実装内容:
     - 複数経路候補の生成
     - 場所(places)データとの組み合わせ
     - 遠回り度による経路調整

2. **WebSocketリアルタイム通信** ⭐ ナビに必須
   - 新機能: `/ws/navigation/:sessionId` → リアルタイム位置更新
   - 実装内容:
     - Socket.io導入
     - ナビゲーションセッション管理
     - 位置情報のリアルタイム送受信

3. **ファイル管理機能** ⭐ 写真機能に必須
   - エンドポイント:
     - `POST /api/places/:id/photos` → 写真アップロード
     - `GET /api/places/:id/photos` → 写真一覧
   - 実装内容:
     - multer による画像アップロード
     - 画像リサイズ・最適化
     - ファイルパス管理

#### フェーズ5: 品質向上

1. **エラーハンドリング・ログ強化**
   - 統一レスポンス形式の徹底
   - 集中エラーハンドリング
   - 構造化ログ実装

2. **データベース最適化**
   - 必要なインデックス追加
   - 空間検索の性能改善
   - クエリ最適化

3. **基本的なテスト実装**
   - 重要機能の単体テスト
   - API統合テスト
   - テスト実行環境

### 🚨 重要な事前準備

**今すぐやるべきこと**:

1. **外部API の選択・準備**
   - OSRM（無料、自己ホスト可能）
   - Google Maps API（有料、高機能）
   - Mapbox API（フリータイヤーあり）

2. **開発用APIキー取得**
   - 本格実装前にAPIキーを準備

3. **WebSocket ライブラリの選択**
   ```bash
   npm install socket.io
   # または
   npm install ws
   ```
### 進め方

各ステップは以下の流れで進めていきます：

1. **小さな変更を実装**: 機能を最小単位で実装
2. **視覚的フィードバック**: console.logやHTTPレスポンスで結果を確認
3. **動作確認**: 複数のケースで動作を検証
4. **フィードバックと調整**: 問題があれば修正
5. **次のステップへ**: 正常動作を確認してから次へ進む

各ステップの完了基準を明確にして、一つずつ着実に進めていきます。

