// トップページのボタン部分。
// ログイン状態によって表示を切り替えるため、クライアントコンポーネントにする。
// 未ログイン → 「ログイン」、ログイン済み → 「マイページ」へのリンクを表示する。
"use client";

import Link from "next/link";
import { useAuth } from "@/components/auth-provider";
import { Button } from "@/components/ui/button";

export function HomeCta() {
  const { user, loading } = useAuth();

  // 認証状態の確認中は、レイアウトがガタつかないよう同じ大きさのプレースホルダを出す。
  if (loading) {
    return (
      <Button size="lg" disabled>
        読み込み中…
      </Button>
    );
  }

  // ログイン済みならマイページへ、未ログインならログインページへ誘導する。
  return user ? (
    <Button size="lg" asChild>
      <Link href="/dashboard">マイページ（ダッシュボード）</Link>
    </Button>
  ) : (
    <Button size="lg" asChild>
      <Link href="/login">ログイン</Link>
    </Button>
  );
}
