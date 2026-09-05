// ヘッダー右端のログイン／マイページボタン。
// ログイン状態によって表示を切り替えるため、この部分だけ
// クライアントコンポーネントに切り出す（ヘッダー本体はサーバーのまま）。
"use client";

import Link from "next/link";
import { useAuth } from "@/components/auth-provider";

// ボタンの共通スタイル（既存の「ログイン」ボタンと同じ見た目）。
const BUTTON_CLASS =
  "ml-2 flex min-h-[44px] items-center rounded-sm bg-ai px-6 text-base font-medium text-kinari no-underline transition-colors hover:bg-ai-dark hover:text-kinari";

export function HeaderAuthLink() {
  const { user, loading } = useAuth();

  // 認証状態の確認中は、レイアウトのがたつき（ちらつき）を防ぐため
  // 同じ大きさの透明なプレースホルダを表示しておく。
  if (loading) {
    return (
      <span aria-hidden className={`${BUTTON_CLASS} select-none opacity-0`}>
        ログイン
      </span>
    );
  }

  // ログイン中は「マイページ」、未ログインは「ログイン」を表示する。
  return user ? (
    <Link href="/dashboard" className={BUTTON_CLASS}>
      マイページ
    </Link>
  ) : (
    <Link href="/login" className={BUTTON_CLASS}>
      ログイン
    </Link>
  );
}
