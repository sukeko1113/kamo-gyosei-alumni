// 署名一覧を返す Route Handler（GET /api/admin/petitions）★運営者専用★。
//
// 設計方針:
// - 署名データには email など個人情報が含まれる。クライアントから Firestore を
//   直接読まない既存方針を維持し、取得はこのサーバー側（Admin SDK）でだけ行う。
// - ログイン必須。さらに「管理者であること」を必ずサーバー側で確認する。
//   Authorization: Bearer <Firebase ID トークン> を verifyIdToken で検証し、
//   その email が環境変数 ADMIN_EMAILS に含まれる場合のみ全署名を返す。
// - 未ログインは 401、ログイン済みでも管理者でなければ 403 とし、データは一切返さない。
import { NextResponse } from "next/server";

import { verifyAdminRequest } from "@/lib/admin";
import { getAllSignatures } from "@/lib/petition";

// 毎回サーバーで最新の署名一覧を取得するため、動的レンダリングにする。
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  // 1) 管理者認証（Bearer トークンの検証 + ADMIN_EMAILS による判定）。
  const auth = await verifyAdminRequest(request);
  if (!auth.ok) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  // 2) 管理者と確認できたときだけ、全署名（email を含む全項目）を返す。
  try {
    const data = await getAllSignatures();
    return NextResponse.json(data);
  } catch (err) {
    // サービスアカウント未設定などの想定外エラー。詳細はサーバーログにのみ残す。
    console.error("署名一覧の取得に失敗しました:", err);
    return NextResponse.json(
      { error: "サーバー側でエラーが発生しました。時間をおいてお試しください。" },
      { status: 500 }
    );
  }
}
