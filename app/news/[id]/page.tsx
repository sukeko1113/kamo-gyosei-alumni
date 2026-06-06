// お知らせ詳細ページ（/news/[id]）。
// 動的ルートの id を受け取り、該当するお知らせ 1 件を表示する。
// サーバーコンポーネントのため API キーはブラウザに漏れない。
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";

import { getNewsDetail } from "@/lib/microcms";
import { formatJaDate } from "@/lib/utils";

// ISR: 60 秒ごとに再生成する。microCMS で記事を更新すると、
// 再デプロイなしで最大 60 秒後に詳細ページへ反映される。
export const revalidate = 60;

// Next.js 15 では params は Promise で渡されるため await して取り出す。
type NewsDetailPageProps = {
  params: Promise<{ id: string }>;
};

// 該当記事を取得する内部ヘルパー。存在しない id の場合は null を返す。
// （microCMS SDK は 404 時に例外を投げるため、ここで握りつぶして null に変換する）
async function fetchNews(id: string) {
  try {
    return await getNewsDetail(id);
  } catch {
    return null;
  }
}

// ブラウザのタブやSNS共有時のタイトルを記事ごとに設定する。
export async function generateMetadata({
  params,
}: NewsDetailPageProps): Promise<Metadata> {
  const { id } = await params;
  const news = await fetchNews(id);

  if (!news) {
    return { title: "お知らせが見つかりません | 加茂暁星高等学校 同窓会" };
  }

  return {
    title: `${news.title} | 加茂暁星高等学校 同窓会`,
  };
}

export default async function NewsDetailPage({ params }: NewsDetailPageProps) {
  const { id } = await params;
  const news = await fetchNews(id);

  // 該当する記事が無ければ 404 ページを表示する。
  if (!news) {
    notFound();
  }

  // 掲載日。任意の publishedDate を優先し、無ければシステムの publishedAt、
  // それも無ければ作成日（createdAt）で代替する。
  const publishedDate = news.publishedDate ?? news.publishedAt ?? news.createdAt;

  return (
    <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-10 sm:px-6">
      <article>
        <header className="mb-8">
          {/* 公開日（日本語表記） */}
          <p className="mb-3 text-base text-muted-foreground">
            <time dateTime={publishedDate}>{formatJaDate(publishedDate)}</time>
          </p>
          <h1 className="text-3xl font-bold leading-tight sm:text-4xl">
            {news.title}
          </h1>
          {news.category && news.category.length > 0 && (
            <div className="mt-4">
              <span className="inline-block rounded-full bg-secondary px-3 py-1 text-base text-secondary-foreground">
                {news.category.join("・")}
              </span>
            </div>
          )}
        </header>

        {news.eyecatch && (
          // アイキャッチ画像（ある場合のみ表示）。
          // microCMS が幅・高さを返すため、それを使って正しい比率で表示する。
          <Image
            src={news.eyecatch.url}
            alt=""
            width={news.eyecatch.width}
            height={news.eyecatch.height}
            sizes="(max-width: 768px) 100vw, 768px"
            className="mb-8 h-auto w-full rounded-xl"
            priority
          />
        )}

        {/* 本文（microCMS リッチエディタの HTML）。
            microCMS は信頼できる管理元のため dangerouslySetInnerHTML を許容する。 */}
        <div
          className="news-content"
          dangerouslySetInnerHTML={{ __html: news.content }}
        />
      </article>

      {/* 一覧へ戻るリンク */}
      <div className="mt-12 border-t pt-8">
        <Link
          href="/news"
          className="inline-flex items-center gap-1 text-lg font-medium text-primary underline-offset-4 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <span aria-hidden="true">←</span>
          お知らせ一覧へ戻る
        </Link>
      </div>
    </main>
  );
}
