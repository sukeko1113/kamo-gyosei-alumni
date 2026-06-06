// 寄付完了ページ（/donate/success）。
// Stripe Checkout での支払い成功後、success_url としてここへ戻ってくる。
// 感謝のメッセージと、トップ／お知らせへの導線を表示するだけの静的ページ。
import Link from "next/link";
import type { Metadata } from "next";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = {
  title: "ご寄付ありがとうございました | 加茂暁星高等学校 同窓会",
  description: "加茂暁星高等学校 同窓会へのご寄付が完了しました。",
};

export default function DonateSuccessPage() {
  return (
    <main className="mx-auto flex w-full max-w-2xl flex-1 flex-col items-center justify-center gap-8 px-4 py-16 text-center sm:px-6">
      <div className="space-y-4">
        <h1 className="text-3xl font-bold sm:text-4xl">
          ご寄付ありがとうございました
        </h1>
        <p className="text-lg text-muted-foreground">
          あたたかいご支援に心より感謝申し上げます。
          いただいた寄付は、加茂暁星高等学校 同窓会の活動に
          大切に活用させていただきます。
        </p>
      </div>

      {/* トップ／お知らせへ戻る導線 */}
      <div className="flex flex-col gap-3 sm:flex-row">
        <Button size="lg" asChild>
          <Link href="/">トップへ戻る</Link>
        </Button>
        <Button size="lg" variant="outline" asChild>
          <Link href="/news">お知らせを見る</Link>
        </Button>
      </div>
    </main>
  );
}
