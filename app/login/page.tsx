// ログインページ（/login）。
// 「Google でログイン」ボタンを表示する。すでにログイン済みなら /dashboard へ移動する。
// 認証はブラウザ上で行うため、クライアントコンポーネントにする。
"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { signInWithPopup } from "firebase/auth";
import { auth, googleProvider } from "@/lib/firebase";
import { useAuth } from "@/components/auth-provider";
import { Button } from "@/components/ui/button";

export default function LoginPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  // ボタン連打などでログイン処理が重複しないようにするフラグ。
  const [signingIn, setSigningIn] = useState(false);

  // すでにログイン済みなら、このページに留まらず /dashboard へ送る。
  useEffect(() => {
    if (!loading && user) {
      router.replace("/dashboard");
    }
  }, [loading, user, router]);

  // 「Google でログイン」ボタンが押されたときの処理。
  async function handleGoogleLogin() {
    setSigningIn(true);
    try {
      // ポップアップで Google のログイン画面を開く。
      await signInWithPopup(auth, googleProvider);
      // 成功すると onAuthStateChanged が反応し、上の useEffect が /dashboard へ移動させる。
    } catch (error) {
      console.error("ログインに失敗しました:", error);
      setSigningIn(false);
    }
  }

  // 認証状態の確認中、またはログイン済みでリダイレクト待ちの間は表示を控える。
  if (loading || user) {
    return (
      <main className="flex flex-1 items-center justify-center p-8">
        <p className="text-lg text-muted-foreground">読み込み中です…</p>
      </main>
    );
  }

  return (
    <main className="flex flex-1 flex-col items-center justify-center gap-8 p-8 text-center">
      <div className="space-y-3">
        <h1 className="text-3xl font-bold sm:text-4xl">ログイン</h1>
        <p className="max-w-md text-lg text-muted-foreground">
          加茂暁星高等学校 同窓会のサイトをご利用いただくには、
          Google アカウントでのログインが必要です。
        </p>
      </div>

      <Button
        size="lg"
        onClick={handleGoogleLogin}
        disabled={signingIn}
        className="w-full max-w-xs"
      >
        {signingIn ? "ログイン中…" : "Google でログイン"}
      </Button>
    </main>
  );
}
