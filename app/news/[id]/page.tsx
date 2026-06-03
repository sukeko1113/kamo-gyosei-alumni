// お知らせ記事の詳細ページ（/news/[id]）。
// URL の id を使って microCMS から記事 1 件をサーバーサイドで取得して表示する。
import Link from "next/link";
import { notFound } from "next/navigation";
import { getNewsDetail } from "@/lib/microcms";
import { formatJaDate } from "@/lib/utils";
import type { News } from "@/types";

// 毎回最新の内容を表示するため、動的レンダリングにする
// （ビルド時に microCMS へアクセスしない）。
export const dynamic = "force-dynamic";

// Next.js 15 では params は Promise として渡ってくるので、await で取り出す。
type PageProps = {
  params: Promise<{ id: string }>;
};

export default async function NewsDetailPage({ params }: PageProps) {
  const { id } = await params;

  // 記事を取得する。存在しない id だと microCMS がエラーを投げるので、
  // try/catch で受け止めて notFound()（404 ページ）に振り分ける。
  let news: News;
  try {
    news = await getNewsDetail(id);
  } catch {
    notFound();
  }

  return (
    <main className="mx-auto w-full max-w-2xl flex-1 p-8">
      {/* 掲載日。publishedDate が無ければ自動付与の publishedAt で代用する。 */}
      <p className="text-base text-muted-foreground">
        {formatJaDate(news.publishedDate ?? news.publishedAt)}
      </p>

      {/* タイトル */}
      <h1 className="mt-2 text-3xl font-bold">{news.title}</h1>

      {/*
        本文の表示。
        content はリッチエディタが生成した HTML 文字列なので、
        通常の {news.content} ではタグがそのまま文字として表示されてしまう。
        HTML として描画するには dangerouslySetInnerHTML を使う必要がある。
        ※ この HTML は管理者が microCMS で作成した信頼できる内容に限られるため、
          ここでは許容している（外部ユーザーの入力をそのまま表示する箇所では使わないこと）。
        prose 系クラスは付けず、最低 16px（text-base）を満たす基本スタイルにしている。
      */}
      <div
        className="mt-6 text-base leading-relaxed [&_a]:text-primary [&_a]:underline"
        dangerouslySetInnerHTML={{ __html: news.content }}
      />

      {/* 一覧（トップページ）に戻るリンク。 */}
      <div className="mt-10">
        <Link
          href="/"
          className="text-base text-primary underline-offset-4 hover:underline"
        >
          ← お知らせ一覧に戻る
        </Link>
      </div>
    </main>
  );
}
