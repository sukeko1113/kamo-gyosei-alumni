# CLAUDE.md

このファイルは、Claude Code（および開発者）がこのリポジトリで作業する際の
ガイドラインです。

## プロジェクト概要

加茂暁星高等学校 同窓会の公式ウェブサイト。卒業生向けに、ログイン・会員プロフィール、
お知らせ／イベント記事の閲覧、寄付の受付、署名活動、卒業生名簿などの機能を提供する。

利用者には高齢の方が多いため、**読みやすさ・操作のしやすさ（アクセシビリティ）を
最優先**する。

## 技術スタック

| 分類 | 採用技術 |
| --- | --- |
| フレームワーク | Next.js 15（App Router, TypeScript） |
| スタイリング | Tailwind CSS v4 + shadcn/ui |
| 認証 | Firebase Authentication（Google ログイン） |
| データベース | Cloud Firestore |
| 記事管理（CMS） | microCMS（サーバーサイドの API のみ使用、エンドポイントは `blogs`） |
| 決済 | Stripe（フェーズ2以降で実装） |
| ホスティング | Vercel |

## ディレクトリ構成

```
app/                Next.js App Router のページ・レイアウト
components/ui/      shadcn/ui のコンポーネント（コピー＆ペースト方式で管理）
lib/firebase.ts     Firebase（認証・Firestore）の初期化
lib/microcms.ts     microCMS クライアント（★サーバー専用★）
lib/utils.ts        共通ユーティリティ（cn 関数など）
types/index.ts      アプリ共通の型定義（User, Blog など）
```

## コーディング規約

- **言語**: コードコメントは日本語で簡潔に。初心者でも追えるよう「何をしているか」を残す。
- **TypeScript**: `strict` 有効。`any` は避け、`types/index.ts` の型を活用する。
- **import エイリアス**: ルートからのパスは `@/` を使う（例: `@/lib/firebase`）。
- **コンポーネント**: 既定はサーバーコンポーネント。状態やイベントが必要な場合のみ
  先頭に `"use client"` を付けてクライアントコンポーネントにする。
- **UI**: 新しい UI 部品は基本 shadcn/ui を使う。フォントサイズは **最小 16px**
  （`text-base` 以上）を守る。
- **Firebase**: **v10 以降のモジュラー構文のみ**使用する
  （`import { getAuth } from "firebase/auth"` の形式。`firebase.auth()` のような
  名前空間 API は使わない）。

## 重要な注意点（セキュリティ）

- **microCMS の API キーには絶対に `NEXT_PUBLIC_` を付けない。**
  `lib/microcms.ts` は `import "server-only"` で保護しており、クライアントから
  import するとビルドエラーになる。記事取得はサーバーコンポーネントや
  Route Handler 経由で行うこと。
- **秘密情報をコードに直書きしない。** 設定値はすべて環境変数（`.env.local`）から読む。
  `.env.local` は `.gitignore` で除外済み。キー名の一覧は `.env.local.example` を参照。
- Firebase の `NEXT_PUBLIC_*` 設定値は公開されても問題ない（秘密鍵ではない）。
  ただしアクセス制御は Firestore のセキュリティルールで必ず行う。

## 開発コマンド

```bash
npm run dev     # 開発サーバー起動（http://localhost:3000）
npm run build   # 本番ビルド
npm run start   # 本番ビルドの起動
npm run lint    # ESLint による静的チェック
```

## 実装フェーズ

機能の詳細と優先順位は [SPEC.md](./SPEC.md) を参照。

- フェーズ1: Google ログイン、会員プロフィール
- フェーズ2: お知らせ・イベント記事の表示（microCMS）、寄付集め（Stripe）
- フェーズ3: 耐震問題の署名機能、卒業生名簿
