// ログイン状態をアプリ全体で共有するための AuthProvider。
// React Context を使い、「現在のユーザー」と「読み込み中かどうか」をどの
// コンポーネントからでも useAuth() で取り出せるようにする。
// 認証状態の監視はブラウザでしか行えないため、クライアントコンポーネントにする。
"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import { onAuthStateChanged, type User as FirebaseUser } from "firebase/auth";
import { auth } from "@/lib/firebase";
import { ensureUserDocument } from "@/lib/user";

// Context が提供する値の型。
type AuthContextValue = {
  user: FirebaseUser | null; // ログイン中のユーザー（未ログインなら null）
  loading: boolean; // 認証状態を確認中かどうか（初期チェック中は true）
};

// Context の本体。初期値は「未ログイン・読み込み中」。
const AuthContext = createContext<AuthContextValue>({
  user: null,
  loading: true,
});

// アプリ全体をこの Provider で包むことで、配下のどこからでもログイン状態を参照できる。
export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // onAuthStateChanged はログイン・ログアウトのたびに呼ばれる。
    // 戻り値の関数を呼ぶと監視を解除できる（アンマウント時に実行する）。
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        // 初回ログイン時は Firestore にユーザー情報を作成する。
        // 失敗してもログイン自体は成立させたいので、エラーは握りつぶさず記録だけする。
        try {
          await ensureUserDocument(firebaseUser);
        } catch (error) {
          console.error("ユーザー情報の作成に失敗しました:", error);
        }
      }
      setUser(firebaseUser);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading }}>
      {children}
    </AuthContext.Provider>
  );
}

// ログイン状態を取り出すためのカスタムフック。
// 例: const { user, loading } = useAuth();
export function useAuth() {
  return useContext(AuthContext);
}
