// 会員（users コレクション）に関する Firestore 操作をまとめたファイル。
// AuthProvider から呼び出され、ログイン中ユーザーのドキュメントを用意する。
import { doc, getDoc, setDoc, serverTimestamp } from "firebase/firestore";
import type { User as FirebaseUser } from "firebase/auth";
import { db } from "@/lib/firebase";
import type { AuthProviderId } from "@/types";

// ログイン中ユーザーの認証方法を判定する。
// LINE ログイン（カスタムトークン）では providerData が空配列になるため、
// 空なら 'line'、それ以外（Google ログイン）は 'google' とみなす。
function detectAuthProvider(firebaseUser: FirebaseUser): AuthProviderId {
  return firebaseUser.providerData.length === 0 ? "line" : "google";
}

// 初回ログイン時に、Firestore の users コレクションへユーザー情報を作成する。
// ドキュメントID は uid。すでに存在する場合は createdAt などを上書きしないよう、
// 不足しているフィールド（authProviders）だけを merge で補う。
// ※ LINE の初回ログインではサーバー側（コールバック）が先にドキュメントを
//   作成している。ここで丸ごと上書きして消さないことが重要。
export async function ensureUserDocument(firebaseUser: FirebaseUser): Promise<void> {
  // uid をドキュメントID にした参照を作る。
  const userRef = doc(db, "users", firebaseUser.uid);

  // すでにドキュメントがあるか確認する。
  const snapshot = await getDoc(userRef);
  if (snapshot.exists()) {
    // 既存ユーザーの場合、authProviders が未保存（旧データ）なら merge で補う。
    // 既存値があれば上書きしない。updatedAt は絶対に書かない
    //（「プロフィール登録済み」の判定に使われているため）。
    if (snapshot.get("authProviders") === undefined) {
      await setDoc(
        userRef,
        { authProviders: [detectAuthProvider(firebaseUser)] },
        { merge: true }
      );
    }
    return;
  }

  // 新規ユーザーなので、ログインから取得した情報で作成する。
  // （LINE ログインの場合は email が null になる）
  await setDoc(userRef, {
    uid: firebaseUser.uid,
    email: firebaseUser.email,
    displayName: firebaseUser.displayName,
    photoURL: firebaseUser.photoURL,
    role: "member", // 初期権限は一般会員
    authProviders: [detectAuthProvider(firebaseUser)],
    createdAt: serverTimestamp(), // サーバー側の時刻で登録日時を記録
  });
}
