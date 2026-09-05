// LINE ログインの仕上げページ（/login/line）。
// サーバー（コールバック）から URL フラグメント（#token=...）で受け取った
// カスタムトークンを使い、ブラウザ側で Firebase Auth にサインインする。
// window.location を扱うためクライアントコンポーネントにする。
"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { signInWithCustomToken } from "firebase/auth";
import { auth } from "@/lib/firebase";

export default function LineLoginPage() {
  const router = useRouter();
  const [failed, setFailed] = useState(false);
  // React 18 の StrictMode 等で useEffect が2回走っても、
  // サインイン処理を1回しか実行しないようにするためのフラグ。
  const started = useRef(false);

  useEffect(() => {
    if (started.current) return;
    started.current = true;

    // URL フラグメント（#token=...）からカスタムトークンを取り出す。
    const hash = window.location.hash.startsWith("#")
      ? window.location.hash.slice(1)
      : window.location.hash;
    const token = new URLSearchParams(hash).get("token");

    // トークンが履歴やアドレスバーに残らないよう、先に URL から消しておく。
    window.history.replaceState(null, "", window.location.pathname);

    if (!token) {
      setFailed(true);
      return;
    }

    (async () => {
      try {
        // カスタムトークンで Firebase Auth にサインインする。
        await signInWithCustomToken(auth, token);
        // 成功したら、Google ログイン成功時と同じマイページへ移動する。
        router.replace("/dashboard");
      } catch (error) {
        console.error("LINE ログインに失敗しました:", error);
        setFailed(true);
      }
    })();
  }, [router]);

  if (failed) {
    return (
      <main className="flex flex-1 flex-col items-center justify-center gap-6 p-8 text-center">
        <p className="text-lg font-medium">
          LINE ログインに失敗しました。お手数ですが、もう一度お試しください。
        </p>
        <Link href="/login" className="text-base text-primary underline underline-offset-4">
          ログインページへ戻る
        </Link>
      </main>
    );
  }

  return (
    <main className="flex flex-1 items-center justify-center p-8">
      <p className="text-lg text-muted-foreground">LINE でログインしています…</p>
    </main>
  );
}
