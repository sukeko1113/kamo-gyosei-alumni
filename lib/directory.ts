// 卒業生名簿（directory）のサーバー側アクセス層（★サーバー専用★）。
// Firebase Admin SDK を使い、本人が「名簿に公開する」を選んだ会員
// （isListedInDirectory == true）だけを取得して、卒業年次ごとにまとめて返す。
//
// ★ セキュリティ方針（案A）★
// - users ドキュメントには連絡先メール（contactEmail）などの非公開情報が含まれる。
//   Firestore のルールはフィールド単位の読み取り制限ができない（ドキュメント単位）ため、
//   名簿の読み取りはここ（Admin SDK）でだけ行い、メール以外の項目だけを選んで返す。
// - さらに防御を重ねるため、クエリで .select() を使い、そもそもメール項目を
//   サーバーに転送しない（取得対象のフィールドを明示する）。
// - これにより users の read ルールは「本人のみ」のまま維持できる。
import "server-only";

import { getAdminDb } from "@/lib/firebase-admin";
import type { DirectoryData, DirectoryGroup, DirectoryMember } from "@/types";

// Firestore のコレクション名。
const COLLECTION = "users";

// 名簿に表示する会員一覧を取得し、卒業年次ごとにグループ化して返す。
// 連絡先メール（contactEmail / email）は .select() の対象に含めないため、
// 一切読み出さない・返さない。
export async function getDirectory(): Promise<DirectoryData> {
  const db = getAdminDb();

  // 公開フラグが true の会員だけを取得する。
  // .select() で必要な項目だけに絞り、メール項目は転送対象から除外する（多層防御）。
  const snap = await db
    .collection(COLLECTION)
    .where("isListedInDirectory", "==", true)
    .select("displayName", "furigana", "maidenName", "graduationYear", "clubActivity")
    .get();

  // 取得結果を、公開してよい項目だけの DirectoryMember に詰め替える。
  const members: DirectoryMember[] = snap.docs.map((doc) => {
    const data = doc.data();
    return {
      uid: doc.id,
      displayName: typeof data.displayName === "string" ? data.displayName : "",
      furigana: typeof data.furigana === "string" ? data.furigana : "",
      maidenName: typeof data.maidenName === "string" ? data.maidenName : "",
      graduationYear:
        typeof data.graduationYear === "number" ? data.graduationYear : null,
      clubActivity: typeof data.clubActivity === "string" ? data.clubActivity : "",
    };
  });

  // 卒業年次ごとにグループへ振り分ける（null は「卒業年未設定」としてまとめる）。
  const groupMap = new Map<number | null, DirectoryMember[]>();
  for (const member of members) {
    const key = member.graduationYear;
    const list = groupMap.get(key);
    if (list) {
      list.push(member);
    } else {
      groupMap.set(key, [member]);
    }
  }

  // グループを「卒業年の新しい順」に並べる。卒業年未設定（null）は最後にまとめる。
  const groups: DirectoryGroup[] = Array.from(groupMap.entries())
    .sort(([a], [b]) => {
      if (a === null) return 1; // null は後ろへ
      if (b === null) return -1;
      return b - a; // 数値は降順（新しい年が先）
    })
    .map(([graduationYear, list]) => ({
      graduationYear,
      // グループ内はふりがな順（未入力は表示名で代替）に並べる。
      members: list.sort((m1, m2) =>
        (m1.furigana || m1.displayName).localeCompare(
          m2.furigana || m2.displayName,
          "ja"
        )
      ),
    }));

  return { totalCount: members.length, groups };
}
