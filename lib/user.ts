// 会員（users コレクション）に関する Firestore 操作をまとめたファイル。
// AuthProvider から呼び出され、ログイン中ユーザーのドキュメントを用意する。
import { doc, getDoc, setDoc, serverTimestamp } from "firebase/firestore";
import type { User as FirebaseUser } from "firebase/auth";
import { db } from "@/lib/firebase";

// 初回ログイン時に、Firestore の users コレクションへユーザー情報を作成する。
// ドキュメントID は uid。すでに存在する場合は createdAt を上書きしないよう、
// 何もしない（プロフィール編集などで上書きしてしまう事故を防ぐ）。
export async function ensureUserDocument(firebaseUser: FirebaseUser): Promise<void> {
  // uid をドキュメントID にした参照を作る。
  const userRef = doc(db, "users", firebaseUser.uid);

  // すでにドキュメントがあるか確認する。
  const snapshot = await getDoc(userRef);
  if (snapshot.exists()) {
    // 既存ユーザーなら何もしない（createdAt を守る）。
    return;
  }

  // 新規ユーザーなので、Google ログインから取得した情報で作成する。
  await setDoc(userRef, {
    uid: firebaseUser.uid,
    email: firebaseUser.email,
    displayName: firebaseUser.displayName,
    photoURL: firebaseUser.photoURL,
    role: "member", // 初期権限は一般会員
    createdAt: serverTimestamp(), // サーバー側の時刻で登録日時を記録
  });
}
