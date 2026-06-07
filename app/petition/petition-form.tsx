// 署名フォーム（クライアントコンポーネント）。
// 要件により <form> タグは使わず、送信ボタンの onClick で処理する。
"use client";

import * as React from "react";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { PETITION_ROLES, type PetitionInput } from "@/types";
import {
  validatePetitionInput,
  type PetitionValidationErrors,
} from "@/lib/petition-validation";

// 立場セレクトの「未選択」を表す内部値。
// Radix Select は value="" を扱えないため、内部的にこの値で「未選択」を表現する。
const NO_ROLE = "__none__";

export function PetitionForm() {
  const router = useRouter();
  const [name, setName] = React.useState("");
  const [email, setEmail] = React.useState("");
  const [role, setRole] = React.useState<string>(NO_ROLE);
  const [comment, setComment] = React.useState("");
  const [isPublic, setIsPublic] = React.useState(false);

  const [errors, setErrors] = React.useState<PetitionValidationErrors>({});
  const [submitting, setSubmitting] = React.useState(false);
  const [serverError, setServerError] = React.useState<string | null>(null);
  const [done, setDone] = React.useState(false);

  // 現在の入力値を PetitionInput の形にまとめる。
  function buildInput(): PetitionInput {
    return {
      name: name.trim(),
      email: email.trim().toLowerCase(),
      role: role === NO_ROLE ? "" : (role as PetitionInput["role"]),
      comment: comment.trim(),
      isPublic,
    };
  }

  async function handleSubmit() {
    setServerError(null);

    // クライアント側の軽いチェック（必須・形式）。サーバーでも必ず再検証される。
    const input = buildInput();
    const clientErrors = validatePetitionInput(input);
    setErrors(clientErrors);
    if (Object.keys(clientErrors).length > 0) return;

    setSubmitting(true); // 二重送信防止＋ローディング表示
    try {
      const res = await fetch("/api/petition", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(input),
      });

      if (res.ok) {
        setDone(true);
        // サーバーコンポーネント（署名状況: 総数・公開賛同者一覧）を再取得・再描画する。
        // done などのクライアント状態は保持されるため、完了表示を出しつつ
        // 同一ページ上部の署名状況だけが最新化される（手動リロード不要）。
        router.refresh();
        return;
      }

      // サーバー側バリデーションエラー（フィールド単位）を反映する。
      const data = (await res.json().catch(() => null)) as
        | { error?: string; fields?: PetitionValidationErrors }
        | null;
      if (data?.fields) setErrors(data.fields);
      setServerError(
        data?.error ?? "送信に失敗しました。時間をおいてお試しください。"
      );
    } catch {
      setServerError(
        "通信に失敗しました。インターネット接続をご確認のうえ、再度お試しください。"
      );
    } finally {
      setSubmitting(false);
    }
  }

  // 送信完了の表示。
  if (done) {
    return (
      <Card className="border-green-600/40 bg-green-50">
        <CardHeader>
          <CardTitle className="text-2xl">ご署名ありがとうございました</CardTitle>
          <CardDescription className="text-base text-foreground">
            校舎の耐震化を求める活動に賛同いただき、心より感謝申し上げます。
            いただいたお気持ちを大切に、活動を進めてまいります。
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-2xl">署名フォーム</CardTitle>
        <CardDescription>
          下記をご入力のうえ、「署名する」ボタンを押してください。
          <span className="text-destructive">*</span> は必須項目です。
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-6">
        {/* 氏名（必須） */}
        <div className="flex flex-col gap-2">
          <Label htmlFor="petition-name">
            お名前 <span className="text-destructive">*</span>
          </Label>
          <Input
            id="petition-name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="加茂 太郎"
            autoComplete="name"
            disabled={submitting}
            aria-invalid={!!errors.name}
            aria-describedby={errors.name ? "petition-name-error" : undefined}
          />
          {errors.name && (
            <p id="petition-name-error" className="text-base text-destructive">
              {errors.name}
            </p>
          )}
        </div>

        {/* メールアドレス（必須・非公開） */}
        <div className="flex flex-col gap-2">
          <Label htmlFor="petition-email">
            メールアドレス <span className="text-destructive">*</span>
          </Label>
          <Input
            id="petition-email"
            type="email"
            inputMode="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="example@example.com"
            autoComplete="email"
            disabled={submitting}
            aria-invalid={!!errors.email}
            aria-describedby="petition-email-help petition-email-error"
          />
          <p id="petition-email-help" className="text-base text-muted-foreground">
            本人確認・ご連絡のために使用します。<strong>公開されません。</strong>
          </p>
          {errors.email && (
            <p id="petition-email-error" className="text-base text-destructive">
              {errors.email}
            </p>
          )}
        </div>

        {/* 立場（任意） */}
        <div className="flex flex-col gap-2">
          <Label htmlFor="petition-role">立場（任意）</Label>
          <Select
            value={role}
            onValueChange={setRole}
            disabled={submitting}
          >
            <SelectTrigger id="petition-role">
              <SelectValue placeholder="選択してください" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={NO_ROLE}>選択しない</SelectItem>
              {PETITION_ROLES.map((r) => (
                <SelectItem key={r} value={r}>
                  {r}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* 賛同コメント（任意） */}
        <div className="flex flex-col gap-2">
          <Label htmlFor="petition-comment">賛同コメント（任意）</Label>
          <Textarea
            id="petition-comment"
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder="校舎の耐震化を願う思いなど、ご自由にお書きください。"
            rows={4}
            disabled={submitting}
          />
        </div>

        {/* 公開可否（デフォルト off） */}
        <div className="flex items-start gap-3 rounded-md border border-input p-4">
          <Checkbox
            id="petition-public"
            checked={isPublic}
            onCheckedChange={(v) => setIsPublic(v === true)}
            disabled={submitting}
            className="mt-0.5"
          />
          <Label
            htmlFor="petition-public"
            className="cursor-pointer font-normal leading-relaxed"
          >
            氏名とコメントを賛同者一覧に公開してもよい
            <span className="block text-base text-muted-foreground">
              ※ チェックしない場合、お名前・コメントは公開されず、署名総数にのみ反映されます。
            </span>
          </Label>
        </div>

        {/* プライバシーの注記 */}
        <p className="text-base leading-relaxed text-muted-foreground">
          ご入力いただいた情報は、校舎の耐震化を求める署名活動の目的にのみ利用します。
          メールアドレスが第三者に公開されることはありません。
        </p>

        {/* サーバーエラー表示 */}
        {serverError && (
          <p
            role="alert"
            className="rounded-md bg-destructive/10 p-3 text-base text-destructive"
          >
            {serverError}
          </p>
        )}

        {/* 送信ボタン（<form> は使わず onClick で処理） */}
        <Button
          type="button"
          size="lg"
          onClick={handleSubmit}
          disabled={submitting}
          aria-busy={submitting}
        >
          {submitting ? "送信中..." : "署名する"}
        </Button>
      </CardContent>
    </Card>
  );
}
