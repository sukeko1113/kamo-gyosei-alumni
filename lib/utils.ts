// shadcn/ui が利用する共通ユーティリティ。
// clsx で条件付きクラスをまとめ、tailwind-merge で
// 競合する Tailwind クラス（例: px-2 と px-4）を後勝ちで解決する。
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

// cn = classNames。複数のクラス指定を 1 つの文字列に整理して返す。
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// ISO 形式の日時文字列（例: microCMS の publishedAt）を
// 日本語表記（例: 2026年6月5日）に整形して返す。
// 日付がずれないよう、表示の基準は日本時間（Asia/Tokyo）に固定する。
export function formatDateJa(dateString: string): string {
  return new Date(dateString).toLocaleDateString("ja-JP", {
    year: "numeric",
    month: "long",
    day: "numeric",
    timeZone: "Asia/Tokyo",
  });
}
