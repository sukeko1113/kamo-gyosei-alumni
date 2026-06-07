// Firebase Admin SDK（サーバー専用）の初期化ファイル。
// サービスアカウントで認証し、Firestore のセキュリティルールをバイパスして
// サーバー側から安全にデータを読み書きするために使う。
//
// ★ 重要 ★
// このファイルはサーバーでのみ動かす。万一クライアントから import された場合に
// ビルドで気付けるよう "server-only" を読み込んでおく。
import "server-only";

import {
  initializeApp,
  getApps,
  getApp,
  cert,
  type App,
} from "firebase-admin/app";
import { getFirestore, type Firestore } from "firebase-admin/firestore";

// サービスアカウントの認証情報は環境変数から読み込む（秘密情報なので絶対に直書きしない）。
// - FIREBASE_ADMIN_PROJECT_ID  : プロジェクト ID
// - FIREBASE_ADMIN_CLIENT_EMAIL : サービスアカウントのメールアドレス
// - FIREBASE_ADMIN_PRIVATE_KEY  : サービスアカウントの秘密鍵
//   （.env では改行を \n に置き換えて1行で保存するため、ここで実際の改行へ戻す）
function getServiceAccount() {
  const projectId = process.env.FIREBASE_ADMIN_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_ADMIN_CLIENT_EMAIL;
  const privateKey = process.env.FIREBASE_ADMIN_PRIVATE_KEY?.replace(
    /\\n/g,
    "\n"
  );

  if (!projectId || !clientEmail || !privateKey) {
    throw new Error(
      "Firebase Admin の環境変数が未設定です。FIREBASE_ADMIN_PROJECT_ID / " +
        "FIREBASE_ADMIN_CLIENT_EMAIL / FIREBASE_ADMIN_PRIVATE_KEY を設定してください。"
    );
  }

  return { projectId, clientEmail, privateKey };
}

// Next.js の開発中は再読み込みで複数回評価されることがあるため、
// getApps() で既存アプリを確認して二重初期化を防ぐ。
function getAdminApp(): App {
  if (getApps().length) return getApp();
  const { projectId, clientEmail, privateKey } = getServiceAccount();
  return initializeApp({
    credential: cert({ projectId, clientEmail, privateKey }),
  });
}

// Firestore（Admin）。遅延初期化にして、環境変数が無い時に
// import しただけでエラーにならないようにする。
export function getAdminDb(): Firestore {
  return getFirestore(getAdminApp());
}
