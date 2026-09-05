import Image from "next/image";
import Link from "next/link";

import { HeaderAuthLink } from "@/components/layout/header-auth-link";

// ナビの並び。沿革・お知らせ・会員の方へ はトップページ内の該当セクションへの
// アンカー。全ページ共通ヘッダーになったため、トップページ以外から押しても
// 「/ へ移動してからスクロール」できるよう `/#...` 形式にする。
const NAV_LINKS = [
  { href: "/#history", label: "沿革" },
  { href: "/#news", label: "お知らせ" },
  { href: "/#members", label: "会員の方へ" },
];

/**
 * 共通ヘッダー（校章 + サイト名 + ナビ + ログイン／マイページ）。
 * ルートレイアウトから全ページで表示する共通コンポーネント。
 * サイト名（ロゴ）をクリックするとトップページ（/）へ戻れる。
 * 高齢の利用者に配慮し、リンクのタップ領域は最小 44px を確保している。
 */
export function SiteHeader() {
  return (
    <header className="flex flex-wrap items-center justify-between gap-4 border-b border-washi-line bg-kinari px-5 py-4 sm:px-[clamp(20px,5vw,56px)]">
      <Link
        href="/"
        className="flex min-h-[44px] items-center gap-[14px] text-sumi no-underline"
      >
        <Image
          src="/images/school-emblem.jpg"
          alt="加茂暁星高等学校 校章"
          width={44}
          height={44}
          className="h-11 w-11 object-contain"
          priority
        />
        <span className="flex flex-col">
          <span className="font-serif text-lg font-semibold tracking-[0.08em]">
            加茂暁星高等学校 同窓会
          </span>
          <span className="text-xs tracking-[0.14em] text-ink-muted">
            KAMO GYOSEI ALUMNI
          </span>
        </span>
      </Link>

      <nav className="flex flex-wrap items-center gap-1">
        {NAV_LINKS.map((link) => (
          <Link
            key={link.href}
            href={link.href}
            className="flex min-h-[44px] items-center px-4 text-base font-medium text-sumi no-underline transition-colors hover:text-ai"
          >
            {link.label}
          </Link>
        ))}
        {/* ログイン状態で「ログイン」⇔「マイページ」を切り替える（クライアント部品） */}
        <HeaderAuthLink />
      </nav>
    </header>
  );
}
