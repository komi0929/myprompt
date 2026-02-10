"use client";

import { useState } from "react";
import { Sidebar } from "@/components/Sidebar";
import { PromptStoreProvider } from "@/lib/prompt-store";
import LoginModal from "@/components/LoginModal";
import { Send, CheckCircle } from "lucide-react";
import { supabase } from "@/lib/supabase";

type Tab = "terms" | "privacy" | "contact";
type ContactCategory = "general" | "bug" | "feature" | "other";

const TABS: { id: Tab; label: string }[] = [
  { id: "terms", label: "利用規約" },
  { id: "privacy", label: "プライバシー" },
  { id: "contact", label: "お問い合わせ" },
];

const CATEGORIES: { value: ContactCategory; label: string }[] = [
  { value: "general", label: "一般的なお問い合わせ" },
  { value: "bug", label: "不具合の報告" },
  { value: "feature", label: "機能のリクエスト" },
  { value: "other", label: "その他" },
];

function LegalContent(): React.ReactElement {
  const [activeTab, setActiveTab] = useState<Tab>("terms");

  return (
    <div className="flex h-screen w-full bg-slate-50 overflow-hidden font-sans">
      {/* Sidebar */}
      <Sidebar className="hidden md:flex shrink-0 z-30" />

      {/* Main Content */}
      <main className="flex-1 flex flex-col h-full overflow-hidden">
        <div className="flex-1 overflow-y-auto">
          <div className="max-w-3xl mx-auto px-6 py-12">
            {/* Title */}
            <h1 className="text-2xl font-bold text-slate-800 text-center mb-6">
              マイプロンプト 利用規約
            </h1>

            {/* Tabs */}
            <div className="flex items-center justify-center gap-1 mb-8">
              {TABS.map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                    activeTab === tab.id
                      ? "bg-slate-800 text-white shadow-sm"
                      : "text-slate-500 hover:text-slate-700 hover:bg-slate-100"
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Content Card */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-8 md:p-10">
              {activeTab === "terms" && <TermsContent />}
              {activeTab === "privacy" && <PrivacyContent />}
              {activeTab === "contact" && <ContactContent />}
            </div>

            {/* Footer Credit */}
            <div className="mt-6 flex flex-col items-center gap-1">
              <p className="text-[10px] text-slate-300">
                © {new Date().getFullYear()} 株式会社ヒトコト
              </p>
              <p className="text-[10px] text-slate-300">
                produced by{" "}
                <a
                  href="https://mykanban.hitokoto.tech/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-yellow-500 hover:text-yellow-600 font-medium transition-colors"
                >
                  komi
                </a>
              </p>
            </div>
          </div>
        </div>
      </main>

      <LoginModal />
    </div>
  );
}

/* ────────────────────────── Terms ────────────────────────── */
function TermsContent(): React.ReactElement {
  return (
    <div className="space-y-8 text-slate-600 text-sm leading-relaxed">
      <h2 className="text-xl font-bold text-slate-800">利用規約</h2>
      <p>
        本利用規約（以下「本規約」といいます。）は、株式会社ヒトコト（以下「当社」といいます。）が
        マイプロンプトおよび関連するアプリケーション上で提供するサービスの利用条件を定めるものです。
        本サービスのユーザー（以下「お客様」といいます。）は、本規約に同意したうえで、本サービスをご利用いただきます。
      </p>

      <section>
        <h3 className="text-base font-bold text-slate-800 mb-3">第1条 アカウントおよび利用資格</h3>
        <div className="space-y-3 pl-1">
          <p><strong className="text-slate-700">1.1 アカウント作成:</strong> 当社が認めた外部IDプロバイダーを通じてアカウントを作成することで、特定の機能をご利用いただけます。認証情報の管理はお客様ご自身の責任で行ってください。</p>
          <p><strong className="text-slate-700">1.2 アカウントの停止:</strong> 過去に本規約違反等によりアカウントが停止または解約されたことがあるお客様については、当社は登録を拒否または既存アカウントの解約を行う権利を留保します。</p>
          <p><strong className="text-slate-700">1.3 情報の正確性:</strong> お客様は、アカウント情報を正確かつ最新の状態に維持することに同意するものとします。</p>
        </div>
      </section>

      <section>
        <h3 className="text-base font-bold text-slate-800 mb-3">第2条 サービスの内容</h3>
        <div className="space-y-3 pl-1">
          <p><strong className="text-slate-700">2.1 プロンプト管理:</strong> AIプロンプトの保存、整理、共有を目的としたサービスを提供します。</p>
          <p><strong className="text-slate-700">2.2 コンテンツの所有権:</strong> お客様が本サービスに投稿したプロンプトおよびコンテンツの著作権はお客様に帰属します。ただし、公開設定にしたコンテンツは他の利用者が閲覧・コピー・アレンジできるものとします。</p>
        </div>
      </section>

      <section>
        <h3 className="text-base font-bold text-slate-800 mb-3">第3条 禁止事項</h3>
        <p>お客様は以下の行為を行ってはなりません。</p>
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
        <h3 className="text-base font-bold text-slate-800 mb-3">第4条 免責事項</h3>
        <p>当社は本サービスの完全性、正確性、有用性等について保証するものではありません。本サービスの利用により生じた損害について、当社は一切の責任を負いません。</p>
      </section>

      <section>
        <h3 className="text-base font-bold text-slate-800 mb-3">第5条 サービスの変更・終了</h3>
        <p>当社はお客様に事前に通知することなく、本サービスの内容を変更、または提供を中止・終了することができます。</p>
      </section>

      <section>
        <h3 className="text-base font-bold text-slate-800 mb-3">第6条 規約の変更</h3>
        <p>当社は必要に応じて本規約を変更できるものとします。変更後の規約は本ページに掲載した時点で効力を生じます。</p>
      </section>

      <section>
        <h3 className="text-base font-bold text-slate-800 mb-3">第7条 準拠法・管轄</h3>
        <p>本規約は日本法に準拠し、本サービスに関する紛争は東京地方裁判所を第一審の専属的合意管轄裁判所とします。</p>
      </section>

      <p className="text-xs text-slate-400 pt-4 border-t border-slate-100">最終更新日: 2026年2月8日</p>
    </div>
  );
}

/* ────────────────────────── Privacy ────────────────────────── */
function PrivacyContent(): React.ReactElement {
  return (
    <div className="space-y-8 text-slate-600 text-sm leading-relaxed">
      <h2 className="text-xl font-bold text-slate-800">プライバシーポリシー</h2>
      <p>
        株式会社ヒトコト（以下「当社」）は、お客様の個人情報の保護を重視し、以下の方針に基づき適切に取り扱います。
      </p>

      <section>
        <h3 className="text-base font-bold text-slate-800 mb-3">1. 個人情報の収集</h3>
        <p>当社は、本サービスの提供にあたり、以下の情報を収集する場合があります。</p>
        <ul className="list-disc pl-5 space-y-1 mt-2">
          <li>メールアドレス</li>
          <li>GitHubまたはGoogleアカウントの公開プロフィール情報（ユーザー名、アバター画像）</li>
          <li>本サービスの利用状況に関するデータ</li>
          <li>お問い合わせ時にご提供いただく情報</li>
        </ul>
      </section>

      <section>
        <h3 className="text-base font-bold text-slate-800 mb-3">2. 個人情報の利用目的</h3>
        <p>収集した個人情報は以下の目的で利用します。</p>
        <ul className="list-disc pl-5 space-y-1 mt-2">
          <li>本サービスの提供・運営</li>
          <li>お客様からのお問い合わせへの対応</li>
          <li>サービスの改善および新機能の開発</li>
          <li>重要なお知らせの送信</li>
        </ul>
      </section>

      <section>
        <h3 className="text-base font-bold text-slate-800 mb-3">3. 個人情報の第三者提供</h3>
        <p>当社は、以下の場合を除き、お客様の個人情報を第三者に提供することはありません。</p>
        <ul className="list-disc pl-5 space-y-1 mt-2">
          <li>お客様の同意がある場合</li>
          <li>法令に基づく場合</li>
          <li>人の生命・身体・財産の保護のために必要がある場合</li>
        </ul>
      </section>

      <section>
        <h3 className="text-base font-bold text-slate-800 mb-3">4. 外部サービスの利用</h3>
        <p>本サービスでは以下の外部サービスを利用しています。</p>
        <ul className="list-disc pl-5 space-y-1 mt-2">
          <li><strong>Supabase</strong> — データベース・認証基盤</li>
          <li><strong>GitHub OAuth</strong> — ソーシャルログイン</li>
          <li><strong>Google OAuth</strong> — ソーシャルログイン</li>
          <li><strong>Vercel</strong> — ホスティングサービス</li>
        </ul>
        <p className="mt-2">各サービスのプライバシーポリシーについては、各社のウェブサイトをご確認ください。</p>
      </section>

      <section>
        <h3 className="text-base font-bold text-slate-800 mb-3">5. Cookieの使用</h3>
        <p>本サービスでは、認証状態の維持およびサービス改善のためにCookieおよびローカルストレージを使用しています。</p>
      </section>

      <section>
        <h3 className="text-base font-bold text-slate-800 mb-3">6. セキュリティ</h3>
        <p>当社は、個人情報の漏洩、紛失、改ざんを防止するため、適切なセキュリティ対策を講じます。</p>
      </section>

      <section>
        <h3 className="text-base font-bold text-slate-800 mb-3">7. 個人情報の開示・訂正・削除</h3>
        <p>お客様は、当社が保有する個人情報の開示、訂正、削除を請求することができます。お問い合わせタブよりご連絡ください。</p>
      </section>

      <section>
        <h3 className="text-base font-bold text-slate-800 mb-3">8. ポリシーの変更</h3>
        <p>当社は、必要に応じて本ポリシーを変更することがあります。変更後のポリシーは本ページに掲載した時点で効力を生じます。</p>
      </section>

      <p className="text-xs text-slate-400 pt-4 border-t border-slate-100">最終更新日: 2026年2月8日</p>
    </div>
  );
}

/* ────────────────────────── Contact ────────────────────────── */
function ContactContent(): React.ReactElement {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [category, setCategory] = useState<ContactCategory>("general");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent): Promise<void> => {
    e.preventDefault();
    if (!name.trim() || !email.trim() || !message.trim()) {
      setError("すべての項目を入力してください");
      return;
    }
    setLoading(true);
    setError("");

    const { error: dbError } = await supabase.from("contacts").insert({
      name: name.trim(),
      email: email.trim(),
      category,
      message: message.trim(),
    });

    setLoading(false);
    if (dbError) {
      setError("送信に失敗しました。しばらく後にお試しください。");
      return;
    }
    setSent(true);
  };

  if (sent) {
    return (
      <div className="text-center py-12">
        <CheckCircle className="w-14 h-14 text-green-500 mx-auto mb-4" />
        <h2 className="text-xl font-bold text-slate-800 mb-2">送信完了</h2>
        <p className="text-sm text-slate-500">
          お問い合わせありがとうございます。<br />内容を確認の上、ご連絡いたします。
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-slate-800 mb-1">お問い合わせ</h2>
        <p className="text-sm text-slate-500">
          ご質問・ご要望・不具合の報告など、お気軽にお問い合わせください。
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        <div>
          <label htmlFor="contact-name" className="block text-sm font-medium text-slate-700 mb-1.5">
            お名前 <span className="text-red-400">*</span>
          </label>
          <input
            id="contact-name"
            type="text"
            value={name}
            onChange={e => setName(e.target.value)}
            placeholder="山田太郎"
            maxLength={100}
            className="w-full h-11 px-4 rounded-xl border border-slate-200 text-sm placeholder:text-slate-300 focus:outline-none focus:ring-2 focus:ring-yellow-400/30 focus:border-yellow-300 transition-all"
          />
        </div>

        <div>
          <label htmlFor="contact-email" className="block text-sm font-medium text-slate-700 mb-1.5">
            メールアドレス <span className="text-red-400">*</span>
          </label>
          <input
            id="contact-email"
            type="email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            placeholder="you@example.com"
            maxLength={254}
            className="w-full h-11 px-4 rounded-xl border border-slate-200 text-sm placeholder:text-slate-300 focus:outline-none focus:ring-2 focus:ring-yellow-400/30 focus:border-yellow-300 transition-all"
          />
        </div>

        <div>
          <label htmlFor="contact-category" className="block text-sm font-medium text-slate-700 mb-1.5">
            カテゴリ
          </label>
          <select
            id="contact-category"
            value={category}
            onChange={e => setCategory(e.target.value as ContactCategory)}
            className="w-full h-11 px-4 rounded-xl border border-slate-200 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-yellow-400/30 focus:border-yellow-300 transition-all bg-white"
          >
            {CATEGORIES.map(c => (
              <option key={c.value} value={c.value}>{c.label}</option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor="contact-message" className="block text-sm font-medium text-slate-700 mb-1.5">
            お問い合わせ内容 <span className="text-red-400">*</span>
          </label>
          <textarea
            id="contact-message"
            value={message}
            onChange={e => setMessage(e.target.value)}
            placeholder="お問い合わせ内容をご記入ください..."
            rows={6}
            maxLength={2000}
            className="w-full px-4 py-3 rounded-xl border border-slate-200 text-sm placeholder:text-slate-300 focus:outline-none focus:ring-2 focus:ring-yellow-400/30 focus:border-yellow-300 transition-all resize-none"
          />
          <p className="text-[10px] text-slate-300 text-right mt-1">{message.length} / 2000</p>
        </div>

        {error && (
          <p className="text-sm text-red-500 bg-red-50 px-4 py-2 rounded-lg">{error}</p>
        )}

        <button
          type="submit"
          disabled={loading}
          className="w-full flex items-center justify-center gap-2 bg-yellow-400 hover:bg-yellow-500 text-slate-800 font-semibold py-3 rounded-xl shadow-md shadow-yellow-200 transition-all hover:scale-[1.01] active:scale-[0.99] text-sm disabled:opacity-50"
        >
          <Send className="w-4 h-4" />
          {loading ? "送信中..." : "送信する"}
        </button>
      </form>
    </div>
  );
}

export default function LegalPage(): React.ReactElement {
  return (
    <PromptStoreProvider>
      <LegalContent />
    </PromptStoreProvider>
  );
}
