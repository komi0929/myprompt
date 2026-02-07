import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "プライバシーポリシー — MyPrompt",
};

export default function PrivacyPage(): React.ReactElement {
  return (
    <div className="min-h-screen bg-slate-50">
      <div className="max-w-2xl mx-auto px-6 py-16">
        <Link href="/" className="text-sm text-slate-400 hover:text-slate-600 transition-colors mb-8 inline-block">
          ← MyPromptに戻る
        </Link>

        <h1 className="text-2xl font-bold text-slate-800 mb-8">プライバシーポリシー</h1>
        <p className="text-xs text-slate-400 mb-10">最終更新日: 2026年2月8日</p>

        <div className="prose prose-slate prose-sm max-w-none space-y-8 text-slate-600">
          <section>
            <h2 className="text-lg font-semibold text-slate-700 mb-3">1. 個人情報の収集</h2>
            <p>当社は、本サービスの提供にあたり、以下の情報を収集する場合があります。</p>
            <ul className="list-disc pl-5 space-y-1 mt-2">
              <li>メールアドレス</li>
              <li>GitHubまたはGoogleアカウントの公開プロフィール情報（ユーザー名、アバター画像）</li>
              <li>本サービスの利用状況に関するデータ</li>
              <li>お問い合わせ時にご提供いただく情報</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-slate-700 mb-3">2. 個人情報の利用目的</h2>
            <p>収集した個人情報は以下の目的で利用します。</p>
            <ul className="list-disc pl-5 space-y-1 mt-2">
              <li>本サービスの提供・運営</li>
              <li>利用者からのお問い合わせへの対応</li>
              <li>サービスの改善および新機能の開発</li>
              <li>重要なお知らせの送信</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-slate-700 mb-3">3. 個人情報の第三者提供</h2>
            <p>当社は、以下の場合を除き、利用者の個人情報を第三者に提供することはありません。</p>
            <ul className="list-disc pl-5 space-y-1 mt-2">
              <li>利用者の同意がある場合</li>
              <li>法令に基づく場合</li>
              <li>人の生命・身体・財産の保護のために必要がある場合</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-slate-700 mb-3">4. 外部サービスの利用</h2>
            <p>本サービスでは以下の外部サービスを利用しています。</p>
            <ul className="list-disc pl-5 space-y-1 mt-2">
              <li><strong>Supabase</strong>: データベース・認証基盤として利用</li>
              <li><strong>GitHub OAuth</strong>: ソーシャルログインとして利用</li>
              <li><strong>Google OAuth</strong>: ソーシャルログインとして利用</li>
              <li><strong>Vercel</strong>: ホスティングサービスとして利用</li>
            </ul>
            <p className="mt-2">各サービスのプライバシーポリシーについては、各社のウェブサイトをご確認ください。</p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-slate-700 mb-3">5. Cookieの使用</h2>
            <p>本サービスでは、認証状態の維持およびサービス改善のためにCookieおよびローカルストレージを使用しています。</p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-slate-700 mb-3">6. セキュリティ</h2>
            <p>当社は、個人情報の漏洩、紛失、改ざんを防止するため、適切なセキュリティ対策を講じます。</p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-slate-700 mb-3">7. 個人情報の開示・訂正・削除</h2>
            <p>利用者は、当社が保有する個人情報の開示、訂正、削除を請求することができます。お問い合わせページよりご連絡ください。</p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-slate-700 mb-3">8. ポリシーの変更</h2>
            <p>当社は、必要に応じて本ポリシーを変更することがあります。変更後のポリシーは本ページに掲載した時点で効力を生じます。</p>
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
