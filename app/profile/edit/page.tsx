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

// フォームの入力値はすべて文字列で保持する（数値の graduationYear も入力中は文字列）。
// こうすると「空欄」と「0」を区別でき、入力途中の表示も扱いやすい。
type FormValues = {
  graduationYear: string;
  maidenName: string;
  furigana: string;
  clubActivity: string;
  contactEmail: string;
};

// 入力欄の初期値（すべて空）。
const EMPTY_FORM: FormValues = {
  graduationYear: "",
  maidenName: "",
  furigana: "",
  clubActivity: "",
  contactEmail: "",
};

export default function ProfileEditPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();

  // フォームの入力値。
  const [form, setForm] = useState<FormValues>(EMPTY_FORM);
  // 卒業生名簿への掲載可否（オプトイン）。文字列ではなく真偽値で扱うため別管理にする。
  const [isListedInDirectory, setIsListedInDirectory] = useState(false);
  // Firestore からの初期データ読み込み中かどうか。
  const [loadingDoc, setLoadingDoc] = useState(true);
  // 保存処理中かどうか（ボタンの二重押し防止に使う）。
  const [saving, setSaving] = useState(false);
  // 保存結果のメッセージ。type で成功/失敗を色分けする。
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

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
          graduationYear:
            data.graduationYear !== undefined && data.graduationYear !== null
              ? String(data.graduationYear)
              : "",
          maidenName: data.maidenName ?? "",
          furigana: data.furigana ?? "",
          clubActivity: data.clubActivity ?? "",
          contactEmail: data.contactEmail ?? "",
        });
        // 名簿掲載フラグ（未設定は false 扱い）。
        setIsListedInDirectory(data.isListedInDirectory === true);
      } catch (err) {
        console.error("プロフィールの読み込みに失敗しました", err);
        if (active) {
          setMessage({ type: "error", text: "プロフィールの読み込みに失敗しました。時間をおいて再度お試しください。" });
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

  // --- 保存処理 ---
  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault(); // ページ再読み込みを防ぐ。
    if (!user) return;
    setMessage(null);

    // graduationYear のチェック：空欄は OK、入力するなら数値のみ。
    let graduationYear: number | null = null;
    const yearText = form.graduationYear.trim();
    if (yearText !== "") {
      const parsed = Number(yearText);
      // 整数の西暦のみ受け付ける（小数や文字混じりは弾く）。
      if (!Number.isInteger(parsed)) {
        setMessage({ type: "error", text: "卒業年次は西暦（数字のみ）で入力してください。" });
        return;
      }
      graduationYear = parsed;
    }

    setSaving(true);
    try {
      // 保存するデータ。role は含めない（クライアントからは変更しない）。
      // 文字列は前後の空白を除いて保存する。
      const payload = {
        graduationYear, // 空欄なら null
        maidenName: form.maidenName.trim(),
        furigana: form.furigana.trim(),
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
      setMessage({ type: "error", text: "保存に失敗しました。時間をおいて再度お試しください。" });
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
        すべて任意の項目です。入力したくない項目は空欄のままで構いません。
      </p>

      {/* 入力フォーム。各項目はラベルと入力欄をまとめて縦に並べる。 */}
      <form onSubmit={handleSubmit} className="mt-6 flex flex-col gap-6">
        {/* 卒業年次（数値） */}
        <div className="flex flex-col gap-2">
          <Label htmlFor="graduationYear">卒業年次（西暦）</Label>
          <Input
            id="graduationYear"
            name="graduationYear"
            // type="number" と inputMode で、数値キーボードを出しつつ数字入力を促す。
            type="number"
            inputMode="numeric"
            placeholder="例：1980"
            value={form.graduationYear}
            onChange={handleChange("graduationYear")}
            disabled={saving}
          />
        </div>

        {/* 旧姓 */}
        <div className="flex flex-col gap-2">
          <Label htmlFor="maidenName">旧姓</Label>
          <Input
            id="maidenName"
            name="maidenName"
            placeholder="例：山田"
            value={form.maidenName}
            onChange={handleChange("maidenName")}
            disabled={saving}
          />
        </div>

        {/* ふりがな */}
        <div className="flex flex-col gap-2">
          <Label htmlFor="furigana">氏名のふりがな（全角カナ）</Label>
          <Input
            id="furigana"
            name="furigana"
            placeholder="例：ヤマダ タロウ"
            value={form.furigana}
            onChange={handleChange("furigana")}
            disabled={saving}
          />
        </div>

        {/* 部活動・クラスなど */}
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

        {/* 連絡用メール */}
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
              あなたの氏名・ふりがな・旧姓・卒業年次・部活動が掲載されます。
              <strong>連絡先メールアドレスは掲載されません。</strong>
              オフにすればいつでも掲載をやめられます。
            </span>
          </Label>
        </div>

        {/* 保存結果のメッセージ。成功は通常色、失敗は赤で表示する。 */}
        {message && (
          <p
            role="status"
            className={message.type === "error" ? "text-base text-destructive" : "text-base text-green-700"}
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
