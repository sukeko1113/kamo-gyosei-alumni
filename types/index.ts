// プロジェクト共通の型定義。
// アプリ全体で使う基本的な型をここにまとめる。

// ----------------------------------------------------------------
// ユーザー（会員）関連
// ----------------------------------------------------------------

// 会員の権限。初期値は "member"。将来的に管理者（admin）を追加できる。
export type UserRole = "member" | "admin";

// Firebase Authentication + Firestore に保存する会員プロフィール。
// uid / email / displayName / photoURL は Google ログインから取得できる項目。
export type User = {
  uid: string; // Firebase が発行する一意のユーザー ID
  email: string | null; // メールアドレス
  displayName: string | null; // 表示名
  photoURL: string | null; // プロフィール画像の URL
  role: UserRole; // 権限（初回ログイン時は "member"）。クライアントからは変更不可。

  // --- 会員自身が編集できるプロフィール項目（すべて任意・未入力可） ---
  graduationYear?: number; // 卒業年次（西暦）。未入力のときは保存しない / null。
  maidenName?: string; // 旧姓
  furigana?: string; // 氏名のふりがな（全角カナ）
  clubActivity?: string; // 当時の部活動・クラスなど
  contactEmail?: string; // 連絡用メール（Google アカウントとは別にしたい人向け）

  createdAt?: unknown; // 登録日時（Firestore の serverTimestamp で記録）
  updatedAt?: unknown; // 最終更新日時（Firestore の serverTimestamp で記録）
};

// ----------------------------------------------------------------
// microCMS（お知らせ / News）関連
// ----------------------------------------------------------------

// microCMS のすべてのコンテンツが共通で持つメタ情報。
export type MicroCMSBase = {
  id: string; // コンテンツの一意 ID
  createdAt: string; // 作成日時
  updatedAt: string; // 更新日時
  publishedAt?: string; // 公開日時
  revisedAt?: string; // 最終改訂日時
};

// microCMS の画像フィールドが返す型（アイキャッチなどで共通利用）。
export type MicroCMSImage = {
  url: string; // 画像の URL
  height: number; // 画像の高さ（px）
  width: number; // 画像の幅（px）
};

// news エンドポイントのお知らせ 1 件分の型。
// microCMS 管理画面のスキーマに対応する。
export type News = MicroCMSBase & {
  title: string; // タイトル（テキスト）
  content: string; // 本文（リッチエディタの HTML 文字列）
  // 掲載日（任意の日時フィールド）。管理画面で別途設定する運用向け。
  // 未設定のときはシステムの publishedAt（MicroCMSBase）で代替できる。
  publishedDate?: string;
  // カテゴリ（セレクトフィールド・任意）。microCMS のセレクトは
  // 単一選択でも文字列の配列で返ってくるため string[] とする。
  category?: string[];
  eyecatch?: MicroCMSImage; // アイキャッチ画像（任意）
};

// お知らせ一覧 API のレスポンス（microCMS のリスト形式）。
export type NewsListResponse = {
  contents: News[]; // お知らせの配列
  totalCount: number; // 全件数
  offset: number; // 取得開始位置
  limit: number; // 取得件数
};
