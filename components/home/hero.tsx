import Image from "next/image";

/**
 * ヒーロー：歴史写真（グレースケール）を背景に、円相 + 短いコピー。
 * 「大正九年創立 一〇六年のあゆみ」を大きく掲げ、あゆみセクションへ誘導する。
 */
export function Hero() {
  return (
    <section className="relative overflow-hidden">
      <Image
        src="/images/history-new-building.jpg"
        alt="旧校舎"
        fill
        priority
        fetchPriority="high"
        quality={70}
        sizes="100vw"
        className="object-cover contrast-[0.9] grayscale"
      />
      {/* 生成りのオーバーレイで写真を沈め、文字の可読性（コントラスト）を確保する */}
      <div
        className="absolute inset-0"
        style={{
          background:
            "linear-gradient(rgba(250,248,245,0.88), rgba(250,248,245,0.96))",
        }}
      />

      <div className="relative flex flex-col items-center gap-8 px-6 py-[clamp(56px,8vw,96px)] text-center">
        {/* 円相（欠けた円）。禅の美意識を表す装飾。 */}
        <svg
          width="180"
          height="180"
          viewBox="0 0 200 200"
          aria-hidden="true"
          className="block"
        >
          <circle
            cx="100"
            cy="100"
            r="88"
            fill="none"
            stroke="#1A1A1A"
            strokeWidth="5"
            strokeLinecap="round"
            strokeDasharray="500 60"
            transform="rotate(-60 100 100)"
            opacity="0.85"
          />
        </svg>

        <h1 className="m-0 font-serif text-[clamp(28px,5vw,44px)] font-semibold leading-[1.6] tracking-[0.14em]">
          大正九年創立
          <br />
          一〇六年のあゆみ
        </h1>

        {/* 高齢の利用者向けに、本文よりやや大きめ・高コントラストにする。 */}
        <p className="m-0 max-w-[34em] text-[19px] font-medium leading-[1.95] tracking-[0.06em] text-[#241F19]">
          越後加茂の地に学び舎を得て一世紀余。
          <br />
          ここは、すべての卒業生の帰る場所です。
        </p>

        <a
          href="#history"
          className="mt-2 flex min-h-[48px] items-center justify-center border border-sumi px-10 text-base font-medium tracking-[0.2em] text-sumi no-underline transition-colors hover:bg-sumi hover:text-kinari"
        >
          あゆみを見る
        </a>
      </div>
    </section>
  );
}
