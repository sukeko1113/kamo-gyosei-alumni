// お知らせ一覧ページ（/news）。
// microCMS の news エンドポイントから記事を取得して一覧表示する。
// サーバーコンポーネントなので、API キーはサーバー側にとどまりブラウザに漏れない。
import Image from "next/image";
import Link from "next/link";
import type { Metadata } from "next";

import { getNewsList } from "@/lib/microcms";
import { formatDateJa } from "@/lib/utils";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export const metadata: Metadata = {
  title: "お知らせ | 加茂暁星高等学校 同窓会",
  description: "加茂暁星高等学校 同窓会からのお知らせ・イベント情報の一覧です。",
};

// ISR: 60 秒ごとに再生成する。microCMS で記事を更新すると、
// 再デプロイなしで最大 60 秒後に一覧へ反映される。
export const revalidate = 60;

export default async function NewsListPage() {
  // 公開日の降順（新しい順）でお知らせを取得する。
  // 並び順は getNewsList の既定（-publishedAt）に従う。
  const { contents } = await getNewsList();

  return (
    <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-10 sm:px-6">
      <h1 className="mb-8 text-3xl font-bold sm:text-4xl">お知らせ</h1>

      {contents.length === 0 ? (
        // 記事が 1 件もないときの案内。
        <p className="text-lg text-muted-foreground">お知らせはまだありません。</p>
      ) : (
        <ul className="flex flex-col gap-6">
          {contents.map((news) => (
            <li key={news.id}>
              {/* カード全体を詳細ページへのリンクにする */}
              <Link
                href={`/news/${news.id}`}
                className="block rounded-xl transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                <Card className="overflow-hidden pt-0 hover:bg-accent/50">
                  {news.eyecatch && (
                    // アイキャッチ画像（ある場合のみ表示）。
                    <div className="relative aspect-video w-full bg-muted">
                      <Image
                        src={news.eyecatch.url}
                        alt=""
                        fill
                        sizes="(max-width: 768px) 100vw, 768px"
                        className="object-cover"
                      />
                    </div>
                  )}
                  <CardHeader className={news.eyecatch ? "pt-6" : undefined}>
                    {/* 公開日（日本語表記）。掲載日 publishedDate を優先し、
                        無ければ publishedAt、それも無ければ作成日で代替する。 */}
                    <CardDescription>
                      <time
                        dateTime={
                          news.publishedDate ??
                          news.publishedAt ??
                          news.createdAt
                        }
                      >
                        {formatDateJa(
                          news.publishedDate ??
                            news.publishedAt ??
                            news.createdAt
                        )}
                      </time>
                    </CardDescription>
                    <CardTitle className="text-xl sm:text-2xl">
                      {news.title}
                    </CardTitle>
                  </CardHeader>
                  {news.category && news.category.length > 0 && (
                    <CardContent>
                      <span className="inline-block rounded-full bg-secondary px-3 py-1 text-base text-secondary-foreground">
                        {news.category.join("・")}
                      </span>
                    </CardContent>
                  )}
                </Card>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
