import Link from "next/link";

type MemberCard = {
  title: string;
  body: string;
  cta: string;
  href: string;
};

// 会員導線の3カード。href は既存の各機能ページに対応させている。
const CARDS: MemberCard[] = [
  {
    title: "卒業生名簿",
    body: "名簿の閲覧・住所変更の届け出はこちらから。",
    cta: "手続きへ →",
    href: "/directory",
  },
  {
    title: "寄付のお願い",
    body: "母校の教育環境整備のため、ご支援をお願いしています。",
    cta: "詳しく見る →",
    href: "/donate",
  },
  {
    title: "署名のご協力",
    body: "現在募集中の署名活動へのご協力をお願いします。",
    cta: "署名する →",
    href: "/petition",
  },
];

/**
 * 会員導線：卒業生名簿 / 寄付 / 署名 の3カード。
 */
export function MemberLinks() {
  return (
    <section
      id="members"
      className="mx-auto max-w-[1080px] px-6 py-[clamp(48px,6vw,80px)]"
    >
      <h2 className="m-0 mb-3 font-serif text-[clamp(24px,3.5vw,32px)] font-semibold tracking-[0.2em]">
        会員の方へ
      </h2>
      <p className="m-0 mb-10 text-base tracking-[0.1em] text-ink-muted">
        FOR MEMBERS
      </p>

      <div className="grid grid-cols-[repeat(auto-fit,minmax(260px,1fr))] gap-6">
        {CARDS.map((card) => (
          <Link
            key={card.title}
            href={card.href}
            className="flex min-h-[44px] flex-col gap-4 border border-washi-line bg-washi-card p-8 text-sumi no-underline transition-colors hover:border-ai"
          >
            <span className="font-serif text-[22px] font-semibold tracking-[0.12em]">
              {card.title}
            </span>
            <span className="text-base leading-[1.8] text-ink-soft">
              {card.body}
            </span>
            <span className="mt-auto text-base font-medium text-ai">
              {card.cta}
            </span>
          </Link>
        ))}
      </div>
    </section>
  );
}
