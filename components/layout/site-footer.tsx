import Image from "next/image";

/**
 * 共通フッター。全ページで再利用できるよう切り出した共通コンポーネント。
 */
export function SiteFooter() {
  return (
    <footer className="flex flex-wrap items-center justify-between gap-4 border-t border-washi-line px-5 py-10 sm:px-[clamp(20px,5vw,56px)]">
      <div className="flex items-center gap-3">
        <Image
          src="/images/school-emblem.jpg"
          alt=""
          width={32}
          height={32}
          className="h-8 w-8 object-contain"
        />
        <span className="font-serif text-base tracking-[0.08em]">
          加茂暁星高等学校 同窓会
        </span>
      </div>
      <span className="text-sm tracking-[0.06em] text-ink-muted">
        © 2026 Kamo Gyosei High School Alumni Association
      </span>
    </footer>
  );
}
