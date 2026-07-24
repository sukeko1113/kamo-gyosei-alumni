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

  // 卒業生名簿への掲載可否（本人のオプトイン）。
  // true のときだけ /directory（卒業生名簿）に氏名などが掲載される。
  // 既定は false（未設定も非掲載とみなす）。連絡先メールは掲載対象に含めない。
  isListedInDirectory?: boolean;

  createdAt?: unknown; // 登録日時（Firestore の serverTimestamp で記録）
  updatedAt?: unknown; // 最終更新日時（Firestore の serverTimestamp で記録）
};

// ----------------------------------------------------------------
// 卒業生名簿（directory）関連
// ----------------------------------------------------------------

// 名簿に掲載する1人分のデータ。
// ★ 連絡先メール（contactEmail）や Google アカウントのメール（email）は
//    一切含めない。サーバー側（Admin SDK）でこの形に詰め替えてから返す。
export type DirectoryMember = {
  uid: string; // 会員の Firebase UID（一覧の key などに使う）
  displayName: string; // 氏名（表示名）
  furigana: string; // 氏名のふりがな
  maidenName: string; // 旧姓
  graduationYear: number | null; // 卒業年次（未設定は null）
  clubActivity: string; // 当時の部活動・クラスなど
};

// 卒業年次ごとにまとめた名簿の1グループ。
export type DirectoryGroup = {
  graduationYear: number | null; // この組の卒業年次（null は「卒業年未設定」）
  members: DirectoryMember[]; // 該当する会員（ふりがな順）
};

// 名簿ページに表示するためのデータ（サーバー側で組み立てる）。
export type DirectoryData = {
  totalCount: number; // 掲載されている会員の総数
  groups: DirectoryGroup[]; // 卒業年次ごとのグループ（新しい年が先）
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

// ----------------------------------------------------------------
// 署名の管理（運営者専用）関連
// ----------------------------------------------------------------

// 管理画面で運営者が閲覧する1署名分のデータ。
// ★ email を含む全項目を持つため、サーバー側で管理者と確認できたときだけ返す。
//   （一般会員・未ログインには絶対に渡さない）
export type PetitionAdminRow = {
  id: string; // Firestore ドキュメントID（一覧の key などに使う）
  name: string; // 氏名
  email: string; // メールアドレス（非公開・管理者のみ閲覧可）
  role: PetitionRole | ""; // 立場（未選択は空文字）
  comment: string; // 賛同コメント
  isPublic: boolean; // 氏名・コメントの公開可否
  createdAt: string | null; // 署名日時（ISO 文字列）。未確定のときは null。
};

// 管理画面に返す署名一覧（総数 + 全署名）。
export type PetitionAdminList = {
  totalCount: number; // 署名総数
  signatures: PetitionAdminRow[]; // 全署名（新しい順）
};
