// Firebase（v10 系）の初期化ファイル。
// v9 以降の「モジュラー API」だけを使う（必要な関数を個別に import する書き方）。
// クライアント側で使うため、設定値はすべて NEXT_PUBLIC_ 環境変数から読み込む。
import { initializeApp, getApps, getApp, type FirebaseApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

// .env.local に設定した値を読み込む。
// NEXT_PUBLIC_ が付いた変数はブラウザにも公開される（Firebase の公開設定は公開して問題ない）。
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

// Next.js の開発中は再読み込みでこのファイルが複数回評価されることがある。
// getApps() で既存のアプリを確認し、二重初期化を防ぐ。
const app: FirebaseApp = getApps().length ? getApp() : initializeApp(firebaseConfig);

// 認証（Google ログインに使用）
export const auth = getAuth(app);

// Google ログイン用のプロバイダ。signInWithPopup などに渡して使う。
export const googleProvider = new GoogleAuthProvider();

// Firestore（会員プロフィールなどのデータ保存に使用）
export const db = getFirestore(app);

export { app };
