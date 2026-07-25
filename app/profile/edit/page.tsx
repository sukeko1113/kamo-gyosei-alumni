// 会員プロフィール編集ページ（/profile/edit）。
// 自分の users ドキュメントを読み込んでフォームに表示し、保存できるようにする。
// 状態管理やイベント処理が必要なため、クライアントコンポーネントにする。
"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
// Firestore のモジュラー API（v10 系）から必要な関数を読み込む。
import { doc, getDoc, setDoc, serverTimestamp } from "firebase/firestore";

import { db } from "@/lib/firebase";
import { useAuth } from "@/components/auth-provider";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { estimateGraduationYear, toKatakana } from "@/lib/utils";
import { DEPARTMENTS, type Department } from "@/types";

// フォームの入力値はすべて文字列で保持する（数値の graduationYear も入力中は文字列）。
// こうすると「空欄」と「0」を区別でき、入力途中の表示も扱いやすい。
type FormValues = {
  lastName: string; // 姓（必須）
  firstName: string; // 名（必須）
  lastNameKana: string; // 姓のふりがな（必須・保存時にカタカナへ正規化）
  firstNameKana: string; // 名のふりがな（必須・保存時にカタカナへ正規化）
  maidenName: string; // 旧姓（任意）
  graduationYear: string; // 卒業年次・西暦（必須）
  clubActivity: string; // 部活動・クラス（任意）
  contactEmail: string; // 連絡用メール（任意）
};

// 入力欄の初期値（すべて空）。
const EMPTY_FORM: FormValues = {
  lastName: "",
  firstName: "",
  lastNameKana: "",
  firstNameKana: "",
  maidenName: "",
  graduationYear: "",
  clubActivity: "",
  contactEmail: "",
};

// 年の入力範囲。非現実的な値（マイナス・未来など）を防ぐために使う。
// 生年月は卒業年の計算補助にのみ使用（保存はしない）。
const CURRENT_YEAR = new Date().getFullYear();
const MIN_BIRTH_YEAR = 1920;
// 卒業年次の許容範囲（学校の創立が大正9年＝1920年のため下限は 1920）。
const MIN_GRADUATION_YEAR = 1920;

export default function ProfileEditPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();

  // フォームの入力値（テキスト項目）。
  const [form, setForm] = useState<FormValues>(EMPTY_FORM);
  // 卒業学科（必須・4択）。未選択は空文字で表す。
  const [department, setDepartment] = useState<Department | "">("");
  // 卒業生名簿への掲載可否（オプトイン）。文字列ではなく真偽値で扱うため別管理にする。
  const [isListedInDirectory, setIsListedInDirectory] = useState(false);
  // 生年月（★保存しない★・卒業年の候補計算にのみ使うフォーム上の一時値）。
  const [birthYear, setBirthYear] = useState("");
  const [birthMonth, setBirthMonth] = useState("");
  // Firestore からの初期データ読み込み中かどうか。
  const [loadingDoc, setLoadingDoc] = useState(true);
  // 保存処理中かどうか（ボタンの二重押し防止に使う）。
  const [saving, setSaving] = useState(false);
  // 保存結果のメッセージ。type で成功/失敗を色分けする。
  const [message, setMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  // --- 認証チェック：未ログインならログインページへ戻す ---
  useEffect(() => {
    if (!authLoading && !user) {
      router.replace("/login");
    }
  }, [authLoading, user, router]);

  // --- 読み込み時：現在の値を Firestore から取得してフォームに反映する ---
  useEffect(() => {
    // ユーザーが確定するまでは何もしない。
    if (!user) return;

    let active = true; // アンマウント後に state を更新しないためのフラグ。
    (async () => {
      setLoadingDoc(true);
      try {
        // users/{uid} のドキュメントを取得する。
        const snap = await getDoc(doc(db, "users", user.uid));
        const data = snap.exists() ? snap.data() : {};
        if (!active) return;
        // 取得した値をフォームに反映（未設定なら空文字のまま）。
        setForm({
          lastName: data.lastName ?? "",
          firstName: data.firstName ?? "",
          lastNameKana: data.lastNameKana ?? "",
          firstNameKana: data.firstNameKana ?? "",
          maidenName: data.maidenName ?? "",
          graduationYear:
            data.graduationYear !== undefined && data.graduationYear !== null
              ? String(data.graduationYear)
              : "",
          clubActivity: data.clubActivity ?? "",
          contactEmail: data.contactEmail ?? "",
        });
        // 学科（4択のいずれかのときだけ採用）。
        setDepartment(
          (DEPARTMENTS as readonly string[]).includes(data.department)
            ? (data.department as Department)
            : ""
        );
        // 名簿掲載フラグ（未設定は false 扱い）。
        setIsListedInDirectory(data.isListedInDirectory === true);
      } catch (err) {
        console.error("プロフィールの読み込みに失敗しました", err);
        if (active) {
          setMessage({
            type: "error",
            text: "プロフィールの読み込みに失敗しました。時間をおいて再度お試しください。",
          });
        }
      } finally {
        if (active) setLoadingDoc(false);
      }
    })();

    return () => {
      active = false;
    };
  }, [user]);

  // 入力欄が変わったときにフォームの状態を更新する共通ハンドラ。
  function handleChange(key: keyof FormValues) {
    return (e: React.ChangeEvent<HTMLInputElement>) => {
      setForm((prev) => ({ ...prev, [key]: e.target.value }));
    };
  }

  // --- 生年月から卒業年の候補を計算して、卒業年次欄に自動入力する ---
  // ★ 生年月は保存しない。ここで計算に使うだけ。あくまで「候補」で、本人が修正できる。
  function handleEstimateGraduationYear() {
    setMessage(null);
    const y = Number(birthYear.trim());
    const m = Number(birthMonth.trim());
    if (!Number.isInteger(y) || y < MIN_BIRTH_YEAR || y > CURRENT_YEAR) {
      setMessage({
        type: "error",
        text: `生年は西暦（${MIN_BIRTH_YEAR}〜${CURRENT_YEAR}）で入力してください。`,
      });
      return;
    }
    if (!Number.isInteger(m) || m < 1 || m > 12) {
      setMessage({ type: "error", text: "生月は 1〜12 で入力してください。" });
      return;
    }
    // 早生まれ(1〜3月)=生年+18、遅生まれ(4月以降)=生年+19。
    const estimated = estimateGraduationYear(y, m);
    setForm((prev) => ({ ...prev, graduationYear: String(estimated) }));
    setMessage({
      type: "success",
      text: `卒業年の候補として ${estimated} 年を入力しました。異なる場合は修正してください。`,
    });
  }

  // --- 保存処理 ---
  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault(); // ページ再読み込みを防ぐ。
    if (!user) return;
    setMessage(null);

    // 必須項目の空チェック（姓・名・姓かな・名かな・学科・卒業年次）。
    // ふりがなは「文字種で弾かず」保存時にカタカナへ自動変換するため、ここでは空だけ見る。
    if (form.lastName.trim() === "" || form.firstName.trim() === "") {
      setMessage({ type: "error", text: "姓・名を入力してください。" });
      return;
    }
    if (form.lastNameKana.trim() === "" || form.firstNameKana.trim() === "") {
      setMessage({
        type: "error",
        text: "姓のふりがな・名のふりがなを入力してください。",
      });
      return;
    }
    if (department === "") {
      setMessage({ type: "error", text: "卒業学科を選択してください。" });
      return;
    }

    // 卒業年次のチェック：必須・整数の西暦のみ。
    const yearText = form.graduationYear.trim();
    if (yearText === "") {
      setMessage({ type: "error", text: "卒業年次（西暦）を入力してください。" });
      return;
    }
    const graduationYear = Number(yearText);
    if (!Number.isInteger(graduationYear)) {
      setMessage({
        type: "error",
        text: "卒業年次は西暦（数字のみ）で入力してください。",
      });
      return;
    }
    // 非現実的な卒業年（マイナス・未来など）は保存前に弾く。
    if (graduationYear < MIN_GRADUATION_YEAR || graduationYear > CURRENT_YEAR) {
      setMessage({
        type: "error",
        text: `卒業年次は西暦（${MIN_GRADUATION_YEAR}〜${CURRENT_YEAR}）で入力してください。`,
      });
      return;
    }

    setSaving(true);
    try {
      // 保存するデータ。role は含めない（クライアントからは変更しない）。
      // ふりがなは toKatakana で全角カタカナに正規化して保存する。
      // ★ 生年月（birthYear / birthMonth）は payload に一切含めない ★
      const payload = {
        lastName: form.lastName.trim(),
        firstName: form.firstName.trim(),
        lastNameKana: toKatakana(form.lastNameKana.trim()),
        firstNameKana: toKatakana(form.firstNameKana.trim()),
        maidenName: form.maidenName.trim(),
        department, // 4択のいずれか（上のチェックで空でないことを保証）
        graduationYear,
        clubActivity: form.clubActivity.trim(),
        contactEmail: form.contactEmail.trim(),
        isListedInDirectory, // 卒業生名簿への掲載可否（true のときだけ掲載される）
        updatedAt: serverTimestamp(), // サーバー側の時刻で更新日時を記録。
      };

      // merge: true で、既存の email や role などを残したまま該当フィールドだけ更新する。
      await setDoc(doc(db, "users", user.uid), payload, { merge: true });

      setMessage({ type: "success", text: "プロフィールを保存しました。" });
    } catch (err) {
      console.error("プロフィールの保存に失敗しました", err);
      setMessage({
        type: "error",
        text: "保存に失敗しました。時間をおいて再度お試しください。",
      });
    } finally {
      setSaving(false);
    }
  }

  // 認証確認中・データ読み込み中はシンプルな読み込み表示を出す。
  if (authLoading || (user && loadingDoc)) {
    return (
      <main className="mx-auto w-full max-w-2xl flex-1 p-6">
        <p className="text-base text-muted-foreground">読み込み中です…</p>
      </main>
    );
  }

  // 未ログイン時は上の useEffect でリダイレクトされるため、ここでは何も表示しない。
  if (!user) return null;

  return (
    <main className="mx-auto w-full max-w-2xl flex-1 p-6">
      <h1 className="text-2xl font-bold">プロフィールの編集</h1>
      <p className="mt-2 text-base text-muted-foreground">
        <span className="font-semibold text-destructive">*</span>{" "}
        の付いた項目は必須です。それ以外は任意で、空欄のままでも構いません。
      </p>

      {/* 入力フォーム。各項目はラベルと入力欄をまとめて縦に並べる。 */}
      <form onSubmit={handleSubmit} className="mt-6 flex flex-col gap-6">
        {/* 氏名（姓・名）＝必須 */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="flex flex-col gap-2">
            <Label htmlFor="lastName">
              姓 <span className="text-destructive">*</span>
            </Label>
            <Input
              id="lastName"
              name="lastName"
              placeholder="例：西村"
              value={form.lastName}
              onChange={handleChange("lastName")}
              disabled={saving}
              autoComplete="family-name"
            />
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="firstName">
              名 <span className="text-destructive">*</span>
            </Label>
            <Input
              id="firstName"
              name="firstName"
              placeholder="例：幸助"
              value={form.firstName}
              onChange={handleChange("firstName")}
              disabled={saving}
              autoComplete="given-name"
            />
          </div>
        </div>

        {/* ふりがな（姓・名）＝必須。ひらがな・カタカナどちらでも可（保存時にカタカナへ変換）。 */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="flex flex-col gap-2">
            <Label htmlFor="lastNameKana">
              姓のふりがな <span className="text-destructive">*</span>
            </Label>
            <Input
              id="lastNameKana"
              name="lastNameKana"
              placeholder="例：にしむら"
              value={form.lastNameKana}
              onChange={handleChange("lastNameKana")}
              disabled={saving}
            />
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="firstNameKana">
              名のふりがな <span className="text-destructive">*</span>
            </Label>
            <Input
              id="firstNameKana"
              name="firstNameKana"
              placeholder="例：こうすけ"
              value={form.firstNameKana}
              onChange={handleChange("firstNameKana")}
              disabled={saving}
            />
          </div>
        </div>
        <p className="-mt-2 text-base text-muted-foreground">
          ふりがなは、ひらがな・カタカナのどちらで入力しても構いません
          （保存時にカタカナへ自動でそろえます）。
        </p>

        {/* 旧姓（任意・改姓した人のみ） */}
        <div className="flex flex-col gap-2">
          <Label htmlFor="maidenName">旧姓（改姓された方のみ・卒業時の姓）</Label>
          <Input
            id="maidenName"
            name="maidenName"
            placeholder="例：佐藤"
            value={form.maidenName}
            onChange={handleChange("maidenName")}
            disabled={saving}
          />
        </div>

        {/* 卒業学科＝必須（4択・「その他」なし） */}
        <div className="flex flex-col gap-2">
          <Label htmlFor="department">
            卒業学科 <span className="text-destructive">*</span>
          </Label>
          <Select
            value={department || undefined}
            onValueChange={(v) => setDepartment(v as Department)}
            disabled={saving}
          >
            <SelectTrigger id="department" className="min-h-[44px]">
              <SelectValue placeholder="選択してください" />
            </SelectTrigger>
            <SelectContent>
              {DEPARTMENTS.map((d) => (
                <SelectItem key={d} value={d}>
                  {d}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <p className="text-base text-muted-foreground">
            現在は廃止された学科（商業科・情報処理科）も、当時卒業された方向けに選べます。
          </p>
        </div>

        {/* 卒業年次＝必須。生年月からの計算補助つき。 */}
        <div className="flex flex-col gap-2">
          <Label htmlFor="graduationYear">
            卒業年次（西暦） <span className="text-destructive">*</span>
          </Label>
          <Input
            id="graduationYear"
            name="graduationYear"
            type="number"
            inputMode="numeric"
            min={MIN_GRADUATION_YEAR}
            max={CURRENT_YEAR}
            step={1}
            placeholder="例：1980"
            value={form.graduationYear}
            onChange={handleChange("graduationYear")}
            disabled={saving}
          />

          {/* 生年月からの卒業年候補の計算（★生年月は保存しません★） */}
          <div className="mt-2 flex flex-col gap-3 rounded-md border border-input p-4">
            <p className="text-base font-medium">
              卒業年がわからない場合：生年月から候補を計算できます
            </p>
            <div className="flex flex-wrap items-end gap-3">
              <div className="flex flex-col gap-1">
                <Label htmlFor="birthYear">生年（西暦）</Label>
                <Input
                  id="birthYear"
                  type="number"
                  inputMode="numeric"
                  min={MIN_BIRTH_YEAR}
                  max={CURRENT_YEAR}
                  step={1}
                  placeholder="例：1962"
                  value={birthYear}
                  onChange={(e) => setBirthYear(e.target.value)}
                  disabled={saving}
                  className="w-32"
                />
              </div>
              <div className="flex flex-col gap-1">
                <Label htmlFor="birthMonth">生月</Label>
                <Input
                  id="birthMonth"
                  type="number"
                  inputMode="numeric"
                  min={1}
                  max={12}
                  step={1}
                  placeholder="例：4"
                  value={birthMonth}
                  onChange={(e) => setBirthMonth(e.target.value)}
                  disabled={saving}
                  className="w-24"
                />
              </div>
              <Button
                type="button"
                variant="outline"
                onClick={handleEstimateGraduationYear}
                disabled={saving}
                className="min-h-[44px]"
              >
                卒業年を計算して入力
              </Button>
            </div>
            <p className="text-base text-muted-foreground">
              早生まれ（1〜3月）と遅生まれ（4月以降）を考慮して計算します。
              あくまで目安の候補です。浪人・留年・編入などがある場合は修正してください。
              <br />
              入力した生年月は<strong>保存されません</strong>（計算にのみ使用します）。
            </p>
          </div>
        </div>

        {/* 部活動・クラスなど（任意） */}
        <div className="flex flex-col gap-2">
          <Label htmlFor="clubActivity">当時の部活動・クラスなど</Label>
          <Input
            id="clubActivity"
            name="clubActivity"
            placeholder="例：野球部 / 3年A組"
            value={form.clubActivity}
            onChange={handleChange("clubActivity")}
            disabled={saving}
          />
        </div>

        {/* 連絡用メール（任意） */}
        <div className="flex flex-col gap-2">
          <Label htmlFor="contactEmail">連絡用メールアドレス</Label>
          <Input
            id="contactEmail"
            name="contactEmail"
            type="email"
            placeholder="例：taro@example.com"
            value={form.contactEmail}
            onChange={handleChange("contactEmail")}
            disabled={saving}
            autoComplete="email"
          />
          <p className="text-base text-muted-foreground">
            Google アカウントとは別の連絡先を使いたい場合に入力してください。
          </p>
        </div>

        {/* 卒業生名簿への掲載可否（オプトイン・デフォルト off） */}
        <div className="flex items-start gap-3 rounded-md border border-input p-4">
          <Checkbox
            id="isListedInDirectory"
            checked={isListedInDirectory}
            onCheckedChange={(v) => setIsListedInDirectory(v === true)}
            disabled={saving}
            className="mt-0.5"
          />
          <Label
            htmlFor="isListedInDirectory"
            className="cursor-pointer font-normal leading-relaxed"
          >
            卒業生名簿に公開する
            <span className="block text-base text-muted-foreground">
              ※ オンにすると、ログインした他の会員が見られる卒業生名簿に、
              あなたの氏名・ふりがな・旧姓・卒業学科・卒業年次・部活動が掲載されます。
              <strong>連絡先メールアドレスは掲載されません。</strong>
              オフにすればいつでも掲載をやめられます。
            </span>
          </Label>
        </div>

        {/* 保存結果のメッセージ。成功は通常色、失敗は赤で表示する。 */}
        {message && (
          <p
            role="status"
            className={
              message.type === "error"
                ? "text-base text-destructive"
                : "text-base text-green-700"
            }
          >
            {message.text}
          </p>
        )}

        {/* 操作ボタン。保存中はボタンを無効化する。 */}
        <div className="flex flex-wrap gap-3">
          <Button type="submit" size="lg" disabled={saving}>
            {saving ? "保存中…" : "保存する"}
          </Button>
          <Button type="button" size="lg" variant="outline" asChild>
            <Link href="/dashboard">ダッシュボードに戻る</Link>
          </Button>
        </div>
      </form>
    </main>
  );
}
