// 署名フォームの入力チェック（バリデーション）。
// クライアント（フォーム）とサーバー（API）の両方から import して、
// 同じルールで検証する。ここには Firebase 等のサーバー専用処理は置かない。
import { PETITION_ROLES, type PetitionInput, type PetitionRole } from "@/types";

// メールアドレスの簡易な形式チェック用の正規表現。
// 「@ の前後に文字があり、ドメインにドットが1つ以上ある」程度の緩いチェック。
// 完全な RFC 準拠ではなく、明らかな入力ミスを弾く目的。
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// 入力欄ごとのエラーメッセージ。問題がなければそのキーは存在しない。
export type PetitionValidationErrors = Partial<
  Record<"name" | "email" | "role", string>
>;

// role が許可された値（または空文字）かどうかを判定する。
export function isValidRole(role: unknown): role is PetitionRole | "" {
  return (
    role === "" ||
    (typeof role === "string" &&
      (PETITION_ROLES as readonly string[]).includes(role))
  );
}

// 文字列の前後空白を除去しつつ、文字列でなければ空文字にして返す。
function asTrimmedString(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

// 未知の入力（API に届いた JSON など）を PetitionInput の形に正規化する。
// 値を信用せず、型・前後空白・既定値をここで整える。
export function normalizePetitionInput(raw: unknown): PetitionInput {
  const obj = (raw ?? {}) as Record<string, unknown>;
  const role = asTrimmedString(obj.role);
  return {
    name: asTrimmedString(obj.name),
    email: asTrimmedString(obj.email).toLowerCase(),
    role: isValidRole(role) ? role : "",
    comment: asTrimmedString(obj.comment),
    isPublic: obj.isPublic === true,
  };
}

// 正規化済みの入力を検証し、問題があればフィールド名→メッセージの辞書を返す。
// 空オブジェクトなら「エラーなし」。
export function validatePetitionInput(
  input: PetitionInput
): PetitionValidationErrors {
  const errors: PetitionValidationErrors = {};

  if (!input.name) {
    errors.name = "お名前を入力してください。";
  } else if (input.name.length > 100) {
    errors.name = "お名前は100文字以内で入力してください。";
  }

  if (!input.email) {
    errors.email = "メールアドレスを入力してください。";
  } else if (!EMAIL_REGEX.test(input.email)) {
    errors.email = "メールアドレスの形式が正しくありません。";
  }

  if (!isValidRole(input.role)) {
    errors.role = "立場の選択値が不正です。";
  }

  return errors;
}
