// shadcn/ui が利用する共通ユーティリティ。
// clsx で条件付きクラスをまとめ、tailwind-merge で
// 競合する Tailwind クラス（例: px-2 と px-4）を後勝ちで解決する。
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

// cn = classNames。複数のクラス指定を 1 つの文字列に整理して返す。
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
