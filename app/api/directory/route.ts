// 卒業生名簿を返す Route Handler（GET /api/directory）。
//
// 設計方針（案A）:
// - 名簿の読み取りはこのサーバー側だけで行う（Admin SDK 経由）。
//   これにより、users ドキュメント内の連絡先メールなど非公開情報を
//   ブラウザに出さずに「メール以外の項目だけ」を返せる。
// - ログイン必須。クライアントから送られた Firebase ID トークンを検証し、
//   本当にログイン済みの会員だけに名簿データを返す。
// - さらに閲覧条件として「閲覧者自身がプロフィール登録済みであること」を
//   サーバー側で検証する（相互登録が前提）。ただし管理者は登録の有無に
//   関わらず常に閲覧できる。判定は必ずサーバー側で行い、クライアント側
//   だけの制御にはしない。
import { NextResponse } from "next/server";

import { getAdminAuth } from "@/lib/firebase-admin";
import { getDirectory, isUserRegistered } from "@/lib/directory";
import { isAdminEmail } from "@/lib/admin";

// 毎回サーバーで最新の名簿を取得するため、動的レンダリングにする。
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  // 1) 認証チェック：Authorization: Bearer <Firebase ID トークン> を検証する。
  const authHeader = request.headers.get("authorization") ?? "";
  const match = authHeader.match(/^Bearer (.+)$/);
  if (!match) {
    return NextResponse.json(
      { error: "卒業生名簿の閲覧にはログインが必要です。" },
      { status: 401 }
    );
  }

  let uid: string;
  let email: string | undefined;
  try {
    // ID トークンが本物（改ざんされていない・期限内）か検証し、uid と email を得る。
    const decoded = await getAdminAuth().verifyIdToken(match[1]);
    uid = decoded.uid;
    email = decoded.email;
  } catch {
    // 無効・期限切れのトークンはログインが必要な扱いにする。
    return NextResponse.json(
      { error: "ログインの有効期限が切れています。再度ログインしてください。" },
      { status: 401 }
    );
  }

  // 2) 閲覧権限チェック（サーバー側）。
  //    管理者は常に閲覧可。それ以外は「プロフィール登録済み」であることを条件にする。
  //    未登録の会員には 403 と機械可読な code を返し、クライアントで登録導線を出す。
  try {
    if (!isAdminEmail(email) && !(await isUserRegistered(uid))) {
      return NextResponse.json(
        {
          code: "PROFILE_REQUIRED",
          error: "卒業生名簿の閲覧にはプロフィールの登録が必要です。",
        },
        { status: 403 }
      );
    }
  } catch (err) {
    // 登録判定中の想定外エラー。詳細はサーバーログにのみ残す。
    console.error("閲覧権限の確認に失敗しました:", err);
    return NextResponse.json(
      { error: "サーバー側でエラーが発生しました。時間をおいてお試しください。" },
      { status: 500 }
    );
  }

  // 3) 名簿データ（公開フラグ true の会員のメール以外の項目）を取得して返す。
  try {
    const directory = await getDirectory();
    return NextResponse.json(directory);
  } catch (err) {
    // サービスアカウント未設定などの想定外エラー。詳細はサーバーログにのみ残す。
    console.error("卒業生名簿の取得に失敗しました:", err);
    return NextResponse.json(
      { error: "サーバー側でエラーが発生しました。時間をおいてお試しください。" },
      { status: 500 }
    );
  }
}
