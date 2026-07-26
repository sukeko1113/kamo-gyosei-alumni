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

// ふりがなを「全角カタカナ」に正規化する（保存前に使用）。
// - ひらがな・カタカナのどちらで入力されてもカタカナに揃える。
// - 半角カナ（例: ﾔﾏﾀﾞ）は NFKC 正規化で全角カタカナ（ヤマダ）に変換する。
// - 五十音順の並び替えを安定させるため、保存時にこの形へ統一する。
export function toKatakana(input: string): string {
  // 1) NFKC で半角カナ→全角カナ、濁点の合成なども整える。
  const normalized = input.normalize("NFKC");
  // 2) ひらがな（U+3041〜U+3096）をカタカナ（+0x60）へ変換する。長音符・記号はそのまま。
  return normalized.replace(/[ぁ-ゖ]/g, (ch) =>
    String.fromCharCode(ch.charCodeAt(0) + 0x60)
  );
}

// カタカナを「ひらがな」に変換する（名簿での読み表示に使用）。
// カタカナ（U+30A1〜U+30F6）をひらがな（-0x60）へ。長音符（ー）や空白はそのまま。
export function toHiragana(input: string): string {
  return input.replace(/[ァ-ヶ]/g, (ch) =>
    String.fromCharCode(ch.charCodeAt(0) - 0x60)
  );
}

// 生年（西暦）と生月から、標準進学を前提に高校卒業年（西暦・3月卒業の年）を推定する。
// - 早生まれ（1〜3月）: 生年 + 18（例: 2000年2月 → 2018）
// - 遅生まれ（4月以降）: 生年 + 19（例: 2000年5月 → 2019）
// あくまで「候補」であり、浪人・留年・編入などの例外は本人が修正する前提。
// ※ この計算に使う生年月は保存しない（呼び出し側でも Firestore に残さないこと）。
export function estimateGraduationYear(
  birthYear: number,
  birthMonth: number
): number {
  return birthMonth <= 3 ? birthYear + 18 : birthYear + 19;
}
