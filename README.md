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

