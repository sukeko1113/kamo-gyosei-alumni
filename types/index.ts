// プロジェクト共通の型定義。
// アプリ全体で使う基本的な型をここにまとめる。

// ----------------------------------------------------------------
// ユーザー（会員）関連
// ----------------------------------------------------------------

// Firebase Authentication + Firestore に保存する会員プロフィール。
// uid / email / displayName / photoURL は Google ログインから取得できる項目。
export type User = {
  uid: string; // Firebase が発行する一意のユーザー ID
  email: string | null; // メールアドレス
  displayName: string | null; // 表示名
  photoURL: string | null; // プロフィール画像の URL
  graduationYear?: number; // 卒業年度（フェーズ1の会員プロフィールで入力）
  createdAt?: string; // 登録日時（ISO 文字列）
};

// ----------------------------------------------------------------
// microCMS（記事）関連
// ----------------------------------------------------------------

// microCMS のすべてのコンテンツが共通で持つメタ情報。
export type MicroCMSBase = {
  id: string; // コンテンツの一意 ID
  createdAt: string; // 作成日時
  updatedAt: string; // 更新日時
  publishedAt?: string; // 公開日時
  revisedAt?: string; // 最終改訂日時
};

// 記事のカテゴリ（お知らせ / イベント などの区別に使う想定）。
export type Category = MicroCMSBase & {
  name: string;
};

// blogs エンドポイントの記事 1 件分の型。
// microCMS の管理画面で定義するフィールドに合わせて拡張していく。
export type Blog = MicroCMSBase & {
  title: string; // 記事タイトル
  content: string; // 本文（リッチエディタの HTML 文字列）
  eyecatch?: {
    // アイキャッチ画像（任意）
    url: string;
    height: number;
    width: number;
  };
  category?: Category; // カテゴリ（任意）
};

// 記事一覧 API のレスポンス（microCMS のリスト形式）。
export type BlogListResponse = {
  contents: Blog[]; // 記事の配列
  totalCount: number; // 全件数
  offset: number; // 取得開始位置
  limit: number; // 取得件数
};
