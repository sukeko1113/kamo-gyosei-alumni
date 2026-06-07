// shadcn/ui が利用する共通ユーティリティ。
// clsx で条件付きクラスをまとめ、tailwind-merge で
// 競合する Tailwind クラス（例: px-2 と px-4）を後勝ちで解決する。
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

// cn = classNames。複数のクラス指定を 1 つの文字列に整理して返す。
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// 日付（ISO 文字列）を日本語の読みやすい形式に整える（例: 2026年6月3日）。
// 値が無い・不正な場合は空文字を返すため、任意項目（publishedDate 等）を
// そのまま渡しても表示が崩れない。
// 日付がずれないよう、表示の基準は日本時間（Asia/Tokyo）に固定する。
export function formatJaDate(isoDate?: string): string {
  if (!isoDate) return "";
  const date = new Date(isoDate);
  if (Number.isNaN(date.getTime())) return ""; // 不正な日付なら空文字。
  return new Intl.DateTimeFormat("ja-JP", {
    year: "numeric",
    month: "long",
    day: "numeric",
    timeZone: "Asia/Tokyo",
  }).format(date);
}
