// LINE ログインの開始（GET /api/auth/line/start）。
// CSRF 対策の state とリプレイ対策の nonce を生成して Cookie に保存し、
// LINE の認可画面へリダイレクトする。
import { randomBytes } from "crypto";
import { NextResponse } from "next/server";

import { getLineEnv } from "@/lib/line";

// state / nonce は毎回新しく作るため、常に動的レンダリングにする。
export const dynamic = "force-dynamic";

// state / nonce 用 Cookie の共通設定。
// - httpOnly: JavaScript から読めないようにする
// - secure: HTTPS でのみ送信する
// - sameSite=lax: LINE からのリダイレクト（トップレベル遷移）でも送られる
// - maxAge 600 秒: ログイン操作に十分な短い寿命にする
const COOKIE_OPTIONS = {
  httpOnly: true,
  secure: true,
  sameSite: "lax",
  path: "/",
  maxAge: 600,
} as const;

export async function GET(request: Request) {
  let env;
  try {
    env = getLineEnv();
  } catch (error) {
    // 環境変数の設定漏れ。詳細はサーバーログにのみ残す。
    console.error("LINE ログインを開始できません:", error);
    return NextResponse.redirect(
      new URL("/login?error=line_unknown", request.url)
    );
  }

  // CSRF 対策の state と、ID トークンのリプレイ対策の nonce（各32バイトの乱数）。
  const state = randomBytes(32).toString("hex");
  const nonce = randomBytes(32).toString("hex");

  // LINE の認可エンドポイントへのリダイレクト URL を組み立てる。
  // scope は profile（表示名・画像）と openid（ID トークン）のみ。email は要求しない。
  const authorizeUrl = new URL("https://access.line.me/oauth2/v2.1/authorize");
  authorizeUrl.search = new URLSearchParams({
    response_type: "code",
    client_id: env.channelId,
    redirect_uri: env.redirectUri,
    state,
    scope: "profile openid",
    nonce,
    ui_locales: "ja", // 同意画面を日本語で表示する
  }).toString();

  const response = NextResponse.redirect(authorizeUrl);
  response.cookies.set("line_oauth_state", state, COOKIE_OPTIONS);
  response.cookies.set("line_oauth_nonce", nonce, COOKIE_OPTIONS);
  return response;
}
