// ログイン中ユーザーが管理者かどうかだけを返す軽量な Route Handler
//（GET /api/admin/check）。
//
// 用途: ナビゲーション等で「管理：署名一覧」への導線を出すかどうかの判定。
// ★ これはあくまで「見た目（導線の表示/非表示）」のための確認であり、
//    実データの保護は /api/admin/petitions 側のサーバー判定で担保している。
//    （導線が見えても、非管理者は署名 API で 403 によって弾かれる）
// 署名データそのものは一切返さない（isAdmin の真偽値のみ）。
import { NextResponse } from "next/server";

import { verifyAdminRequest } from "@/lib/admin";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  // verifyAdminRequest はトークン検証 + ADMIN_EMAILS 判定をまとめて行う。
  // ここでは結果の真偽だけを使い、署名データには触れない。
  const auth = await verifyAdminRequest(request);
  return NextResponse.json({ isAdmin: auth.ok });
}
