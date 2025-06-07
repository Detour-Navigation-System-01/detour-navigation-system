# frontend/Dockerfile
FROM node:18

WORKDIR /app

# 依存インストール
COPY package*.json ./
RUN npm install

# ソースコードコピー
COPY . .

# 本番環境用なら build、開発なら dev
CMD ["npm", "run", "dev"]
