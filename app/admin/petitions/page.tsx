// 署名の管理画面（/admin/petitions）★運営者専用★。
//
// 設計方針:
// - ログイン必須。未ログインは /login へ送る。
// - 署名一覧はサーバー側（Admin SDK 経由の /api/admin/petitions）からのみ取得する。
//   クライアントから Firestore を直接読まない既存方針を維持する。
// - 管理者かどうかの最終判定はサーバー側で行う。非管理者がこのページを開いても、
//   API が 403 を返すため署名データは一切表示されない（「権限がありません」を表示）。
// - 表示中の一覧は CSV（UTF-8 BOM 付き）でダウンロードできる。
"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

import { useAuth } from "@/components/auth-provider";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { PetitionAdminList, PetitionAdminRow } from "@/types";

// ISO 文字列の日時を、日本語の読みやすい表記に整える。null は「—」。
function formatDateTime(iso: string | null): string {
  if (!iso) return "—";
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleString("ja-JP", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

// 立場（未選択は空文字）を表示用の文言にする。
function formatRole(role: string): string {
  return role || "未選択";
}

// 公開可否を表示用の文言にする。
function formatPublic(isPublic: boolean): string {
  return isPublic ? "公開可" : "非公開";
}

// CSV の1セルを安全にエスケープする。
// ダブルクォート・カンマ・改行を含む場合は全体をダブルクォートで囲み、
// 内部のダブルクォートは2つに増やす（RFC 4180 準拠）。
function escapeCsvCell(value: string): string {
  if (/[",\r\n]/.test(value)) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

// 署名一覧を CSV 文字列（ヘッダー行付き）に組み立てる。
function buildCsv(signatures: PetitionAdminRow[]): string {
  const header = [
    "署名日時",
    "氏名",
    "メールアドレス",
    "立場",
    "コメント",
    "公開可否",
  ];
  const rows = signatures.map((s) => [
    formatDateTime(s.createdAt),
    s.name,
    s.email,
    formatRole(s.role),
    s.comment,
    formatPublic(s.isPublic),
  ]);
  return [header, ...rows]
    .map((cols) => cols.map((c) => escapeCsvCell(c)).join(","))
    .join("\r\n");
}

export default function AdminPetitionsPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();

  // 取得した署名一覧。
  const [data, setData] = useState<PetitionAdminList | null>(null);
  // 一覧の読み込み中かどうか。
  const [loadingData, setLoadingData] = useState(true);
  // 権限がない（403）かどうか。true のときは署名データを見せない。
  const [forbidden, setForbidden] = useState(false);
  // その他の取得失敗メッセージ。
  const [error, setError] = useState<string | null>(null);

  // --- 認証チェック：未ログインならログインページへ送る ---
  useEffect(() => {
    if (!authLoading && !user) {
      router.replace("/login");
    }
  }, [authLoading, user, router]);

  // 署名一覧を取得する。ID トークンを Authorization ヘッダに載せて送る。
  const fetchPetitions = useCallback(async () => {
    if (!user) return;
    setLoadingData(true);
    setForbidden(false);
    setError(null);
    try {
      // ログイン中ユーザーの ID トークンを取得し、サーバーで管理者判定に使う。
      const token = await user.getIdToken();
      const res = await fetch("/api/admin/petitions", {
        headers: { Authorization: `Bearer ${token}` },
      });

      // 403 は「ログイン済みだが管理者でない」。データは見せない。
      if (res.status === 403) {
        setForbidden(true);
        setData(null);
        return;
      }
      if (!res.ok) {
        const body = (await res.json().catch(() => null)) as
          | { error?: string }
          | null;
        throw new Error(body?.error ?? "署名一覧の取得に失敗しました。");
      }
      const json = (await res.json()) as PetitionAdminList;
      setData(json);
    } catch (err) {
      console.error("署名一覧の取得に失敗しました:", err);
      setError(
        err instanceof Error
          ? err.message
          : "署名一覧の取得に失敗しました。時間をおいてお試しください。"
      );
    } finally {
      setLoadingData(false);
    }
  }, [user]);

  // ログインが確定したら一覧を読み込む。
  useEffect(() => {
    if (!user) return;
    void fetchPetitions();
  }, [user, fetchPetitions]);

  // 表示中の署名一覧を CSV（Excel で開ける UTF-8 BOM 付き）でダウンロードする。
  function handleDownloadCsv() {
    if (!data) return;
    // 先頭に BOM (﻿) を付けると、Excel が UTF-8 と認識して文字化けしない。
    const csv = "﻿" + buildCsv(data.signatures);
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);

    // ファイル名に当日の日付を入れて区別しやすくする。
    const today = new Date().toISOString().slice(0, 10);
    const a = document.createElement("a");
    a.href = url;
    a.download = `petitions-${today}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  // 認証確認中・データ読み込み中はシンプルな読み込み表示を出す。
  if (authLoading || (user && loadingData)) {
    return (
      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-10">
        <p className="text-lg text-muted-foreground">読み込み中です…</p>
      </main>
    );
  }

  // 未ログイン時は上の useEffect でリダイレクトされるため、ここでは何も表示しない。
  if (!user) return null;

  return (
    <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-10 sm:py-14">
      <div className="flex flex-col gap-8">
        {/* 見出し */}
        <section className="flex flex-col gap-3">
          <h1 className="text-3xl font-bold sm:text-4xl">署名一覧（管理）</h1>
          <p className="text-lg leading-relaxed text-muted-foreground">
            集まった署名の一覧です。メールアドレスなどの個人情報を含むため、
            取り扱いには十分ご注意ください。
          </p>
        </section>

        {/* 権限がない場合（403）。署名データは一切表示しない。 */}
        {forbidden && (
          <div className="rounded-lg border border-destructive/40 bg-card p-6">
            <p role="alert" className="text-lg font-semibold text-destructive">
              権限がありません
            </p>
            <p className="mt-2 text-base text-muted-foreground">
              このページは運営者専用です。閲覧の権限が必要な場合は、
              サイト管理者にお問い合わせください。
            </p>
          </div>
        )}

        {/* 取得失敗時のメッセージと再試行ボタン（権限エラー以外） */}
        {error && !forbidden && (
          <div className="rounded-lg border border-destructive/40 bg-card p-6">
            <p role="alert" className="text-base text-destructive">
              {error}
            </p>
            <Button
              variant="outline"
              className="mt-3"
              onClick={() => void fetchPetitions()}
            >
              再読み込み
            </Button>
          </div>
        )}

        {/* 署名一覧本体（管理者のみ） */}
        {data && !forbidden && !error && (
          <>
            {/* 総数表示と CSV ダウンロード */}
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-base text-muted-foreground">
                署名の総数：
                <span className="text-xl font-bold text-foreground">
                  {data.totalCount.toLocaleString("ja-JP")}
                </span>{" "}
                件
              </p>
              <Button
                size="lg"
                onClick={handleDownloadCsv}
                disabled={data.signatures.length === 0}
              >
                CSV でダウンロード
              </Button>
            </div>

            {/* 署名が0件のとき */}
            {data.signatures.length === 0 ? (
              <div className="rounded-lg border bg-card p-10 text-center">
                <p className="text-lg text-muted-foreground">
                  まだ署名はありません。
                </p>
              </div>
            ) : (
              <div className="rounded-lg border bg-card">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="whitespace-nowrap">署名日時</TableHead>
                      <TableHead>氏名</TableHead>
                      <TableHead>メールアドレス</TableHead>
                      <TableHead className="whitespace-nowrap">立場</TableHead>
                      <TableHead>コメント</TableHead>
                      <TableHead className="whitespace-nowrap">公開可否</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {data.signatures.map((s) => (
                      <TableRow key={s.id}>
                        <TableCell className="whitespace-nowrap">
                          {formatDateTime(s.createdAt)}
                        </TableCell>
                        <TableCell className="font-medium">{s.name}</TableCell>
                        <TableCell className="break-all">{s.email}</TableCell>
                        <TableCell className="whitespace-nowrap">
                          {s.role ? (
                            formatRole(s.role)
                          ) : (
                            <span className="text-muted-foreground">未選択</span>
                          )}
                        </TableCell>
                        <TableCell className="max-w-xs whitespace-pre-wrap">
                          {s.comment || (
                            <span className="text-muted-foreground">—</span>
                          )}
                        </TableCell>
                        <TableCell className="whitespace-nowrap">
                          {s.isPublic ? (
                            "公開可"
                          ) : (
                            <span className="text-muted-foreground">非公開</span>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
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
