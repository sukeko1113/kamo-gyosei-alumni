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

import { FieldPath } from "firebase-admin/firestore";

import { getAdminDb } from "@/lib/firebase-admin";
import { DEPARTMENTS } from "@/types";
import type {
  Department,
  DirectoryData,
  DirectoryGroup,
  DirectoryMember,
} from "@/types";

// Firestore のコレクション名。
const COLLECTION = "users";

// 閲覧者が「プロフィール登録済み」かどうかをサーバー側で判定する（★サーバー専用★）。
//
// ★ 判定基準 ★
// - users/{uid} はログイン時に ensureUserDocument() で自動生成されるため、
//   「ドキュメントの有無」では「ログインしただけ」と「プロフィール登録済み」を
//   区別できない（ログインした全員が doc を持つ）。
// - updatedAt は /profile/edit での保存時にしか書き込まれない（自動生成では付かない）。
//   そのため updatedAt の有無が「プロフィール登録を一度でも行ったか」を正確に表す。
// - メール等の非公開情報を読み出さないよう .select("updatedAt") で対象を絞る（多層防御）。
export async function isUserRegistered(uid: string): Promise<boolean> {
  const db = getAdminDb();

  // ドキュメントID 一致 + updatedAt のみ取得するクエリ（他フィールドは転送しない）。
  const snap = await db
    .collection(COLLECTION)
    .where(FieldPath.documentId(), "==", uid)
    .select("updatedAt")
    .limit(1)
    .get();

  if (snap.empty) return false; // doc 自体が無い（通常はログインで作られる）。
  // updatedAt が存在すれば、プロフィールを一度でも保存した＝登録済みとみなす。
  return snap.docs[0].get("updatedAt") != null;
}

// 名簿に表示する会員一覧を取得し、卒業年次ごとにグループ化して返す。
// 連絡先メール（contactEmail / email）は .select() の対象に含めないため、
// 一切読み出さない・返さない。
export async function getDirectory(): Promise<DirectoryData> {
  const db = getAdminDb();

  // 公開フラグが true の会員だけを取得する。
  // .select() で必要な項目だけに絞り、メール項目は転送対象から除外する（多層防御）。
  // ※ 生年月日は保存していないため、そもそも取得対象に存在しない。
  const snap = await db
    .collection(COLLECTION)
    .where("isListedInDirectory", "==", true)
    .select(
      "lastName",
      "firstName",
      "lastNameKana",
      "firstNameKana",
      "maidenName",
      "department",
      "graduationYear",
      "clubActivity"
    )
    .get();

  // 取得結果を、公開してよい項目だけの DirectoryMember に詰め替える。
  const members: DirectoryMember[] = snap.docs.map((doc) => {
    const data = doc.data();
    // department は 4 択のいずれかのときだけ採用し、それ以外は null にする。
    const department =
      typeof data.department === "string" &&
      (DEPARTMENTS as readonly string[]).includes(data.department)
        ? (data.department as Department)
        : null;
    return {
      uid: doc.id,
      lastName: typeof data.lastName === "string" ? data.lastName : "",
      firstName: typeof data.firstName === "string" ? data.firstName : "",
      lastNameKana:
        typeof data.lastNameKana === "string" ? data.lastNameKana : "",
      firstNameKana:
        typeof data.firstNameKana === "string" ? data.firstNameKana : "",
      maidenName: typeof data.maidenName === "string" ? data.maidenName : "",
      department,
      graduationYear:
        typeof data.graduationYear === "number" ? data.graduationYear : null,
      clubActivity:
        typeof data.clubActivity === "string" ? data.clubActivity : "",
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
      // グループ内は五十音順（姓のふりがな → 名のふりがな）に並べる。
      // ふりがなが未入力の場合は手入力の姓・名で代替する。
      members: list.sort((m1, m2) => {
        const byLast = (m1.lastNameKana || m1.lastName).localeCompare(
          m2.lastNameKana || m2.lastName,
          "ja"
        );
        if (byLast !== 0) return byLast;
        return (m1.firstNameKana || m1.firstName).localeCompare(
          m2.firstNameKana || m2.firstName,
          "ja"
        );
      }),
    }));

  return { totalCount: members.length, groups };
}
