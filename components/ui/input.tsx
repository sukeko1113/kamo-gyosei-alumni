// shadcn/ui の Input コンポーネント（コピー＆ペースト方式で管理）。
// テキストや数値を入力する 1 行の入力欄。
import * as React from "react";

import { cn } from "@/lib/utils";

// React.ComponentProps<"input"> により、通常の <input> と同じ属性をそのまま渡せる。
function Input({ className, type, ...props }: React.ComponentProps<"input">) {
  return (
    <input
      type={type}
      data-slot="input"
      // 高齢の利用者向けに文字サイズは text-base(16px) を維持し、十分な高さ(h-11)を確保する。
      className={cn(
        "flex h-11 w-full rounded-md border border-input bg-background px-3 py-2 text-base shadow-sm transition-colors",
        "placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
        "disabled:cursor-not-allowed disabled:opacity-50",
        className
      )}
      {...props}
    />
  );
}

export { Input };
