// ダッシュボード（マイページ /dashboard）。
// ログイン必須のページ。未ログインなら /login へ移動させる。
// ログイン中の会員プロフィール（表示名・メール・アイコン）とログアウトボタンを表示する。
"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { signOut } from "firebase/auth";
import { auth } from "@/lib/firebase";
import { useAuth } from "@/components/auth-provider";
import { Button } from "@/components/ui/button";

export default function DashboardPage() {
  const { user, loading } = useAuth();
  const router = useRouter();

  // 認証チェックが終わって未ログインだったら、ログインページへ送る。
  useEffect(() => {
    if (!loading && !user) {
      router.replace("/login");
    }
  }, [loading, user, router]);

  // ログアウト処理。完了後はトップページへ戻す。
  async function handleLogout() {
    try {
      await signOut(auth);
      router.replace("/");
    } catch (error) {
      console.error("ログアウトに失敗しました:", error);
    }
  }

  // 読み込み中、または未ログイン（リダイレクト待ち）の間は表示を控える。
  if (loading || !user) {
    return (
      <main className="flex flex-1 items-center justify-center p-8">
        <p className="text-lg text-muted-foreground">読み込み中です…</p>
      </main>
    );
  }

  return (
    <main className="flex flex-1 flex-col items-center justify-center gap-8 p-8">
      <h1 className="text-3xl font-bold sm:text-4xl">マイページ</h1>

      {/* 会員プロフィールカード */}
      <section className="w-full max-w-md rounded-lg border border-border bg-card p-6 text-card-foreground shadow-sm">
        <div className="flex flex-col items-center gap-4 text-center">
          {/* アイコン画像。未設定の場合もあるので存在チェックする。 */}
          {user.photoURL ? (
            <Image
              src={user.photoURL}
              alt="プロフィール画像"
              width={96}
              height={96}
              className="rounded-full"
            />
          ) : (
            // 画像がない場合は名前の頭文字を表示する代替アイコン。
            <div className="flex h-24 w-24 items-center justify-center rounded-full bg-muted text-2xl font-bold text-muted-foreground">
              {(user.displayName ?? user.email ?? "?").charAt(0)}
            </div>
          )}

          <div className="space-y-1">
            <p className="text-xl font-bold">
              {user.displayName ?? "（表示名未設定）"}
            </p>
            <p className="text-base text-muted-foreground">{user.email}</p>
          </div>
        </div>
      </section>

      <Button variant="outline" size="lg" onClick={handleLogout}>
        ログアウト
      </Button>
    </main>
  );
}
