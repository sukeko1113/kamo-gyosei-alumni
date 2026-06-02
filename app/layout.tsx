import type { Metadata } from "next";
// 日本語を美しく表示できる Noto Sans JP を Google Fonts から読み込む。
import { Noto_Sans_JP } from "next/font/google";
import "./globals.css";

// フォントを CSS 変数 --font-noto-sans-jp として使えるようにする。
const notoSansJP = Noto_Sans_JP({
  variable: "--font-noto-sans-jp",
  subsets: ["latin"],
  display: "swap",
});

// ブラウザのタブやSNS共有時に表示されるサイトの基本情報。
export const metadata: Metadata = {
  title: "加茂暁星高等学校 同窓会",
  description: "加茂暁星高等学校 同窓会の公式ウェブサイトです。",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    // lang="ja" で日本語サイトであることをブラウザ・支援技術に伝える。
    <html lang="ja" className={`${notoSansJP.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col font-sans">{children}</body>
    </html>
  );
}
