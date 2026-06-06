import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    // 外部から配信される画像を next/image で最適化表示するために、
    // 許可する配信ドメインを列挙する。
    remotePatterns: [
      {
        // microCMS にアップロードした画像（お知らせのアイキャッチ等）。
        protocol: "https",
        hostname: "images.microcms-assets.io",
      },
      {
        // Google ログインのプロフィール画像。
        protocol: "https",
        hostname: "lh3.googleusercontent.com",
      },
    ],
  },
};

export default nextConfig;
