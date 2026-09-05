import type { Metadata } from "next";
// 日本語を美しく表示できる Noto Sans JP（本文）と Noto Serif JP（見出し）を
// Google Fonts から読み込む。
import { Noto_Sans_JP, Noto_Serif_JP } from "next/font/google";
import "./globals.css";
// ログイン状態をアプリ全体で共有するための Provider。
import { AuthProvider } from "@/components/auth-provider";
// 全ページ共通のヘッダー・フッター（どのページからもトップへ戻れるようにする）。
import { SiteHeader } from "@/components/layout/site-header";
import { SiteFooter } from "@/components/layout/site-footer";

// 本文フォント。CSS 変数 --font-noto-sans-jp として使えるようにする。
// 見出しの font-medium / font-bold を正しく描画するため太さも読み込む。
const notoSansJP = Noto_Sans_JP({
  variable: "--font-noto-sans-jp",
  subsets: ["latin"],
  weight: ["400", "500", "700"],
  display: "swap",
});

// 見出し（明朝）フォント。CSS 変数 --font-noto-serif-jp として使えるようにする。
const notoSerifJP = Noto_Serif_JP({
  variable: "--font-noto-serif-jp",
  subsets: ["latin"],
  weight: ["500", "600", "700"],
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
    <html
      lang="ja"
      className={`${notoSansJP.variable} ${notoSerifJP.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col font-sans">
        {/* AuthProvider で包むことで、配下の全ページがログイン状態を参照できる */}
        <AuthProvider>
          {/* 共通ヘッダー。サイト名でトップへ戻れ、ログイン中は「マイページ」を表示する。
              ログイン状態を参照するため AuthProvider の内側に置く。 */}
          <SiteHeader />
          {children}
          <SiteFooter />
        </AuthProvider>
      </body>
    </html>
  );
}
