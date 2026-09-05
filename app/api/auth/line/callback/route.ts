// LINE ログインのコールバック（GET /api/auth/line/callback）。
// LINE の認可画面から戻ってきたリクエストを処理する。
//
// 流れ:
// 1. state を Cookie と突き合わせて検証（CSRF 対策）
// 2. 認可コードを ID トークンに交換
// 3. ID トークンを LINE の検証 API で検証（nonce も確認）
// 4. lineAccounts/{lineUserId} のマッピングから Firebase UID を解決
//    （初回は Firebase ユーザーを新規作成してマッピングを保存）
// 5. カスタムトークンを発行し、/login/line へフラグメント（#）で渡す
//
// ★ 会員 ID は Firebase UID。LINE のユーザー ID（sub）を UID にはしない。
//   次フェーズで Google 会員との連携を lineAccounts/{sub}.uid の付け替えだけで
//   実現できるようにするため。
import { NextResponse, type NextRequest } from "next/server";
import { FieldValue } from "firebase-admin/firestore";

import { getAdminAuth, getAdminDb } from "@/lib/firebase-admin";
import {
  exchangeCodeForIdToken,
  getLineEnv,
  verifyLineIdToken,
} from "@/lib/line";

// 認可コードは毎回異なるため、常に動的レンダリングにする。
export const dynamic = "force-dynamic";

// state / nonce Cookie を削除した上でリダイレクトするヘルパー。
function redirectWithCleanup(request: NextRequest, path: string): NextResponse {
  const response = NextResponse.redirect(new URL(path, request.url));
  // maxAge 0 で即時失効させる（使い捨ての値なので残さない）。
  response.cookies.set("line_oauth_state", "", { path: "/", maxAge: 0 });
  response.cookies.set("line_oauth_nonce", "", { path: "/", maxAge: 0 });
  return response;
}

// LINE のユーザー ID（sub）から Firebase UID を解決する。
// 初回ログインなら Firebase ユーザーを新規作成し、
// lineAccounts / users へマッピングを保存する。
async function resolveFirebaseUid(payload: {
  sub: string;
  name?: string;
  picture?: string;
}): Promise<string> {
  const auth = getAdminAuth();
  const db = getAdminDb();

  // マッピング（lineAccounts/{lineUserId}）を確認する。
  const mappingRef = db.collection("lineAccounts").doc(payload.sub);
  const mappingSnap = await mappingRef.get();

  if (mappingSnap.exists) {
    const uid = mappingSnap.get("uid");
    if (typeof uid === "string" && uid.length > 0) {
      try {
        // マッピング先の Firebase ユーザーが実在するか確認する。
        await auth.getUser(uid);
        return uid;
      } catch {
        // ユーザーが削除されている等、マッピングが壊れている場合は
        // 下の新規作成フローで作り直す（マッピングも上書きされる）。
      }
    }
  }

  // 初回ログイン: Firebase ユーザーを新規作成する（UID は自動生成に任せる）。
  const created = await auth.createUser({
    displayName: payload.name,
    // photoURL は空文字などを渡すとエラーになるため、値がある時だけ渡す。
    ...(payload.picture ? { photoURL: payload.picture } : {}),
  });
  const uid = created.uid;

  // マッピングと会員ドキュメントをまとめて保存する（どちらか片方だけ
  // 書かれて不整合になるのを避けるためバッチ書き込みにする）。
  const batch = db.batch();
  batch.set(mappingRef, {
    uid,
    linkedAt: FieldValue.serverTimestamp(),
    displayName: payload.name ?? "",
  });
  // users/{uid} は必ず merge: true で書く（他の処理が書いた内容を消さないため）。
  // ★ updatedAt は絶対に書かない。「プロフィール登録済み」の判定に使われており、
  //   サーバーが書くと未登録者が名簿を閲覧できてしまう。
  batch.set(
    db.collection("users").doc(uid),
    {
      uid,
      email: null, // LINE からはメールアドレスを取得しない
      displayName: payload.name ?? null,
      photoURL: payload.picture ?? null,
      role: "member", // 初期権限は一般会員（クライアントの ensureUserDocument と同じ）
      authProviders: ["line"],
      lineUserId: payload.sub,
      createdAt: FieldValue.serverTimestamp(),
    },
    { merge: true }
  );
  await batch.commit();

  return uid;
}

export async function GET(request: NextRequest) {
  const params = request.nextUrl.searchParams;

  // 1. ユーザーが同意画面でキャンセルした場合など、LINE からエラーが返ってきたとき。
  if (params.get("error")) {
    return redirectWithCleanup(request, "/login?error=line_cancelled");
  }

  // 2. state の検証（CSRF 対策）。Cookie の値と一致しなければ処理しない。
  const state = params.get("state");
  const cookieState = request.cookies.get("line_oauth_state")?.value;
  if (!state || !cookieState || state !== cookieState) {
    return redirectWithCleanup(request, "/login?error=line_state");
  }

  const code = params.get("code");
  if (!code) {
    return redirectWithCleanup(request, "/login?error=line_unknown");
  }

  try {
    const env = getLineEnv();

    // 3. 認可コードを ID トークンに交換する。
    const idToken = await exchangeCodeForIdToken(code, env);
    if (!idToken) {
      return redirectWithCleanup(request, "/login?error=line_verify");
    }

    // 4. ID トークンを検証し、LINE のユーザー情報（sub / name / picture）を得る。
    const nonce = request.cookies.get("line_oauth_nonce")?.value ?? "";
    const payload = await verifyLineIdToken(idToken, nonce, env);
    if (!payload) {
      return redirectWithCleanup(request, "/login?error=line_verify");
    }

    // 5. Firebase UID を解決する（初回はユーザー作成 + マッピング保存）。
    const uid = await resolveFirebaseUid(payload);

    // 6. カスタムトークンを発行する。
    const customToken = await getAdminAuth().createCustomToken(uid);

    // 7. トークンは必ず URL フラグメント（#）で渡す。
    //    フラグメントはサーバーへ送信されないため、サーバーログやリファラに残らない。
    return redirectWithCleanup(
      request,
      `/login/line#token=${encodeURIComponent(customToken)}`
    );
  } catch (error) {
    // 8. 想定外エラー。トークン類・シークレットは絶対にログに出さない。
    console.error("LINE ログイン処理で想定外のエラーが発生しました:", error);
    return redirectWithCleanup(request, "/login?error=line_unknown");
  }
}
