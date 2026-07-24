// 署名（嘆願）データのサーバー側アクセス層（★サーバー専用★）。
// Firebase Admin SDK を使い、email など個人情報をクライアントに出さずに
// 「総数」「公開可の署名」だけを安全に取得する。新規署名の作成もここで行う。
import "server-only";

import { FieldValue, Timestamp, type Firestore } from "firebase-admin/firestore";

import { getAdminDb } from "@/lib/firebase-admin";
import type {
  PetitionAdminList,
  PetitionAdminRow,
  PetitionInput,
  PetitionPublicSignature,
  PetitionSummary,
} from "@/types";

// Firestore のコレクション名。
const COLLECTION = "petitions";

// 署名作成の結果。重複時は created=false で返す。
export type CreateSignatureResult =
  | { ok: true }
  | { ok: false; reason: "duplicate" };

// 署名状況（総数 + 公開可の賛同者一覧）を取得する。
// email は一切読み出さず、公開対象（isPublic=true）の name / role / comment だけを返す。
export async function getPetitionSummary(): Promise<PetitionSummary> {
  const db = getAdminDb();
  const col = db.collection(COLLECTION);

  // 署名総数は count() 集計で取得（全ドキュメントを読まずに件数だけ取れる）。
  const countSnap = await col.count().get();
  const totalCount = countSnap.data().count;

  // 公開可の署名だけを新着順で取得し、公開してよい項目のみ詰め替える。
  const publicSnap = await col
    .where("isPublic", "==", true)
    .orderBy("createdAt", "desc")
    .get();

  const publicSignatures: PetitionPublicSignature[] = publicSnap.docs.map(
    (doc) => {
      const data = doc.data();
      return {
        name: typeof data.name === "string" ? data.name : "",
        role: data.role ?? "",
        comment: typeof data.comment === "string" ? data.comment : "",
      };
    }
  );

  return { totalCount, publicSignatures };
}

// 全署名を取得する（★運営者専用★）。
// email を含む全項目を返すため、呼び出し側で「管理者であること」を
// verifyIdToken + ADMIN_EMAILS で確認した後でのみ使うこと。
// 並び順は署名日時の新しい順。
export async function getAllSignatures(): Promise<PetitionAdminList> {
  const db = getAdminDb();

  // createdAt の降順（新しい順）で全件取得する。
  const snap = await db
    .collection(COLLECTION)
    .orderBy("createdAt", "desc")
    .get();

  const signatures: PetitionAdminRow[] = snap.docs.map((doc) => {
    const data = doc.data();

    // createdAt は Firestore の Timestamp。そのままでは JSON 化できないため、
    // ISO 文字列に変換する（まだ確定していない場合は null）。
    const createdAt =
      data.createdAt instanceof Timestamp
        ? data.createdAt.toDate().toISOString()
        : null;

    return {
      id: doc.id,
      name: typeof data.name === "string" ? data.name : "",
      email: typeof data.email === "string" ? data.email : "",
      role: data.role ?? "",
      comment: typeof data.comment === "string" ? data.comment : "",
      isPublic: data.isPublic === true,
      createdAt,
    };
  });

  return { totalCount: signatures.length, signatures };
}

// 同じメールアドレスでの署名が既に存在するか確認する。
async function emailAlreadyExists(
  db: Firestore,
  email: string
): Promise<boolean> {
  const snap = await db
    .collection(COLLECTION)
    .where("email", "==", email)
    .limit(1)
    .get();
  return !snap.empty;
}

// 新しい署名を作成する。検証済み・正規化済みの入力を受け取る前提。
// 同一 email が既にあれば作成せず duplicate を返す（重複署名の防止）。
export async function createSignature(
  input: PetitionInput
): Promise<CreateSignatureResult> {
  const db = getAdminDb();

  if (await emailAlreadyExists(db, input.email)) {
    return { ok: false, reason: "duplicate" };
  }

  await db.collection(COLLECTION).add({
    name: input.name,
    email: input.email,
    role: input.role,
    comment: input.comment,
    isPublic: input.isPublic,
    // サーバータイムスタンプで作成日時を記録する。
    createdAt: FieldValue.serverTimestamp(),
  });

  return { ok: true };
}
