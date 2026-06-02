// ESLint の設定ファイル（Next.js 15 標準のフラットコンフィグ形式）。
// Next.js が用意した推奨ルール（next/core-web-vitals, next/typescript）を読み込む。
import { dirname } from "path";
import { fileURLToPath } from "url";
import { FlatCompat } from "@eslint/eslintrc";

// このファイル自身の場所を基準ディレクトリにする。
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// FlatCompat は、従来形式（extends）の共有設定を新しいフラット形式に橋渡しするための道具。
const compat = new FlatCompat({
  baseDirectory: __dirname,
});

const eslintConfig = [
  // Next.js 推奨ルールを適用する。
  ...compat.extends("next/core-web-vitals", "next/typescript"),
  {
    // 自動生成物などチェック対象外にしたいファイル・フォルダ。
    ignores: [".next/**", "out/**", "build/**", "next-env.d.ts"],
  },
];

export default eslintConfig;
