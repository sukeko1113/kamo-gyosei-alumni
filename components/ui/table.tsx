// shadcn/ui の Table コンポーネント。
// 「コピー＆ペースト方式」のため、このファイル自体がプロジェクトの一部として管理される。
// Table / TableHeader / TableBody / TableRow / TableHead / TableCell を組み合わせて表を作る。
// 横スクロール用のラッパーを内蔵しているため、狭い画面でも表が崩れない。
import * as React from "react";

import { cn } from "@/lib/utils";

// 表全体。横幅が足りないときは親要素内で横スクロールできるようにする。
function Table({ className, ...props }: React.ComponentProps<"table">) {
  return (
    <div data-slot="table-container" className="relative w-full overflow-x-auto">
      <table
        data-slot="table"
        className={cn("w-full caption-bottom text-base", className)}
        {...props}
      />
    </div>
  );
}

// 表のヘッダー部（見出し行をまとめる）。
function TableHeader({ className, ...props }: React.ComponentProps<"thead">) {
  return (
    <thead
      data-slot="table-header"
      className={cn("[&_tr]:border-b", className)}
      {...props}
    />
  );
}

// 表の本体（データ行をまとめる）。
function TableBody({ className, ...props }: React.ComponentProps<"tbody">) {
  return (
    <tbody
      data-slot="table-body"
      className={cn("[&_tr:last-child]:border-0", className)}
      {...props}
    />
  );
}

// 1行分。ホバー時に薄く背景色を付けて見やすくする。
function TableRow({ className, ...props }: React.ComponentProps<"tr">) {
  return (
    <tr
      data-slot="table-row"
      className={cn(
        "hover:bg-muted/50 border-b transition-colors",
        className
      )}
      {...props}
    />
  );
}

// 見出しセル（th）。高齢の利用者向けに十分な大きさ・余白を確保する。
function TableHead({ className, ...props }: React.ComponentProps<"th">) {
  return (
    <th
      data-slot="table-head"
      className={cn(
        "text-muted-foreground h-12 px-4 text-left align-middle font-semibold whitespace-nowrap",
        className
      )}
      {...props}
    />
  );
}

// データセル（td）。
function TableCell({ className, ...props }: React.ComponentProps<"td">) {
  return (
    <td
      data-slot="table-cell"
      className={cn("p-4 align-top", className)}
      {...props}
    />
  );
}

// 表の説明（キャプション）。
function TableCaption({
  className,
  ...props
}: React.ComponentProps<"caption">) {
  return (
    <caption
      data-slot="table-caption"
      className={cn("text-muted-foreground mt-4 text-base", className)}
      {...props}
    />
  );
}

export {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
  TableCaption,
};
