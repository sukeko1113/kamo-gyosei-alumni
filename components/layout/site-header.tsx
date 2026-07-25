import Image from "next/image";
import Link from "next/link";

// ナビの並び。沿革・お知らせ・会員の方へ はトップページ内の該当セクションへ
// スクロールするアンカー。ログインは既存の /login ルートへ遷移する。
const NAV_LINKS = [
  { href: "#history", label: "沿革" },
  { href: "#news", label: "お知らせ" },
  { href: "#members", label: "会員の方へ" },
];

/**
 * 共通ヘッダー（校章 + サイト名 + ナビ + ログイン）。
 * 全ページで再利用できるよう切り出した共通コンポーネント。
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
          <a
            key={link.href}
            href={link.href}
            className="flex min-h-[44px] items-center px-4 text-base font-medium text-sumi no-underline transition-colors hover:text-ai"
          >
            {link.label}
          </a>
        ))}
        <Link
          href="/login"
          className="ml-2 flex min-h-[44px] items-center rounded-sm bg-ai px-6 text-base font-medium text-kinari no-underline transition-colors hover:bg-ai-dark hover:text-kinari"
        >
          ログイン
        </Link>
      </nav>
    </header>
  );
}
