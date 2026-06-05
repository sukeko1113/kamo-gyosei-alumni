// shadcn/ui の Card コンポーネント。
// 「コピー＆ペースト方式」のため、このファイル自体がプロジェクトの一部として管理される。
// Card / CardHeader / CardTitle などを組み合わせてカード型 UI を作る。
import * as React from "react";

import { cn } from "@/lib/utils";

// カードの外枠。角丸・枠線・背景色をまとめて持つ。
function Card({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card"
      className={cn(
        "bg-card text-card-foreground flex flex-col gap-6 rounded-xl border py-6 shadow-sm",
        className
      )}
      {...props}
    />
  );
}

// カード上部の見出し領域。
function CardHeader({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card-header"
      className={cn("flex flex-col gap-1.5 px-6", className)}
      {...props}
    />
  );
}

// カードのタイトル。高齢の利用者向けに十分な大きさを確保する。
function CardTitle({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card-title"
      className={cn("font-semibold leading-snug", className)}
      {...props}
    />
  );
}

// タイトル下の補足テキスト（説明・日付など）。
function CardDescription({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card-description"
      className={cn("text-muted-foreground text-base", className)}
      {...props}
    />
  );
}

// カードの本文領域。
function CardContent({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div data-slot="card-content" className={cn("px-6", className)} {...props} />
  );
}

// カード下部のフッター領域（操作ボタンなどを置く）。
function CardFooter({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card-footer"
      className={cn("flex items-center px-6", className)}
      {...props}
    />
  );
}

export {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
};
