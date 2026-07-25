// トップページ。
// 同窓会サイトの顔として、あゆみ（沿革）・お知らせ・会員導線を1枚で見せる。
// お知らせ（news）は microCMS からサーバーサイドで取得し、最新数件をプレビュー表示する。
// 全件は /news の一覧ページへ誘導する。
import { SiteHeader } from "@/components/layout/site-header";
import { SiteFooter } from "@/components/layout/site-footer";
import { Hero } from "@/components/home/hero";
import { History } from "@/components/home/history";
import { NewsSection } from "@/components/home/news-list";
import { MemberLinks } from "@/components/home/member-links";
import { getNewsList } from "@/lib/microcms";

// 毎回最新のお知らせを表示するため、動的レンダリングにする。
export const dynamic = "force-dynamic";

export default async function Home() {
  // サーバー側で最新のお知らせを取得する（最新4件・公開日の新しい順）。
  const { contents: newsList } = await getNewsList({ limit: 4 });

  return (
    <div className="flex min-h-screen flex-col bg-kinari text-sumi">
      <SiteHeader />
      <main className="flex-1">
        <Hero />
        <History />
        <NewsSection items={newsList} />
        <MemberLinks />
      </main>
      <SiteFooter />
    </div>
  );
}
