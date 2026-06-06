// トップページ。
// お知らせ（news）の最新記事をサーバーサイドで取得し、
// 最新数件だけを「プレビュー」として表示する。全件は /news の一覧ページで見せる。
// データ取得（getNewsList）はサーバーコンポーネントなので、そのまま await で呼べる。
import Link from "next/link";
import { HomeCta } from "@/components/home-cta";
import { getNewsList } from "@/lib/microcms";
import { formatJaDate } from "@/lib/utils";

// 毎回最新のお知らせを表示するため、動的レンダリングにする。
// （ビルド時に microCMS へアクセスしないので、記事の更新がすぐ反映される）
export const dynamic = "force-dynamic";

export default async function Home() {
  // サーバー側で最新のお知らせを取得する（最新3件・公開日の新しい順）。
  // トップは「プレビュー」なので少数だけ表示し、全件は /news へ誘導する。
  // getNewsList はリスト形式（contents 等）を返すため、必要な contents を取り出す。
  const { contents: newsList } = await getNewsList({ limit: 3 });

  return (
    <main className="flex flex-1 flex-col items-center gap-10 p-8">
      {/* サイトの見出しとログイン導線 */}
      <section className="flex flex-col items-center gap-6 text-center">
        <h1 className="text-3xl font-bold sm:text-4xl">加茂暁星高等学校 同窓会</h1>
        <p className="max-w-xl text-lg text-muted-foreground">
          当ウェブサイトは現在準備中です。
          卒業生のみなさまに役立つ情報を順次公開してまいります。
        </p>
        {/* 未ログインなら「ログイン」、ログイン済みなら「マイページ」を表示する */}
        <HomeCta />
      </section>

      {/* お知らせ一覧（ログインの有無に関わらず誰でも閲覧できる公開情報） */}
      <section className="w-full max-w-2xl">
        <h2 className="text-2xl font-bold">お知らせ</h2>

        {newsList.length === 0 ? (
          // 記事が1件もないときの表示。
          <p className="mt-4 text-base text-muted-foreground">お知らせはまだありません。</p>
        ) : (
          // 最新数件のプレビュー。掲載日とタイトル（リンク）を縦に並べる。
          <ul className="mt-4 flex flex-col divide-y divide-border rounded-lg border border-border">
            {newsList.map((news) => (
              <li key={news.id} className="p-4">
                {/* 掲載日。publishedDate が無い場合は自動付与の publishedAt で代用する。 */}
                <p className="text-base text-muted-foreground">
                  {formatJaDate(news.publishedDate ?? news.publishedAt)}
                </p>
                {/* タイトルは詳細ページ /news/[id] へのリンクにする。 */}
                <Link
                  href={`/news/${news.id}`}
                  className="text-lg font-medium text-primary underline-offset-4 hover:underline"
                >
                  {news.title}
                </Link>
              </li>
            ))}
          </ul>
        )}

        {/* 全件はお知らせ一覧ページ（/news）で確認できるよう導線を置く。 */}
        <div className="mt-6 text-right">
          <Link
            href="/news"
            className="inline-flex items-center gap-1 text-lg font-medium text-primary underline-offset-4 hover:underline"
          >
            お知らせ一覧へ
            <span aria-hidden="true">→</span>
          </Link>
        </div>
      </section>
    </main>
  );
}
