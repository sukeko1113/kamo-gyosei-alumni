import Image from "next/image";

type Entry = {
  era: string;
  title: string;
  image: { src: string; alt: string };
  body: string;
  last?: boolean;
};

// あゆみに掲載する2つの節目。写真は public/images/ に配置。
const ENTRIES: Entry[] = [
  {
    era: "大正九年（1920）",
    title: "加茂朝学校として開校",
    image: {
      src: "/images/history-asa-gakko.jpg",
      alt: "開校当時の校舎（茅葺きの本堂）",
    },
    body: "曹洞宗の寺院を仮校舎として開校。禅の教えを礎に、地域の子弟教育が始まりました。",
  },
  {
    era: "昭和初期",
    title: "新校舎の落成",
    image: {
      src: "/images/history-new-building.jpg",
      alt: "昭和初期の新校舎と初代校長",
    },
    body: "木造二階建ての新校舎が完成。以後、幾多の変遷を経て今日の加茂暁星高等学校へと続きます。",
    last: true,
  },
];

/**
 * あゆみ：歴史写真2点を縦タイムラインで表示。
 */
export function History() {
  return (
    <section
      id="history"
      className="mx-auto max-w-[880px] px-6 py-[clamp(48px,6vw,80px)]"
    >
      <h2 className="m-0 mb-3 font-serif text-[clamp(24px,3.5vw,32px)] font-semibold tracking-[0.2em]">
        あゆみ
      </h2>
      <p className="m-0 mb-10 text-base tracking-[0.1em] text-ink-muted">HISTORY</p>

      <div className="flex flex-col">
        {ENTRIES.map((entry) => (
          <div
            key={entry.era}
            className={`grid grid-cols-[24px_1fr] gap-[clamp(20px,4vw,40px)] ${
              entry.last ? "" : "pb-[clamp(36px,5vw,56px)]"
            }`}
          >
            {/* タイムラインの軸（丸印 + 縦線） */}
            <div className="flex flex-col items-center gap-2">
              <span className="mt-1.5 h-3 w-3 flex-shrink-0 rounded-full bg-ai" />
              {!entry.last && <span className="w-px flex-1 bg-washi-rule" />}
            </div>

            <div className="flex flex-col gap-5">
              <div className="flex flex-col gap-1">
                <span className="font-serif text-[22px] font-semibold tracking-[0.1em] text-ai">
                  {entry.era}
                </span>
                <h3 className="m-0 text-lg font-bold tracking-[0.06em]">
                  {entry.title}
                </h3>
              </div>
              <Image
                src={entry.image.src}
                alt={entry.image.alt}
                width={756}
                height={434}
                sizes="(max-width: 880px) calc(100vw - 88px), 640px"
                // 幅可変でも width/height と aspect-ratio で描画前に領域を確保し CLS を防ぐ。
                style={{ aspectRatio: "756 / 434" }}
                className="block h-auto w-full max-w-[640px] border border-washi-line"
              />
              <p className="m-0 max-w-[38em] text-base leading-[1.9] text-ink-soft">
                {entry.body}
              </p>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
