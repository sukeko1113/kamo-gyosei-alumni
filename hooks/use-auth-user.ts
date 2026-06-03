// ログイン中のユーザーを取得するためのカスタムフック。
// ダッシュボードやプロフィール編集ページなど、ログインが必要な
// クライアントコンポーネントで使い回す。
"use client";

import { useEffect, useState } from "react";
// Firebase Auth のモジュラー API（v10 系）から必要な型・関数を読み込む。
import { onAuthStateChanged, type User as FirebaseUser } from "firebase/auth";

import { auth } from "@/lib/firebase";

// 戻り値の型。
// - user: ログイン中なら Firebase の User、未ログインなら null
// - loading: 認証状態を確認している間は true（初期表示のちらつき防止に使う）
type AuthState = {
  user: FirebaseUser | null;
  loading: boolean;
};

export function useAuthUser(): AuthState {
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // onAuthStateChanged はログイン状態が変わるたびに呼ばれる。
    // 戻り値は購読解除関数なので、アンマウント時に呼んで後始末する。
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  return { user, loading };
}
