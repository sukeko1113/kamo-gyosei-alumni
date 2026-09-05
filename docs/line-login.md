# LINE ログイン

Google ログインに加えて「LINE でログイン」を提供するための実装メモ。

## 必要な環境変数（Vercel で設定・すべてサーバー専用）

`NEXT_PUBLIC_` は絶対に付けないこと（ブラウザに漏らさない）。

| 変数名 | 内容 |
| --- | --- |
| `LINE_CHANNEL_ID` | LINE Developers の LINE ログインチャネルの「チャネル ID」 |
| `LINE_CHANNEL_SECRET` | 同チャネルの「チャネルシークレット」 |
| `LINE_REDIRECT_URI` | このサイトのコールバック URL（下記参照）。Production / Preview で別の値を設定する |

## LINE Developers コンソールに登録するコールバック URL

LINE ログインチャネルの「LINE ログイン設定 > コールバック URL」に登録する。

- 本番: `https://kamo-gyosei-alumni.vercel.app/api/auth/line/callback`
- プレビュー・ローカルで使う場合は、その環境の URL + `/api/auth/line/callback` を追加登録する
  （`LINE_REDIRECT_URI` と完全一致している必要がある）

## 認証フローの概要

会員 ID は **Firebase UID**。LINE のユーザー ID（ID トークンの `sub`）を UID には使わず、
サーバー専用コレクション `lineAccounts/{lineUserId}` で対応関係を管理する。
（次フェーズで Google 会員との連携を `lineAccounts/{lineUserId}.uid` の付け替えだけで
実現できるようにするため）

1. ログイン画面の「LINE でログイン」ボタン（`<a href="/api/auth/line/start">`）を押す
2. `GET /api/auth/line/start` が `state`（CSRF 対策）と `nonce`（リプレイ対策）を生成し、
   httpOnly Cookie（600 秒）に保存して LINE の認可画面へリダイレクトする
   （scope は `profile openid` のみ。email は要求しない）
3. ユーザーが LINE で同意すると `GET /api/auth/line/callback` に認可コードが返る
4. コールバックで以下を行う
   - `state` を Cookie と突き合わせて検証
   - 認可コードを LINE のトークンエンドポイントで ID トークンに交換
   - ID トークンを LINE の検証 API（`/oauth2/v2.1/verify`）で検証（`nonce` も確認）
   - `lineAccounts/{sub}` から Firebase UID を解決
     - 初回: Admin SDK の `auth.createUser()` で Firebase ユーザーを新規作成（UID は自動生成）し、
       `lineAccounts/{sub}` と `users/{uid}`（merge）をバッチ書き込みで保存
     - 2 回目以降: マッピングの `uid` を使う（`auth.getUser(uid)` で実在確認）
   - `auth.createCustomToken(uid)` でカスタムトークンを発行
   - `/login/line#token=<customToken>` へリダイレクト
     （トークンは必ず URL フラグメントで渡す。クエリに入れるとサーバーログや
     リファラに残るため）
5. `/login/line`（クライアント）がフラグメントからトークンを取り出し、URL から消した上で
   `signInWithCustomToken()` で Firebase Auth にサインインし、`/dashboard` へ移動する

## 失敗時の遷移先

| 状況 | 遷移先 |
| --- | --- |
| ユーザーが同意画面でキャンセル | `/login?error=line_cancelled` |
| `state` 不一致 | `/login?error=line_state` |
| トークン交換・ID トークン検証の失敗 | `/login?error=line_verify` |
| その他の想定外エラー | `/login?error=line_unknown` |

## Firestore 構造

```
users/{uid}                    ← 会員本体（既存）
  authProviders: string[]      ← 'google' | 'line'。LINE で新規作成した会員は ['line']
  lineUserId?: string          ← 表示用

lineAccounts/{lineUserId}      ← Admin SDK からのみ読み書き（クライアント不可）
  uid: string                  ← 対応する Firebase UID
  linkedAt: Timestamp
  displayName: string          ← LINE の表示名
```

`lineAccounts` はクライアントから一切アクセスしないため、Firestore セキュリティルールには
許可ルールを追加していない（デフォルト deny のまま）。

## 注意点

- LINE ログインの会員は `user.email` が `null`、`user.providerData` が空配列になる。
  メールを前提にした UI・ロジックを追加する際は null を考慮すること。
- 管理者判定（`ADMIN_EMAILS` とのメール照合）はメールを持つ Google 会員のみ対象。
  LINE ログインの会員は管理者になれない。
- サーバー側から `users/{uid}` を書くときは必ず `{ merge: true }` を使い、
  **`updatedAt` は絶対に書かない**（`updatedAt` の有無で「プロフィール登録済み」を
  判定しており、サーバーが書くと未登録者が名簿を閲覧できてしまうため）。
