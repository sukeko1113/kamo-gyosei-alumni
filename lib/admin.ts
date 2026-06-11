// 管理者（運営者）かどうかを判定するためのサーバー専用ヘルパー。
//
// ★ セキュリティ方針 ★
// - 管理者のメールアドレスは環境変数 ADMIN_EMAILS にカンマ区切りで登録する。
//   （例: ADMIN_EMAILS="a@example.com,b@example.com"）
// - NEXT_PUBLIC_ は絶対に付けない。ブラウザに「誰が管理者か」を漏らさないため、
//   かつ判定そのものを必ずサーバー側だけで行うため。
// - 判定対象の email は、Firebase ID トークンを verifyIdToken で検証して得た
//   「本物の」メールアドレスを渡すこと（クライアント申告の値を信用しない）。
import "server-only";

import { getAdminAuth } from "@/lib/firebase-admin";

// 環境変数 ADMIN_EMAILS をパースし、正規化済み（小文字・前後空白除去）の
// メールアドレス配列にして返す。未設定なら空配列。
export function getAdminEmails(): string[] {
  return (process.env.ADMIN_EMAILS ?? "")
    .split(",")
    .map((email) => email.trim().toLowerCase())
    .filter((email) => email.length > 0);
}

// 渡された email が管理者リストに含まれるかを判定する。
// email が空・null・undefined の場合は管理者ではない（false）。
// 大文字小文字の違いは無視する。
export function isAdminEmail(email: string | null | undefined): boolean {
  if (!email) return false;
  return getAdminEmails().includes(email.toLowerCase());
}

// リクエストの管理者認証結果。
// ok=true のときだけ管理者として処理を続行してよい。
export type AdminAuthResult =
  | { ok: true; email: string }
  | { ok: false; status: 401 | 403; error: string };

// Route Handler から呼ぶ共通の管理者チェック。
// 1) Authorization: Bearer <Firebase ID トークン> を取り出す
// 2) verifyIdToken でトークンの真正性（改ざん・期限切れでないこと）を検証する
// 3) トークンに含まれる本物の email が ADMIN_EMAILS に含まれるか判定する
// いずれかを満たさなければ ok=false（401 または 403）を返す。
// ※ 管理者判定は必ずこのサーバー側でのみ行う。
export async function verifyAdminRequest(
  request: Request
): Promise<AdminAuthResult> {
  const authHeader = request.headers.get("authorization") ?? "";
  const match = authHeader.match(/^Bearer (.+)$/);
  if (!match) {
    return { ok: false, status: 401, error: "ログインが必要です。" };
  }

  let email: string | undefined;
  try {
    const decoded = await getAdminAuth().verifyIdToken(match[1]);
    email = decoded.email;
  } catch {
    return {
      ok: false,
      status: 401,
      error: "ログインの有効期限が切れています。再度ログインしてください。",
    };
  }

  if (!isAdminEmail(email)) {
    return {
      ok: false,
      status: 403,
      error: "この操作を行う権限がありません。",
    };
  }

  // isAdminEmail が true の時点で email は必ず文字列。
  return { ok: true, email: email as string };
}
