// 卒業生名簿ページ（/directory）。
// ログイン必須。本人が「名簿に公開する」を選んだ会員だけを、
// 卒業年次ごとにまとめて表示する。連絡先メールは一切取得・表示しない。
//
// データはサーバー側（Admin SDK 経由の /api/directory）から取得する。
// クライアントから Firestore を直接読まないことで、メールなどの
// 非公開情報をブラウザに出さない（セキュリティ方針: 案A）。
"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

import { useAuth } from "@/components/auth-provider";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import type { DirectoryData } from "@/types";

export default function DirectoryPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();

  // 取得した名簿データ。
  const [data, setData] = useState<DirectoryData | null>(null);
  // 名簿の読み込み中かどうか。
  const [loadingData, setLoadingData] = useState(true);
  // 取得に失敗したときのメッセージ。
  const [error, setError] = useState<string | null>(null);

  // --- 認証チェック：未ログインならログインページへ送る ---
  useEffect(() => {
    if (!authLoading && !user) {
      router.replace("/login");
    }
  }, [authLoading, user, router]);

  // 名簿データを取得する。ID トークンを Authorization ヘッダに載せて送る。
  const fetchDirectory = useCallback(async () => {
    if (!user) return;
    setLoadingData(true);
    setError(null);
    try {
      // ログイン中ユーザーの ID トークンを取得し、サーバーで本人確認に使う。
      const token = await user.getIdToken();
      const res = await fetch("/api/directory", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) {
        const body = (await res.json().catch(() => null)) as
          | { error?: string }
          | null;
        throw new Error(body?.error ?? "名簿の取得に失敗しました。");
      }
      const json = (await res.json()) as DirectoryData;
      setData(json);
    } catch (err) {
      console.error("名簿の取得に失敗しました:", err);
      setError(
        err instanceof Error
          ? err.message
          : "名簿の取得に失敗しました。時間をおいてお試しください。"
      );
    } finally {
      setLoadingData(false);
    }
  }, [user]);

  // ログインが確定したら名簿を読み込む。
  useEffect(() => {
    if (!user) return;
    void fetchDirectory();
  }, [user, fetchDirectory]);

  // 認証確認中・データ読み込み中はシンプルな読み込み表示を出す。
  if (authLoading || (user && loadingData)) {
    return (
      <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-10">
        <p className="text-lg text-muted-foreground">読み込み中です…</p>
      </main>
    );
  }

  // 未ログイン時は上の useEffect でリダイレクトされるため、ここでは何も表示しない。
  if (!user) return null;

  return (
    <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-10 sm:py-14">
      <div className="flex flex-col gap-8">
        {/* 見出しと説明 */}
        <section className="flex flex-col gap-3">
          <h1 className="text-3xl font-bold sm:text-4xl">卒業生名簿</h1>
          <p className="text-lg leading-relaxed text-muted-foreground">
            名簿への掲載に同意された会員の皆さまを、卒業年次ごとに掲載しています。
            連絡先メールアドレスは掲載していません。
          </p>
          <p className="text-base leading-relaxed text-muted-foreground">
            ご自身の掲載・非掲載は{" "}
            <Link href="/profile/edit" className="font-semibold underline">
              プロフィールの編集
            </Link>{" "}
            からいつでも変更できます。
          </p>
        </section>

        {/* 取得失敗時のメッセージと再試行ボタン */}
        {error && (
          <Card className="border-destructive/40">
            <CardContent className="flex flex-col items-start gap-3 py-6">
              <p role="alert" className="text-base text-destructive">
                {error}
              </p>
              <Button variant="outline" onClick={() => void fetchDirectory()}>
                再読み込み
              </Button>
            </CardContent>
          </Card>
        )}

        {/* 名簿本体 */}
        {data && !error && (
          <>
            <p className="text-base text-muted-foreground">
              現在の掲載人数：
              <span className="font-bold text-foreground">
                {data.totalCount.toLocaleString("ja-JP")}
              </span>{" "}
              名
            </p>

            {/* 公開会員が0人のとき */}
            {data.groups.length === 0 ? (
              <Card>
                <CardContent className="py-10 text-center">
                  <p className="text-lg text-muted-foreground">
                    まだ公開されている方がいません。
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className="flex flex-col gap-6">
                {data.groups.map((group) => (
                  <Card
                    key={group.graduationYear ?? "unknown"}
                    aria-labelledby={`group-${group.graduationYear ?? "unknown"}`}
                  >
                    <CardHeader>
                      <CardTitle
                        id={`group-${group.graduationYear ?? "unknown"}`}
                        className="text-2xl"
                      >
                        {group.graduationYear !== null
                          ? `${group.graduationYear}年 卒業`
                          : "卒業年 未設定"}
                      </CardTitle>
                      <CardDescription>{group.members.length} 名</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <ul className="flex flex-col divide-y">
                        {group.members.map((m) => (
                          <li
                            key={m.uid}
                            className="flex flex-col gap-1 py-4 first:pt-0"
                          >
                            <p className="text-lg font-semibold">
                              {m.displayName || "（氏名未設定）"}
                              {m.maidenName && (
                                <span className="ml-2 text-base font-normal text-muted-foreground">
                                  （旧姓：{m.maidenName}）
                                </span>
                              )}
                            </p>
                            {m.furigana && (
                              <p className="text-base text-muted-foreground">
                                {m.furigana}
                              </p>
                            )}
                            {m.clubActivity && (
                              <p className="text-base">部活動・クラス：{m.clubActivity}</p>
                            )}
                          </li>
                        ))}
                      </ul>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </>
        )}

        {/* マイページへ戻る導線 */}
        <div>
          <Button asChild variant="outline">
            <Link href="/dashboard">マイページに戻る</Link>
          </Button>
        </div>
      </div>
    </main>
  );
}
