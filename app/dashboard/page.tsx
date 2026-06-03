// 会員ダッシュボード（/dashboard）。
// ログイン中の会員に、自分のプロフィール情報を表示する。
// プロフィールの追加項目も表示し、「プロフィールを編集」ボタンから編集ページへ遷移できる。
"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { doc, getDoc } from "firebase/firestore";

import { db } from "@/lib/firebase";
import { useAuthUser } from "@/hooks/use-auth-user";
import { Button } from "@/components/ui/button";
import type { User } from "@/types";

export default function DashboardPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuthUser();

  // Firestore から読み込んだプロフィール（users ドキュメントの中身）。
  const [profile, setProfile] = useState<Partial<User> | null>(null);
  const [loadingDoc, setLoadingDoc] = useState(true);

  // 未ログインならトップページへ戻す。
  useEffect(() => {
    if (!authLoading && !user) {
      router.replace("/");
    }
  }, [authLoading, user, router]);

  // 自分の users ドキュメントを読み込む。
  useEffect(() => {
    if (!user) return;
    let active = true;
    (async () => {
      setLoadingDoc(true);
      try {
        const snap = await getDoc(doc(db, "users", user.uid));
        if (active) setProfile(snap.exists() ? (snap.data() as Partial<User>) : {});
      } catch (err) {
        console.error("プロフィールの読み込みに失敗しました", err);
        if (active) setProfile({});
      } finally {
        if (active) setLoadingDoc(false);
      }
    })();
    return () => {
      active = false;
    };
  }, [user]);

  // 認証確認中・読み込み中はシンプルな表示にする。
  if (authLoading || (user && loadingDoc)) {
    return (
      <main className="mx-auto w-full max-w-2xl flex-1 p-6">
        <p className="text-base text-muted-foreground">読み込み中です…</p>
      </main>
    );
  }

  if (!user) return null; // 未ログインはリダイレクト済み。

  // 値が空（未入力）なら「未設定」と表示するための小さなヘルパー。
  const show = (value: unknown) =>
    value === undefined || value === null || value === "" ? (
      <span className="text-muted-foreground">未設定</span>
    ) : (
      String(value)
    );

  return (
    <main className="mx-auto w-full max-w-2xl flex-1 p-6">
      <h1 className="text-2xl font-bold">マイページ</h1>

      {/* プロフィール情報の一覧。dl/dt/dd で項目名と値を対にして表示する。 */}
      <dl className="mt-6 flex flex-col divide-y divide-border rounded-md border border-border">
        {/* Google アカウント由来の基本情報 */}
        <div className="flex flex-col gap-1 p-4 sm:flex-row sm:gap-4">
          <dt className="w-48 shrink-0 text-base font-medium">お名前</dt>
          <dd className="text-base">{show(user.displayName)}</dd>
        </div>
        <div className="flex flex-col gap-1 p-4 sm:flex-row sm:gap-4">
          <dt className="w-48 shrink-0 text-base font-medium">メールアドレス</dt>
          <dd className="text-base">{show(user.email)}</dd>
        </div>

        {/* プロフィール編集ページで入力できる追加項目 */}
        <div className="flex flex-col gap-1 p-4 sm:flex-row sm:gap-4">
          <dt className="w-48 shrink-0 text-base font-medium">卒業年次（西暦）</dt>
          <dd className="text-base">{show(profile?.graduationYear)}</dd>
        </div>
        <div className="flex flex-col gap-1 p-4 sm:flex-row sm:gap-4">
          <dt className="w-48 shrink-0 text-base font-medium">旧姓</dt>
          <dd className="text-base">{show(profile?.maidenName)}</dd>
        </div>
        <div className="flex flex-col gap-1 p-4 sm:flex-row sm:gap-4">
          <dt className="w-48 shrink-0 text-base font-medium">ふりがな</dt>
          <dd className="text-base">{show(profile?.furigana)}</dd>
        </div>
        <div className="flex flex-col gap-1 p-4 sm:flex-row sm:gap-4">
          <dt className="w-48 shrink-0 text-base font-medium">部活動・クラス</dt>
          <dd className="text-base">{show(profile?.clubActivity)}</dd>
        </div>
        <div className="flex flex-col gap-1 p-4 sm:flex-row sm:gap-4">
          <dt className="w-48 shrink-0 text-base font-medium">連絡用メール</dt>
          <dd className="text-base">{show(profile?.contactEmail)}</dd>
        </div>
      </dl>

      {/* プロフィール編集ページへの導線。Button を Link として使う。 */}
      <div className="mt-6">
        <Button size="lg" asChild>
          <Link href="/profile/edit">プロフィールを編集</Link>
        </Button>
      </div>
    </main>
  );
}
