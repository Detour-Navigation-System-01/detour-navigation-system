/** @type {import('next').NextConfig} */
const nextConfig = {
  /* config options here */
  output: 'standalone',
  // Docker環境でのホットリロードを有効にする
  webpack: (config, { dev, isServer }) => {
    if (dev && !isServer) {
      // クライアント側の開発モードでのみ適用
      config.watchOptions = {
        ...config.watchOptions,
        poll: 1000, // Docker環境でのポーリングを有効にする
      };
    }
    return config;
  },
};

module.exports = nextConfig;
