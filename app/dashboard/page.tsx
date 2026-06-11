// ダッシュボード（マイページ /dashboard）。
// ログイン必須のページ。未ログインなら /login へ移動させる。
// ログイン中の会員プロフィール（表示名・メール・アイコン）に加えて、
// プロフィール編集ページで入力できる追加項目も表示する。
// 「プロフィールを編集」ボタンから編集ページへ遷移できる。
"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { signOut } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { auth, db } from "@/lib/firebase";
import { useAuth } from "@/components/auth-provider";
import { AdminNavLink } from "@/components/admin-nav-link";
import { Button } from "@/components/ui/button";
import type { User } from "@/types";

export default function DashboardPage() {
  const { user, loading } = useAuth();
  const router = useRouter();

  // Firestore から読み込んだプロフィール（users ドキュメントの追加項目）。
  const [profile, setProfile] = useState<Partial<User> | null>(null);
  const [loadingDoc, setLoadingDoc] = useState(true);

  // 認証チェックが終わって未ログインだったら、ログインページへ送る。
  useEffect(() => {
    if (!loading && !user) {
      router.replace("/login");
    }
  }, [loading, user, router]);

  // 自分の users ドキュメントを読み込み、追加項目を表示できるようにする。
  useEffect(() => {
    if (!user) return;
    let active = true; // アンマウント後に state を更新しないためのフラグ。
    (async () => {
      setLoadingDoc(true);
      try {
        const snap = await getDoc(doc(db, "users", user.uid));
        if (active) setProfile(snap.exists() ? (snap.data() as Partial<User>) : {});
      } catch (error) {
        console.error("プロフィールの読み込みに失敗しました:", error);
        if (active) setProfile({});
      } finally {
        if (active) setLoadingDoc(false);
      }
    })();
    return () => {
      active = false;
    };
  }, [user]);

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
  if (loading || !user || loadingDoc) {
    return (
      <main className="flex flex-1 items-center justify-center p-8">
        <p className="text-lg text-muted-foreground">読み込み中です…</p>
      </main>
    );
  }

  // 値が空（未入力）なら「未設定」と表示するための小さなヘルパー。
  const show = (value: unknown) =>
    value === undefined || value === null || value === "" ? (
      <span className="text-muted-foreground">未設定</span>
    ) : (
      String(value)
    );

  return (
    <main className="flex flex-1 flex-col items-center gap-8 p-8">
      <h1 className="text-3xl font-bold sm:text-4xl">マイページ</h1>

      {/* 会員プロフィールカード（Google アカウント由来の基本情報） */}
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

      {/* プロフィールの追加項目。dl/dt/dd で項目名と値を対にして表示する。 */}
      <section className="w-full max-w-md">
        <h2 className="text-xl font-bold">プロフィール</h2>
        <dl className="mt-3 flex flex-col divide-y divide-border rounded-lg border border-border">
          <div className="flex flex-col gap-1 p-4 sm:flex-row sm:gap-4">
            <dt className="w-40 shrink-0 text-base font-medium">卒業年次（西暦）</dt>
            <dd className="text-base">{show(profile?.graduationYear)}</dd>
          </div>
          <div className="flex flex-col gap-1 p-4 sm:flex-row sm:gap-4">
            <dt className="w-40 shrink-0 text-base font-medium">旧姓</dt>
            <dd className="text-base">{show(profile?.maidenName)}</dd>
          </div>
          <div className="flex flex-col gap-1 p-4 sm:flex-row sm:gap-4">
            <dt className="w-40 shrink-0 text-base font-medium">ふりがな</dt>
            <dd className="text-base">{show(profile?.furigana)}</dd>
          </div>
          <div className="flex flex-col gap-1 p-4 sm:flex-row sm:gap-4">
            <dt className="w-40 shrink-0 text-base font-medium">部活動・クラス</dt>
            <dd className="text-base">{show(profile?.clubActivity)}</dd>
          </div>
          <div className="flex flex-col gap-1 p-4 sm:flex-row sm:gap-4">
            <dt className="w-40 shrink-0 text-base font-medium">連絡用メール</dt>
            <dd className="text-base">{show(profile?.contactEmail)}</dd>
          </div>
          <div className="flex flex-col gap-1 p-4 sm:flex-row sm:gap-4">
            <dt className="w-40 shrink-0 text-base font-medium">卒業生名簿への公開</dt>
            <dd className="text-base">
              {profile?.isListedInDirectory ? (
                "公開中"
              ) : (
                <span className="text-muted-foreground">非公開</span>
              )}
            </dd>
          </div>
        </dl>
      </section>

      {/* 操作ボタン。プロフィール編集ページへの導線とログアウト。 */}
      <div className="flex flex-wrap items-center justify-center gap-3">
        {/* Button を Link として使い、編集ページへ遷移する。 */}
        <Button size="lg" asChild>
          <Link href="/profile/edit">プロフィールを編集</Link>
        </Button>
        <Button variant="outline" size="lg" asChild>
          <Link href="/directory">卒業生名簿を見る</Link>
        </Button>
        {/* 管理者のときだけ「管理：署名一覧」への導線を表示する（一般会員には出さない）。 */}
        <AdminNavLink />
        <Button variant="outline" size="lg" onClick={handleLogout}>
          ログアウト
        </Button>
      </div>
    </main>
  );
}
