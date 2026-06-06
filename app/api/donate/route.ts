// 寄付（一回きり）の Stripe Checkout セッションを作成する Route Handler。
// クライアントから寄付金額を受け取り、サーバー側でシークレットキーを使って
// Checkout セッションを作成し、その決済 URL を返す。
// カード情報はこのサイトでは一切扱わず、Stripe のホスト型決済ページに任せる。
import { NextResponse } from "next/server";
import Stripe from "stripe";

// 寄付金額の許容範囲（円）。クライアントの値は信用せず、サーバー側で必ず検証する。
const MIN_AMOUNT = 100; // 下限: 100円
const MAX_AMOUNT = 1_000_000; // 上限: 1,000,000円

export async function POST(request: Request) {
  // シークレットキーはサーバー専用。未設定なら 500 を返し、原因が分かるログを出す。
  const secretKey = process.env.STRIPE_SECRET_KEY;
  if (!secretKey) {
    console.error("STRIPE_SECRET_KEY が設定されていません。");
    return NextResponse.json(
      { error: "決済の設定が未完了です。時間をおいて再度お試しください。" },
      { status: 500 }
    );
  }

  // リクエストボディ（JSON）から寄付金額を取り出す。壊れた JSON は 400 にする。
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: "リクエストの形式が正しくありません。" },
      { status: 400 }
    );
  }

  // amount を取り出して検証する。
  const amount = (body as { amount?: unknown })?.amount;

  // 数値であること・整数であること・範囲内であることをすべて確認する。
  // （JPY は zero-decimal currency なので「円」がそのまま最小単位。100倍しない）
  if (
    typeof amount !== "number" ||
    !Number.isInteger(amount) ||
    amount < MIN_AMOUNT ||
    amount > MAX_AMOUNT
  ) {
    return NextResponse.json(
      {
        error: `寄付金額は ${MIN_AMOUNT.toLocaleString()}円〜${MAX_AMOUNT.toLocaleString()}円の範囲の整数で指定してください。`,
      },
      { status: 400 }
    );
  }

  // success_url / cancel_url はリクエスト元のオリジンを基準に組み立てる。
  const origin = request.headers.get("origin") ?? new URL(request.url).origin;

  // Stripe クライアントを生成する（apiVersion は SDK 既定のピン留めを使用）。
  const stripe = new Stripe(secretKey);

  try {
    // 一回きりの決済（mode: "payment"）の Checkout セッションを作成する。
    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      line_items: [
        {
          price_data: {
            currency: "jpy",
            unit_amount: amount, // JPY は円がそのまま最小単位
            product_data: {
              name: "加茂暁星高等学校同窓会への寄付",
            },
          },
          quantity: 1,
        },
      ],
      success_url: `${origin}/donate/success`,
      cancel_url: `${origin}/donate`,
    });

    // 決済ページの URL を返す。クライアントはここへリダイレクトする。
    if (!session.url) {
      throw new Error("Checkout セッションの URL が取得できませんでした。");
    }
    return NextResponse.json({ url: session.url });
  } catch (error) {
    console.error("Checkout セッションの作成に失敗しました:", error);
    return NextResponse.json(
      { error: "決済ページの作成に失敗しました。時間をおいて再度お試しください。" },
      { status: 500 }
    );
  }
}
