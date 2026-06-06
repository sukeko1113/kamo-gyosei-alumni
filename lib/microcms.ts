// microCMS クライアント（サーバーサイド専用）。
// 先頭の "server-only" により、このファイルを誤ってクライアント側で import すると
// ビルドエラーになる。API キーがブラウザに漏れるのを防ぐための安全装置。
import "server-only";
import { createClient, type MicroCMSQueries } from "microcms-js-sdk";
import type { News, NewsListResponse } from "@/types";

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

// ----------------------------------------------------------------
// お知らせ（news エンドポイント）
// ----------------------------------------------------------------

// お知らせの一覧を取得する。
// 既定では publishedAt（システムの公開日時）の降順（新しい順）に並べる。
// publishedAt は microCMS が必ず付与するため、並び順の基準として安全。
// 件数や並び順を変えたい場合は queries で上書きできる
//   例: getNewsList({ limit: 10 }) … トップページなど最新数件だけ欲しいとき
// 戻り値は microCMS のリスト形式（contents / totalCount / offset / limit）。
export async function getNewsList(
  queries?: MicroCMSQueries
): Promise<NewsListResponse> {
  return client.getList<News>({
    endpoint: "news",
    queries: { orders: "-publishedAt", ...queries },
  });
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
