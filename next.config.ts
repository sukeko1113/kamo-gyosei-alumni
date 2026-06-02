import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    // Google ログインのプロフィール画像（lh3.googleusercontent.com）を
    // next/image で表示できるように許可する。
    remotePatterns: [
      {
        protocol: "https",
        hostname: "lh3.googleusercontent.com",
      },
    ],
  },
};

export default nextConfig;
