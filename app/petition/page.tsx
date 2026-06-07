// 署名ページ（/petition）。サーバーコンポーネント。
// 趣旨説明・署名フォーム・署名状況（総数＋公開可の賛同者一覧）を表示する。
//
// 署名状況はサーバー側（Admin SDK）で取得する。クライアントから Firestore を
// 直接読まないことで、email などの個人情報を一切ブラウザに出さない。
import Link from "next/link";
import type { Metadata } from "next";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { getPetitionSummary } from "@/lib/petition";
import type { PetitionSummary } from "@/types";
import { PetitionForm } from "./petition-form";

export const metadata: Metadata = {
  title: "校舎の耐震化を求める署名 | 加茂暁星高等学校 同窓会",
  description:
    "加茂暁星高等学校の校舎の耐震化を求める署名活動のページです。どなたでもご署名いただけます。",
};

// このページは毎回サーバーで最新の署名状況を取得するため、動的レンダリングにする。
// （ビルド時の事前生成を行わない。Admin SDK の環境変数が必要なため）
export const dynamic = "force-dynamic";

export default async function PetitionPage() {
  // 署名状況の取得。Firestore 未接続・環境変数未設定でもページ自体は表示する。
  let summary: PetitionSummary | null = null;
  try {
    summary = await getPetitionSummary();
  } catch (err) {
    console.error("署名状況の取得に失敗しました:", err);
  }

  return (
    <main className="mx-auto w-full max-w-3xl px-4 py-10 sm:py-14">
      <div className="flex flex-col gap-10">
        {/* 趣旨説明（文面は仮。後で差し替える前提のプレースホルダー） */}
        <section className="flex flex-col gap-4">
          <h1 className="text-3xl font-bold sm:text-4xl">
            校舎の耐震化を求める署名
          </h1>
          <Card>
            <CardHeader>
              <CardTitle>署名のお願い（趣旨）</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-4 text-lg leading-relaxed">
              <p>
                ※ ここに署名の趣旨説明が入ります（後日差し替え予定）。
                加茂暁星高等学校の校舎の耐震化は、生徒・教職員の安全を守るうえで
                喫緊の課題です。私たちは、安心して学べる校舎の早期実現を求めています。
              </p>
              <p>
                この署名は、卒業生・保護者・在校生・教職員・地域の皆さまなど、
                <strong>どなたでも（会員登録なしで）</strong>ご参加いただけます。
                趣旨にご賛同いただける方は、下のフォームよりご署名をお願いいたします。
              </p>
            </CardContent>
          </Card>
        </section>

        {/* 署名状況（総数を大きく表示＋公開可の賛同者一覧） */}
        <section className="flex flex-col gap-4" aria-labelledby="petition-status">
          <h2 id="petition-status" className="text-2xl font-bold">
            現在の署名状況
          </h2>
          <Card>
            <CardContent className="flex flex-col items-center gap-2 py-8 text-center">
              <p className="text-lg text-muted-foreground">これまでに集まった署名</p>
              {summary ? (
                <p className="text-5xl font-bold sm:text-6xl">
                  {summary.totalCount.toLocaleString("ja-JP")}
                  <span className="ml-2 text-2xl font-medium">筆</span>
                </p>
              ) : (
                <p className="text-lg text-muted-foreground">
                  ただいま署名状況を取得できませんでした。
                </p>
              )}
            </CardContent>
          </Card>

          {/* 公開可（isPublic=true）の賛同者のみ。email は含まれない。 */}
          {summary && summary.publicSignatures.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>賛同者の皆さま</CardTitle>
                <CardDescription>
                  公開に同意いただいた方のお名前・立場・コメントを掲載しています。
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="flex flex-col divide-y">
                  {summary.publicSignatures.map((s, i) => (
                    <li key={i} className="flex flex-col gap-1 py-4 first:pt-0">
                      <p className="text-lg font-semibold">
                        {s.name}
                        {s.role && (
                          <span className="ml-2 text-base font-normal text-muted-foreground">
                            （{s.role}）
                          </span>
                        )}
                      </p>
                      {s.comment && (
                        <p className="whitespace-pre-wrap text-base leading-relaxed">
                          {s.comment}
                        </p>
                      )}
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          )}
        </section>

        {/* 署名フォーム */}
        <section aria-labelledby="petition-form-heading">
          <h2 id="petition-form-heading" className="sr-only">
            署名フォーム
          </h2>
          <PetitionForm />
        </section>

        {/* トップへ戻る導線 */}
        <div>
          <Button asChild variant="outline">
            <Link href="/">トップページへ戻る</Link>
          </Button>
        </div>
      </div>
    </main>
  );
}
