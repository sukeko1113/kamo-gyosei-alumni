// 「管理：署名一覧」への導線（管理者のみ表示）。
// ログイン中ユーザーが管理者かどうかをサーバー（/api/admin/check）に問い合わせ、
// 管理者のときだけリンクを描画する。一般会員・未ログインには何も表示しない。
//
// ★ これは「見た目（導線の表示/非表示）」の制御にすぎない。
//    実データの保護はあくまでサーバー側（/api/admin/petitions の 403）で行うため、
//    仮に導線が見えても非管理者は署名データを取得できない。
"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

import { useAuth } from "@/components/auth-provider";
import { Button } from "@/components/ui/button";

export function AdminNavLink() {
  const { user, loading } = useAuth();
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    // 未ログイン時は確認不要（非表示のまま）。
    if (loading || !user) {
      setIsAdmin(false);
      return;
    }
    let active = true; // アンマウント後に state を更新しないためのフラグ。
    (async () => {
      try {
        const token = await user.getIdToken();
        const res = await fetch("/api/admin/check", {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!res.ok) return;
        const json = (await res.json()) as { isAdmin?: boolean };
        if (active) setIsAdmin(json.isAdmin === true);
      } catch (error) {
        // 確認に失敗しても致命的ではない（導線を出さないだけ）。
        console.error("管理者判定の確認に失敗しました:", error);
      }
    })();
    return () => {
      active = false;
    };
  }, [user, loading]);

  // 管理者でなければ何も表示しない。
  if (!isAdmin) return null;

  return (
    <Button variant="outline" size="lg" asChild>
      <Link href="/admin/petitions">管理：署名一覧</Link>
    </Button>
  );
}
