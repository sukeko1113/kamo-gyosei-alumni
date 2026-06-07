// 署名を受け付ける Route Handler（POST /api/petition）。
//
// 設計方針:
// - 署名の書き込みはこのサーバー側だけで行う（Admin SDK 経由）。
//   こうすることで「同一 email の重複チェック」をサーバーで確実に実施でき、
//   かつクライアントに email を含む全ドキュメントを読ませずに済む。
// - クライアントから届いた値は一切信用せず、ここで再度バリデーションする。
import { NextResponse } from "next/server";

import {
  normalizePetitionInput,
  validatePetitionInput,
} from "@/lib/petition-validation";
import { createSignature } from "@/lib/petition";

export async function POST(request: Request) {
  // 1) JSON の読み取り（壊れた本文は 400）。
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: "リクエストの形式が正しくありません。" },
      { status: 400 }
    );
  }

  // 2) サーバー側でも値を正規化＆再検証する。
  const input = normalizePetitionInput(body);
  const errors = validatePetitionInput(input);
  if (Object.keys(errors).length > 0) {
    return NextResponse.json(
      { error: "入力内容を確認してください。", fields: errors },
      { status: 400 }
    );
  }

  // 3) 重複チェックのうえ作成する。
  try {
    const result = await createSignature(input);
    if (!result.ok && result.reason === "duplicate") {
      return NextResponse.json(
        { error: "このメールアドレスでは既にご署名いただいています。" },
        { status: 409 }
      );
    }
    return NextResponse.json({ ok: true }, { status: 201 });
  } catch (err) {
    // サービスアカウント未設定などの想定外エラー。詳細はサーバーログにのみ残す。
    console.error("署名の保存に失敗しました:", err);
    return NextResponse.json(
      { error: "サーバー側でエラーが発生しました。時間をおいてお試しください。" },
      { status: 500 }
    );
  }
}
