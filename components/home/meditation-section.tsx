// トップページ最上部の「今日の瞑想録」セクション。
// 西村大串『瞑想録』から、その日の月日に対応する一編を縦書きで表示する。
// 「現代語」⇔「当時の言葉」の切り替え（状態）を持つためクライアントコンポーネント。
// 本文データはサーバー側（app/page.tsx）で取得して props で受け取る
//（クライアントから microCMS を叩かない）。
"use client";

import { useEffect, useRef, useState } from "react";
import type { Meditation } from "@/types";

type Props = {
  meditation: Meditation;
  kanjiDate: string; // 「九月五日」のような漢数字の月日（サーバー側で変換済み）
};

// 表示モード。初期表示は「現代語」。
type Mode = "modern" | "original";

// 切替ボタン（セグメント型）の1つ分。
// 高齢の利用者向けに、高さ 44px 以上・16px 以上を確保する。
function ModeButton({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={`flex min-h-[44px] items-center justify-center px-6 text-base font-medium transition-colors ${
        active
          ? "bg-ai text-kinari"
          : "bg-transparent text-sumi hover:bg-washi-hover"
      }`}
    >
      {children}
    </button>
  );
}

export function MeditationSection({ meditation, kanjiDate }: Props) {
  const [mode, setMode] = useState<Mode>("modern");
  // 縦書き本文のスクロール枠。切替時に先頭（右端）へ戻すために参照を持つ。
  const scrollRef = useRef<HTMLDivElement>(null);

  // モードが切り替わったら、スクロール位置を先頭（右端）に戻す。
  // writing-mode: vertical-rl では scrollLeft = 0 が「右端（文章の先頭）」にあたる
  //（左へ読み進めると負の値になる）。ブラウザ差に備えて明示的に 0 に戻す。
  useEffect(() => {
    scrollRef.current?.scrollTo({ left: 0 });
  }, [mode]);

  // 本文を改行で段落に分割する（空行は除く）。
  const text = mode === "modern" ? meditation.modern : meditation.original;
  const paragraphs = text
    .split(/\r?\n/)
    .map((p) => p.trim())
    .filter((p) => p.length > 0);

  return (
    <section aria-label="今日の瞑想録" className="bg-kinari px-5 pb-4 pt-10 sm:px-[clamp(20px,5vw,56px)]">
      <div className="mx-auto flex max-w-5xl flex-col items-center gap-5">
        {/* 見出しまわり。日付は漢数字、フォントは本文と同じ しっぽり明朝。 */}
        <div className="flex flex-col items-center gap-1 text-center">
          <h2 className="m-0 font-serif text-2xl font-semibold tracking-[0.14em] sm:text-3xl">
            今日の瞑想録
          </h2>
          <p className="m-0 text-base tracking-[0.08em] text-ink-muted">
            西村大串『瞑想録』より
          </p>
          <p className="m-0 mt-1 font-shippori text-lg tracking-[0.14em]">
            {kanjiDate}
          </p>
        </div>

        {/* 現代語／当時の言葉 の切替スイッチ（セグメント型）。 */}
        <div
          role="group"
          aria-label="本文の表示切替"
          className="grid grid-cols-2 overflow-hidden rounded-sm border border-washi-rule"
        >
          <ModeButton active={mode === "modern"} onClick={() => setMode("modern")}>
            現代語
          </ModeButton>
          <ModeButton
            active={mode === "original"}
            onClick={() => setMode("original")}
          >
            当時の言葉
          </ModeButton>
        </div>

        {/* 縦書きの本文枠。和紙のような落ち着いた印象になるよう、
            生成りの背景 + 細い罫線 + 余白で仕上げる。
            収まらない文章は横スクロール（縦書きなので左方向に続く）。 */}
        <div className="relative w-full">
          <div
            ref={scrollRef}
            className="h-[50vh] w-full overflow-x-auto overflow-y-hidden border border-washi-rule bg-kinari px-6 py-8 sm:px-10 md:h-[60vh]"
            style={{
              writingMode: "vertical-rl",
              textOrientation: "mixed",
            }}
          >
            {paragraphs.map((paragraph, index) => (
              <p
                key={index}
                // 段落の先頭を一字下げ。縦書きでは text-indent が上端の一字分になる。
                // 段落間の間隔は margin-block（縦書きでは左右方向）で取る。
                className="m-0 font-shippori text-base leading-[2] tracking-[0.05em] text-ink-soft [text-indent:1em] md:text-lg [&+&]:[margin-block-start:1.5em]"
              >
                {paragraph}
              </p>
            ))}

            {/* 出典があれば末尾（左端側）に小さく表示する。
                text-end で下端（行末側）に寄せ、margin-block で本文から一列分離す。 */}
            {meditation.source && (
              <p className="m-0 text-end font-shippori text-sm text-ink-muted [margin-block-start:2em]">
                （{meditation.source}）
              </p>
            )}
          </div>

          {/* 枠の左端の薄いグラデーション。「左に続きがある」ことを示す。 */}
          <div
            aria-hidden
            className="pointer-events-none absolute inset-y-px left-px w-10"
            style={{
              background:
                "linear-gradient(to right, rgba(216,210,200,0.55), rgba(250,248,245,0))",
            }}
          />
        </div>
      </div>
    </section>
  );
}
