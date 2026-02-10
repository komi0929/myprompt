"use client";

import Link from "next/link";

export default function Error({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}): React.ReactElement {
  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center px-6">
      <div className="text-center max-w-md">
        <p className="text-6xl font-extrabold text-red-400 mb-4">500</p>
        <h1 className="text-xl font-bold text-slate-800 mb-2">
          エラーが発生しました
        </h1>
        <p className="text-sm text-slate-500 mb-8">
          しばらく時間をおいてから再度お試しください。
        </p>
        <div className="flex items-center justify-center gap-3">
          <button
            onClick={reset}
            className="px-6 py-3 rounded-xl bg-yellow-400 hover:bg-yellow-500 text-slate-800 text-sm font-semibold transition-colors shadow-sm"
          >
            🔄 再試行
          </button>
          <Link
            href="/"
            className="px-6 py-3 rounded-xl border border-slate-200 text-slate-600 text-sm font-medium hover:bg-slate-100 transition-colors"
          >
            🏠 ホームに戻る
          </Link>
        </div>
      </div>
    </div>
  );
}
