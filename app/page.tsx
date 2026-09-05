// トップページ。
// 同窓会サイトの顔として、今日の瞑想録・あゆみ（沿革）・お知らせ・会員導線を1枚で見せる。
// 瞑想録・お知らせは microCMS からサーバーサイドで取得する。
// お知らせの全件は /news の一覧ページへ誘導する。
import { MeditationSection } from "@/components/home/meditation-section";
import { Hero } from "@/components/home/hero";
import { History } from "@/components/home/history";
import { NewsSection } from "@/components/home/news-list";
import { MemberLinks } from "@/components/home/member-links";
import { getMeditationByDate, getNewsList } from "@/lib/microcms";
import { formatMonthDayKanji, getTokyoMonthDay } from "@/lib/utils";

// ISR: 10 分ごとに再生成する。日付が変わった後も最大 10 分で
// その日の瞑想録・最新のお知らせに入れ替わる。
export const revalidate = 600;

export default async function Home() {
  // 「今日」は日本時間（Asia/Tokyo）で判定する（サーバーは UTC のため）。
  const today = getTokyoMonthDay();

  // サーバー側で「今日の瞑想録」と最新のお知らせ（最新4件）を並行取得する。
  // 瞑想録は該当日のコンテンツが無い・API エラーの場合 null が返り、
  // セクションごと非表示になる（ページ全体は落とさない）。
  const [meditation, { contents: newsList }] = await Promise.all([
    getMeditationByDate(today),
    getNewsList({ limit: 4 }),
  ]);

  // ヘッダー・フッターはルートレイアウト（app/layout.tsx）で全ページ共通に
  // 表示されるため、ここでは本文だけを描画する。
  return (
    <main className="flex-1 bg-kinari text-sumi">
      {/* 今日の瞑想録（共通ヘッダー直下・既存ヒーローの上）。該当日が無ければ出さない。 */}
      {meditation && (
        <MeditationSection
          meditation={meditation}
          kanjiDate={formatMonthDayKanji(meditation.date)}
        />
      )}
      <Hero />
      <History />
      <NewsSection items={newsList} />
      <MemberLinks />
    </main>
  );
}
