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

// ----------------------------------------------------------------
// 署名（校舎の耐震化を求める嘆願）関連
// ----------------------------------------------------------------

// 署名者の「立場」として選べる値。空文字（未選択）も許可する。
// セキュリティルール・サーバー側バリデーションでもこの一覧を正とする。
export const PETITION_ROLES = [
  "卒業生",
  "保護者",
  "在校生",
  "教職員",
  "地域住民",
  "その他",
] as const;

export type PetitionRole = (typeof PETITION_ROLES)[number];

// クライアントから送信される署名の入力値。
// email は本人確認・連絡用で、公開には一切使わない。
export type PetitionInput = {
  name: string; // 氏名（必須）
  email: string; // メールアドレス（必須・非公開）
  role: PetitionRole | ""; // 立場（任意。未選択は空文字）
  comment: string; // 賛同コメント（任意）
  isPublic: boolean; // 氏名・コメントを公開してよいか
};

// Firestore の petitions コレクションに保存される1署名分のドキュメント。
// （サーバー側でのみ扱う。クライアントには返さない）
export type PetitionDocument = PetitionInput & {
  createdAt: string; // 署名日時（ISO 文字列に変換して扱う）
};

// 公開可（isPublic=true）の署名のうち、外部に見せてよい項目だけを抜き出した型。
// email は含めない。
export type PetitionPublicSignature = {
  name: string;
  role: PetitionRole | "";
  comment: string;
};

// 署名ページに表示するための集計データ（サーバー側で組み立てる）。
export type PetitionSummary = {
  totalCount: number; // 署名総数
  publicSignatures: PetitionPublicSignature[]; // 公開可の賛同者一覧
};
