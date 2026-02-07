import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "利用規約 — MyPrompt",
};

export default function TermsPage(): React.ReactElement {
  return (
    <div className="min-h-screen bg-slate-50">
      <div className="max-w-2xl mx-auto px-6 py-16">
        <Link href="/" className="text-sm text-slate-400 hover:text-slate-600 transition-colors mb-8 inline-block">
          ← MyPromptに戻る
        </Link>

        <h1 className="text-2xl font-bold text-slate-800 mb-8">利用規約</h1>
        <p className="text-xs text-slate-400 mb-10">最終更新日: 2026年2月8日</p>

        <div className="prose prose-slate prose-sm max-w-none space-y-8 text-slate-600">
          <section>
            <h2 className="text-lg font-semibold text-slate-700 mb-3">第1条（適用）</h2>
            <p>本規約は、株式会社ヒトコト（以下「当社」）が提供するMyPrompt（以下「本サービス」）の利用条件を定めるものです。利用者は本規約に同意のうえ、本サービスをご利用ください。</p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-slate-700 mb-3">第2条（利用登録）</h2>
            <p>利用者はGitHubアカウント、Googleアカウント、またはメールアドレスの登録を通じて本サービスの利用登録を行うことができます。</p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-slate-700 mb-3">第3条（禁止事項）</h2>
            <p>利用者は以下の行為を行ってはなりません。</p>
            <ul className="list-disc pl-5 space-y-1 mt-2">
              <li>法令または公序良俗に違反する行為</li>
              <li>当社または第三者の知的財産権を侵害する行為</li>
              <li>本サービスの運営を妨害する行為</li>
              <li>他の利用者の情報を不正に収集する行為</li>
              <li>本サービスを商業目的で無断利用する行為</li>
              <li>その他、当社が不適切と判断する行為</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-slate-700 mb-3">第4条（コンテンツの取り扱い）</h2>
            <p>利用者が本サービスに投稿したプロンプトおよびコンテンツの著作権は利用者に帰属します。ただし、公開設定にしたコンテンツは他の利用者が閲覧・コピー・アレンジできるものとします。</p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-slate-700 mb-3">第5条（免責事項）</h2>
            <p>当社は本サービスの完全性、正確性、有用性等について保証するものではありません。本サービスの利用により生じた損害について、当社は一切の責任を負いません。</p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-slate-700 mb-3">第6条（サービスの変更・終了）</h2>
            <p>当社は利用者に事前に通知することなく、本サービスの内容を変更、または提供を中止・終了することができます。</p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-slate-700 mb-3">第7条（規約の変更）</h2>
            <p>当社は必要に応じて本規約を変更できるものとします。変更後の規約は本ページに掲載した時点で効力を生じます。</p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-slate-700 mb-3">第8条（準拠法・管轄）</h2>
            <p>本規約は日本法に準拠し、本サービスに関する紛争は東京地方裁判所を第一審の専属的合意管轄裁判所とします。</p>
          </section>

          <section className="border-t border-slate-200 pt-6">
            <p className="text-xs text-slate-400">
              運営: 株式会社ヒトコト　代表 小南優作
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
