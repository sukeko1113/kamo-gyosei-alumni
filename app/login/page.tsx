// ログインページ（/login）。
// 「Google でログイン」「LINE でログイン」ボタンを表示する。
// すでにログイン済みなら /dashboard へ移動する。
// 認証はブラウザ上で行うため、クライアントコンポーネントにする。
"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { signInWithPopup } from "firebase/auth";
import { auth, googleProvider } from "@/lib/firebase";
import { useAuth } from "@/components/auth-provider";
import { Button } from "@/components/ui/button";

// LINE ログインのエラーコード（クエリ ?error=...）に対応する日本語メッセージ。
const LINE_ERROR_MESSAGES: Record<string, string> = {
  line_cancelled: "LINE ログインがキャンセルされました。",
  line_state:
    "LINE ログインの確認に失敗しました。お手数ですが、もう一度お試しください。",
  line_verify:
    "LINE アカウントの確認に失敗しました。お手数ですが、もう一度お試しください。",
  line_unknown:
    "LINE ログインでエラーが発生しました。時間をおいて、もう一度お試しください。",
};

// クエリ ?error=... を読み取ってエラーメッセージを表示する部分。
// useSearchParams はビルド時の事前レンダリングで Suspense 境界が必要なため、
// この部分だけ小さなコンポーネントに切り出している。
function LoginErrorMessage() {
  const searchParams = useSearchParams();
  const errorCode = searchParams.get("error");
  const message = errorCode ? LINE_ERROR_MESSAGES[errorCode] : undefined;

  if (!message) return null;

  return (
    <p
      role="alert"
      className="w-full max-w-md rounded-md border border-destructive/50 bg-destructive/10 p-4 text-base text-destructive"
    >
      {message}
    </p>
  );
}

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
          Google アカウントまたは LINE でのログインが必要です。
        </p>
      </div>

      {/* LINE ログイン失敗時のエラーメッセージ（?error=... がある時だけ表示）。 */}
      <Suspense fallback={null}>
        <LoginErrorMessage />
      </Suspense>

      <div className="flex w-full max-w-xs flex-col gap-4">
        <Button
          size="lg"
          onClick={handleGoogleLogin}
          disabled={signingIn}
          className="w-full"
        >
          {signingIn ? "ログイン中…" : "Google でログイン"}
        </Button>

        {/* LINE でログイン。認可コードフローをサーバーで処理するため、
            fetch ではなく <a> によるフルページ遷移にする。
            見た目は LINE のログインボタンガイドラインに準拠（背景 #06C755・白文字・角丸）。 */}
        <Button
          size="lg"
          asChild
          className="w-full bg-[#06C755] text-white hover:bg-[#06C755]/90"
        >
          <a href="/api/auth/line/start">LINE でログイン</a>
        </Button>

        {/* ログイン方法の混在による「別会員としての二重登録」を防ぐための注意書き。 */}
        <p className="text-base text-muted-foreground">
          一度使ったログイン方法で続けてください。別の方法でログインすると、
          別の会員として登録されます。
        </p>
      </div>
    </main>
  );
}
