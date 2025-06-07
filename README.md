# detour-navigation-system
高度情報演習1Bの遠回りナビゲーションシステム

wander-map/
├── frontend/              # フロントエンド（Next.js）
│   ├── public/            # 静的ファイル（画像・アイコン等）
│   ├── src/               # アプリ本体（App Router構成）
│   │   ├── app/           # ページルーティング（page.tsxなど）
│   │   ├── components/    # 共通コンポーネント
│   │   ├── styles/        # CSS / Tailwind など
│   │   └── lib/           # API呼び出しロジックなど
│   ├── .env.local         # フロント用の環境変数
│   ├── Dockerfile         # フロント用Docker設定
│   └── package.json       # Next.js依存設定
│
├── backend/               # バックエンド（Express）
│   ├── src/               # APIロジック本体
│   │   ├── routes/        # ルートごとのルーティング
│   │   ├── controllers/   # 処理ロジック
│   │   ├── models/        # DB操作（例：PostgreSQL）
│   │   └── utils/         # 共通ユーティリティ
│   ├── .env               # バックエンド用の環境変数
│   ├── Dockerfile         # バックエンド用Docker設定
│   └── package.json       # Express依存設定
│
├── db/                    # PostgreSQL関連
│   └── （空でOK）        # マウント用のボリューム（永続化用）
│
├── docker-compose.yml     # サービス一括起動設定
├── .env                   # 共通の環境変数
├── .env.example           # 環境変数テンプレート（共有用）
├── .gitignore             # Gitで無視するファイル設定
└── README.md              # 起動方法や構成説明


初回はビルドする
docker-compose up --build

起動コマンド
docker-compose up

フロントエンド
http://localhost:3000

バックエンドAPI
http://localhost:3001

PostgreSQL → localhost:5432 で接続可能

