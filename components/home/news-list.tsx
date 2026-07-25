import Link from "next/link";
import type { News } from "@/types";
import { formatJaDate } from "@/lib/utils";

type NewsSectionProps = {
  // 最新のお知らせ（トップページ側で microCMS から取得して渡す）。
  items: News[];
};

/**
 * お知らせ：日付 + タイトルのシンプルなリスト。
 * データは microCMS（news エンドポイント）から取得したものを props で受け取る。
 * 各記事は詳細ページ /news/[id] へ、末尾のリンクは一覧 /news へ誘導する。
 */
export function NewsSection({ items }: NewsSectionProps) {
  return (
    <section id="news" className="bg-washi-panel">
      <div className="mx-auto max-w-[880px] px-6 py-[clamp(64px,10vw,120px)]">
        <h2 className="m-0 mb-3 font-serif text-[clamp(24px,3.5vw,32px)] font-semibold tracking-[0.2em]">
          お知らせ
        </h2>
        <p className="m-0 mb-10 text-base tracking-[0.1em] text-ink-muted">NEWS</p>

        {items.length === 0 ? (
          // 記事が1件も無いときの表示。
          <p className="text-base text-ink-muted">お知らせはまだありません。</p>
        ) : (
          <ul className="m-0 flex list-none flex-col p-0">
            {items.map((item) => (
              <li key={item.id} className="border-t border-washi-rule">
                <Link
                  href={`/news/${item.id}`}
                  className="flex min-h-[44px] flex-wrap items-baseline gap-x-8 gap-y-2 px-1 py-5 text-sumi no-underline transition-colors hover:bg-washi-hover"
                >
                  <time className="flex-shrink-0 text-base tracking-[0.06em] text-ink-muted tabular-nums">
                    {/* 掲載日。publishedDate が無ければシステムの publishedAt で代替。 */}
                    {formatJaDate(item.publishedDate ?? item.publishedAt)}
                  </time>
                  <span className="text-[17px] font-medium leading-[1.7]">
                    {item.title}
                  </span>
                </Link>
              </li>
            ))}
            {/* リスト末尾の罫線 */}
            <li className="border-t border-washi-rule" />
          </ul>
        )}

        <Link
          href="/news"
          className="mt-6 inline-flex min-h-[44px] items-center px-2 text-base font-medium tracking-[0.08em] text-ai no-underline"
        >
          お知らせ一覧へ →
        </Link>
      </div>
    </section>
  );
}
