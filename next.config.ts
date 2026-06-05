import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    // microCMS にアップロードした画像（アイキャッチ等）を
    // next/image で最適化表示するために、配信ドメインを許可する。
    remotePatterns: [
      {
        protocol: "https",
        hostname: "images.microcms-assets.io",
      },
    ],
  },
};

export default nextConfig;
