# 加茂暁星高等学校 同窓会ウェブサイト

加茂暁星高等学校 同窓会の公式ウェブサイトです。卒業生向けに、ログイン・会員プロフィール、
お知らせ／イベント記事、寄付、署名、卒業生名簿などの機能を提供します。

技術スタックや実装フェーズの詳細は [CLAUDE.md](./CLAUDE.md) と [SPEC.md](./SPEC.md)
を参照してください。

## 技術スタック

- **Next.js 15**（App Router, TypeScript）
- **Tailwind CSS v4** + **shadcn/ui**
- **Firebase Authentication**（Google ログイン）+ **Cloud Firestore**
- **microCMS**（記事管理。サーバーサイド API のみ使用）
- **Stripe**（決済。フェーズ2以降）
- **Vercel**（ホスティング）

## 必要なもの

- Node.js 18.18 以上（推奨: 20 以上）
- npm
- Firebase プロジェクト（Authentication と Firestore を有効化）
- microCMS のサービス（`blogs` API を作成）

## セットアップ手順

### 1. リポジトリを取得して依存関係をインストール

```bash
git clone <このリポジトリの URL>
cd kamo-gyosei-alumni
npm install
```

### 2. 環境変数を設定

見本ファイルをコピーして `.env.local` を作成し、各値を埋めます。

```bash
cp .env.local.example .env.local
```

設定する環境変数:

| 変数名 | 取得元・説明 |
| --- | --- |
| `NEXT_PUBLIC_FIREBASE_API_KEY` | Firebase コンソール > プロジェクトの設定 |
| `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN` | 同上 |
| `NEXT_PUBLIC_FIREBASE_PROJECT_ID` | 同上 |
| `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET` | 同上 |
| `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID` | 同上 |
| `NEXT_PUBLIC_FIREBASE_APP_ID` | 同上 |
| `MICROCMS_SERVICE_DOMAIN` | microCMS のサービスドメイン（`xxxx.microcms.io` の `xxxx` 部分） |
| `MICROCMS_API_KEY` | microCMS の API キー（**サーバー専用。公開厳禁**） |

> ⚠️ `MICROCMS_API_KEY` には絶対に `NEXT_PUBLIC_` を付けないでください。
> 付けるとブラウザに漏れ、誰でも管理 API を操作できてしまいます。
>
> `.env.local` は `.gitignore` で除外されており、Git にはコミットされません。

### 3. 開発サーバーを起動

```bash
npm run dev
```

ブラウザで [http://localhost:3000](http://localhost:3000) を開きます。

## よく使うコマンド

```bash
npm run dev     # 開発サーバー起動
npm run build   # 本番ビルド
npm run start   # 本番ビルドの起動
npm run lint    # ESLint による静的チェック
```

## shadcn/ui コンポーネントの追加

UI 部品は [shadcn/ui](https://ui.shadcn.com/) を使います。新しいコンポーネントは
次のコマンドで追加できます（追加後、`components/ui/` に生成されます）。

```bash
npx shadcn@latest add <コンポーネント名>   # 例: npx shadcn@latest add card
```

## デプロイ

[Vercel](https://vercel.com/) にデプロイします。Vercel のプロジェクト設定で、
上記の環境変数をすべて登録してください（`.env.local` の内容と同じ）。
