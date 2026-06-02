// トップページ（暫定）。
// 本格的な実装はフェーズ1以降で行う。ここでは技術スタックが正しく
// 組み上がっていることを確認するための最小限の表示にとどめる。
import { Button } from "@/components/ui/button";

export default function Home() {
  return (
    <main className="flex flex-1 flex-col items-center justify-center gap-6 p-8 text-center">
      <h1 className="text-3xl font-bold sm:text-4xl">加茂暁星高等学校 同窓会</h1>
      <p className="max-w-xl text-lg text-muted-foreground">
        当ウェブサイトは現在準備中です。
        卒業生のみなさまに役立つ情報を順次公開してまいります。
      </p>
      {/* shadcn/ui の Button が正しく動作することの確認用 */}
      <Button size="lg">準備中</Button>
    </main>
  );
}
