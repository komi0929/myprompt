import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "ページが見つかりません — マイプロンプト",
  robots: { index: false },
};

export default function NotFound(): React.ReactElement {
  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center px-6">
      <div className="text-center max-w-md">
        <p className="text-6xl font-extrabold text-yellow-400 mb-4">404</p>
        <h1 className="text-xl font-bold text-slate-800 mb-2">
          ページが見つかりません
        </h1>
        <p className="text-sm text-slate-500 mb-8">
          お探しのページは移動または削除された可能性があります。
        </p>
        <Link
          href="/"
          className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-yellow-400 hover:bg-yellow-500 text-slate-800 text-sm font-semibold transition-colors shadow-sm"
        >
          🏠 ホームに戻る
        </Link>
      </div>
    </div>
  );
}
