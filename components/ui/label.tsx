// shadcn/ui の Label コンポーネント（コピー＆ペースト方式で管理）。
// 本来の shadcn は @radix-ui/react-label を使うが、依存を増やさないよう
// ここではシンプルな <label> 要素で実装している。htmlFor で入力欄と紐付ける。
import * as React from "react";

import { cn } from "@/lib/utils";

function Label({ className, ...props }: React.ComponentProps<"label">) {
  return (
    <label
      data-slot="label"
      // 文字サイズは text-base(16px) を維持して読みやすくする。
      className={cn(
        "text-base font-medium leading-none select-none",
        "peer-disabled:cursor-not-allowed peer-disabled:opacity-70",
        className
      )}
      {...props}
    />
  );
}

export { Label };
