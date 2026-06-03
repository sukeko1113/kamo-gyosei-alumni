// microCMS クライアント（サーバーサイド専用）。
// 先頭の "server-only" により、このファイルを誤ってクライアント側で import すると
// ビルドエラーになる。API キーがブラウザに漏れるのを防ぐための安全装置。
import "server-only";
import { createClient, type MicroCMSQueries } from "microcms-js-sdk";
import type { Blog, BlogListResponse, News } from "@/types";

// 環境変数を読み込む。MICROCMS_API_KEY には絶対に NEXT_PUBLIC_ を付けないこと
// （付けるとブラウザに公開され、誰でも管理 API を叩けてしまう）。
const serviceDomain = process.env.MICROCMS_SERVICE_DOMAIN;
const apiKey = process.env.MICROCMS_API_KEY;

// 設定漏れを早期に気づけるよう、未設定なら明確なエラーを出す。
if (!serviceDomain || !apiKey) {
  throw new Error(
    "microCMS の環境変数が設定されていません。.env.local に MICROCMS_SERVICE_DOMAIN と MICROCMS_API_KEY を設定してください。"
  );
}

// microCMS SDK のクライアントを生成する。
const client = createClient({ serviceDomain, apiKey });

// 記事の一覧を取得する（エンドポイント: blogs）。
// queries で limit / offset / filters などの絞り込み条件を渡せる。
export async function getBlogs(queries?: MicroCMSQueries): Promise<BlogListResponse> {
  return client.getList<Blog>({ endpoint: "blogs", queries });
}

// 記事 1 件を ID 指定で取得する（記事詳細ページなどで使用）。
export async function getBlogDetail(
  contentId: string,
  queries?: MicroCMSQueries
): Promise<Blog> {
  return client.getListDetail<Blog>({ endpoint: "blogs", contentId, queries });
}

// ----------------------------------------------------------------
// お知らせ（news エンドポイント）
// ----------------------------------------------------------------

// お知らせの一覧を取得する（掲載日 publishedDate の新しい順、最大 10 件）。
// orders に "-publishedDate" を指定すると降順（新しい順）になる。
// 戻り値は記事の配列だけにして、呼び出し側（サーバーコンポーネント）で扱いやすくする。
export async function getNewsList(): Promise<News[]> {
  const res = await client.getList<News>({
    endpoint: "news",
    queries: { orders: "-publishedDate", limit: 10 },
  });
  return res.contents;
}

// お知らせ 1 件を ID 指定で取得する（記事詳細ページで使用）。
// 存在しない ID の場合、microCMS SDK はエラーを投げるため、呼び出し側で
// try/catch して notFound()（404）に振り分ける。
export async function getNewsDetail(
  contentId: string,
  queries?: MicroCMSQueries
): Promise<News> {
  return client.getListDetail<News>({ endpoint: "news", contentId, queries });
}
