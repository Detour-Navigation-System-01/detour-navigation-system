# frontend/Dockerfile
FROM node:18-alpine

WORKDIR /app

# 依存インストール
COPY package*.json ./
RUN npm install

# ソースコードコピー
COPY . .

# 設定ファイルの拡張子が正しいことを確認
RUN if [ -f next.config.ts ]; then mv next.config.ts next.config.js; fi

# ホットリロードのために、ポーリングモードで開発サーバーを起動
CMD ["npm", "run", "dev", "--", "--hostname", "0.0.0.0"]
