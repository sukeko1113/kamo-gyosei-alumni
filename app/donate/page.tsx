// 寄付ページ（/donate）。
// 金額を選ぶ／入力して「寄付する」を押すと、サーバー（/api/donate）で
// Stripe Checkout セッションを作り、返ってきた決済ページ URL へ遷移する。
// 金額の選択・送信状態の管理が必要なのでクライアントコンポーネントにする。
"use client";

import { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

// 金額のプリセット（円）。よく選ばれそうな額をボタンで用意する。
const PRESET_AMOUNTS = [1000, 3000, 5000, 10000];

// サーバー側のバリデーションと揃えた金額の範囲（円）。
const MIN_AMOUNT = 100;
const MAX_AMOUNT = 1_000_000;

export default function DonatePage() {
  // 選択中の金額（プリセット）。自由入力時は null にする。
  const [selectedPreset, setSelectedPreset] = useState<number | null>(3000);
  // 自由入力欄の文字列（空文字を許容したいので string で保持）。
  const [customAmount, setCustomAmount] = useState("");
  // 送信中フラグ（ボタンの二重押下を防ぐ）。
  const [submitting, setSubmitting] = useState(false);
  // ユーザー向けのエラーメッセージ。
  const [errorMessage, setErrorMessage] = useState("");

  // 実際に寄付する金額を決める。自由入力が優先、無ければ選択中のプリセット。
  const amount = customAmount !== "" ? Number(customAmount) : selectedPreset;

  // プリセットボタンを押したとき。自由入力はクリアする。
  function handleSelectPreset(value: number) {
    setSelectedPreset(value);
    setCustomAmount("");
    setErrorMessage("");
  }

  // 自由入力欄が変わったとき。プリセットの選択は解除する。
  function handleCustomChange(value: string) {
    setCustomAmount(value);
    setSelectedPreset(null);
    setErrorMessage("");
  }

  // 「寄付する」ボタンの処理。フォーム送信ではなく onClick で行う。
  async function handleDonate() {
    // クライアント側でも一次チェック（最終的な検証はサーバーが行う）。
    if (amount === null || !Number.isInteger(amount) || amount < MIN_AMOUNT || amount > MAX_AMOUNT) {
      setErrorMessage(
        `寄付金額は ${MIN_AMOUNT.toLocaleString()}円〜${MAX_AMOUNT.toLocaleString()}円の範囲の整数で指定してください。`
      );
      return;
    }

    setSubmitting(true);
    setErrorMessage("");

    try {
      // サーバーに金額を送り、Checkout セッションの URL を受け取る。
      const res = await fetch("/api/donate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amount }),
      });

      const data = await res.json();

      if (!res.ok || !data.url) {
        // サーバーからのエラーメッセージがあれば表示する。
        throw new Error(data.error ?? "決済ページの作成に失敗しました。");
      }

      // Stripe の決済ページへ遷移する。
      window.location.href = data.url;
      // 遷移するまでボタンは disabled のままにしておく（finally で戻さない）。
    } catch (error) {
      console.error("寄付処理でエラーが発生しました:", error);
      setErrorMessage(
        error instanceof Error
          ? error.message
          : "通信に失敗しました。時間をおいて再度お試しください。"
      );
      setSubmitting(false);
    }
  }

  return (
    <main className="mx-auto w-full max-w-2xl flex-1 px-4 py-10 sm:px-6">
      <h1 className="mb-3 text-3xl font-bold sm:text-4xl">ご寄付のお願い</h1>
      <p className="mb-8 text-lg text-muted-foreground">
        加茂暁星高等学校 同窓会の活動を支えるため、皆さまのあたたかいご支援を
        お願いいたします。寄付は一回きりのお支払いです。
      </p>

      <Card>
        <CardHeader>
          <CardTitle className="text-2xl">寄付金額を選ぶ</CardTitle>
          <CardDescription className="text-base">
            ボタンで金額を選ぶか、ご希望の金額を直接ご入力ください。
          </CardDescription>
        </CardHeader>

        <CardContent className="flex flex-col gap-6">
          {/* プリセット金額のボタン群 */}
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {PRESET_AMOUNTS.map((value) => {
              const active = selectedPreset === value;
              return (
                <Button
                  key={value}
                  type="button"
                  variant={active ? "default" : "outline"}
                  size="lg"
                  aria-pressed={active}
                  onClick={() => handleSelectPreset(value)}
                  disabled={submitting}
                >
                  {value.toLocaleString()}円
                </Button>
              );
            })}
          </div>

          {/* 自由入力欄 */}
          <div className="flex flex-col gap-2">
            <Label htmlFor="custom-amount" className="text-base">
              金額を直接入力（円）
            </Label>
            <Input
              id="custom-amount"
              type="number"
              inputMode="numeric"
              min={MIN_AMOUNT}
              max={MAX_AMOUNT}
              step={1}
              placeholder="例: 2000"
              value={customAmount}
              onChange={(e) => handleCustomChange(e.target.value)}
              disabled={submitting}
            />
            <p className="text-base text-muted-foreground">
              {MIN_AMOUNT.toLocaleString()}円〜{MAX_AMOUNT.toLocaleString()}円の範囲でご指定ください。
            </p>
          </div>

          {/* エラーメッセージ（ある場合のみ表示） */}
          {errorMessage && (
            <p role="alert" className="text-base font-medium text-destructive">
              {errorMessage}
            </p>
          )}

          {/* 寄付するボタン。送信中は二重送信を防ぐため disabled にする。 */}
          <Button
            type="button"
            size="lg"
            onClick={handleDonate}
            disabled={submitting}
            className="w-full"
          >
            {submitting
              ? "決済ページへ移動中…"
              : amount && amount >= MIN_AMOUNT && amount <= MAX_AMOUNT
                ? `${amount.toLocaleString()}円を寄付する`
                : "寄付する"}
          </Button>

          <p className="text-base text-muted-foreground">
            お支払いは Stripe の安全な決済ページで行われます。
            カード情報が当サイトに保存されることはありません。
          </p>
        </CardContent>
      </Card>

      {/* トップへ戻る導線 */}
      <div className="mt-8">
        <Link
          href="/"
          className="inline-flex items-center gap-1 text-lg font-medium text-primary underline-offset-4 hover:underline"
        >
          <span aria-hidden="true">←</span>
          トップへ戻る
        </Link>
      </div>
    </main>
  );
}
