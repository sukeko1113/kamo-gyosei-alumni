// LINE Login（認可コードフロー）のサーバー専用ヘルパー。
// トークン交換と ID トークン検証を LINE の公式 API に対して行う。
//
// ★ 重要 ★
// LINE_CHANNEL_SECRET などの秘密情報を扱うため、サーバーでのみ動かす。
// 万一クライアントから import された場合にビルドで気付けるよう
// "server-only" を読み込んでおく。
import "server-only";

// LINE Login に必要な環境変数（すべてサーバー専用。NEXT_PUBLIC_ は付けない）。
export type LineEnv = {
  channelId: string;
  channelSecret: string;
  redirectUri: string;
};

// 環境変数を読み込んで返す。未設定なら例外を投げる（設定漏れに早く気付くため）。
export function getLineEnv(): LineEnv {
  const channelId = process.env.LINE_CHANNEL_ID;
  const channelSecret = process.env.LINE_CHANNEL_SECRET;
  const redirectUri = process.env.LINE_REDIRECT_URI;

  if (!channelId || !channelSecret || !redirectUri) {
    throw new Error(
      "LINE Login の環境変数が未設定です。LINE_CHANNEL_ID / " +
        "LINE_CHANNEL_SECRET / LINE_REDIRECT_URI を設定してください。"
    );
  }

  return { channelId, channelSecret, redirectUri };
}

// トークンエンドポイントのレスポンスのうち、このアプリで使う項目。
type LineTokenResponse = {
  id_token?: string;
};

// ID トークン検証エンドポイントのレスポンスのうち、このアプリで使う項目。
// sub = LINE のユーザー ID（U から始まる文字列）。
export type LineIdTokenPayload = {
  sub: string;
  name?: string;
  picture?: string;
};

// 認可コードを LINE のトークンエンドポイントへ送り、ID トークンを受け取る。
// 失敗した場合は null を返す（詳細は呼び出し側でエラーページへ誘導する）。
export async function exchangeCodeForIdToken(
  code: string,
  env: LineEnv
): Promise<string | null> {
  const response = await fetch("https://api.line.me/oauth2/v2.1/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "authorization_code",
      code,
      redirect_uri: env.redirectUri,
      client_id: env.channelId,
      client_secret: env.channelSecret,
    }),
    // 認可コードは1回限りなのでキャッシュしない。
    cache: "no-store",
  });

  if (!response.ok) {
    // 失敗理由（invalid_grant 等）だけ記録する。トークンやシークレットは絶対に出さない。
    console.error("LINE トークン交換に失敗しました。status:", response.status);
    return null;
  }

  const data = (await response.json()) as LineTokenResponse;
  return data.id_token ?? null;
}

// ID トークンを LINE の検証エンドポイントへ送り、署名・有効期限・nonce を検証する。
// 検証に通れば sub / name / picture を返し、失敗なら null を返す。
export async function verifyLineIdToken(
  idToken: string,
  nonce: string,
  env: LineEnv
): Promise<LineIdTokenPayload | null> {
  const response = await fetch("https://api.line.me/oauth2/v2.1/verify", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      id_token: idToken,
      client_id: env.channelId,
      // nonce を渡すと、LINE 側で ID トークン内の nonce と一致するか検証してくれる
      //（リプレイ攻撃対策）。一致しなければエラーになる。
      nonce,
    }),
    cache: "no-store",
  });

  if (!response.ok) {
    console.error("LINE ID トークン検証に失敗しました。status:", response.status);
    return null;
  }

  const payload = (await response.json()) as Partial<LineIdTokenPayload>;
  if (typeof payload.sub !== "string" || payload.sub.length === 0) {
    console.error("LINE ID トークンに sub が含まれていません。");
    return null;
  }

  return {
    sub: payload.sub,
    name: typeof payload.name === "string" ? payload.name : undefined,
    picture: typeof payload.picture === "string" ? payload.picture : undefined,
  };
}
