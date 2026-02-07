"use client";

import { useState } from "react";
import Link from "next/link";
import { Send, CheckCircle } from "lucide-react";
import { supabase } from "@/lib/supabase";

type Category = "general" | "bug" | "feature" | "other";

const CATEGORIES: { value: Category; label: string }[] = [
  { value: "general", label: "一般的なお問い合わせ" },
  { value: "bug", label: "不具合の報告" },
  { value: "feature", label: "機能のリクエスト" },
  { value: "other", label: "その他" },
];

export default function ContactPage(): React.ReactElement {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [category, setCategory] = useState<Category>("general");
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
      <div className="min-h-screen bg-slate-50 flex items-center justify-center px-6">
        <div className="text-center max-w-md">
          <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-slate-800 mb-2">送信完了</h1>
          <p className="text-slate-500 mb-6">
            お問い合わせありがとうございます。<br />内容を確認の上、ご連絡いたします。
          </p>
          <Link
            href="/"
            className="inline-flex items-center gap-1 text-sm text-yellow-600 hover:text-yellow-700 font-medium transition-colors"
          >
            ← MyPromptに戻る
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="max-w-lg mx-auto px-6 py-16">
        <Link href="/" className="text-sm text-slate-400 hover:text-slate-600 transition-colors mb-8 inline-block">
          ← MyPromptに戻る
        </Link>

        <h1 className="text-2xl font-bold text-slate-800 mb-2">お問い合わせ</h1>
        <p className="text-sm text-slate-500 mb-8">
          ご質問・ご要望・不具合の報告など、お気軽にお問い合わせください。
        </p>

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Name */}
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

          {/* Email */}
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

          {/* Category */}
          <div>
            <label htmlFor="contact-category" className="block text-sm font-medium text-slate-700 mb-1.5">
              カテゴリ
            </label>
            <select
              id="contact-category"
              value={category}
              onChange={e => setCategory(e.target.value as Category)}
              className="w-full h-11 px-4 rounded-xl border border-slate-200 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-yellow-400/30 focus:border-yellow-300 transition-all bg-white"
            >
              {CATEGORIES.map(c => (
                <option key={c.value} value={c.value}>{c.label}</option>
              ))}
            </select>
          </div>

          {/* Message */}
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

          {/* Error */}
          {error && (
            <p className="text-sm text-red-500 bg-red-50 px-4 py-2 rounded-lg">{error}</p>
          )}

          {/* Submit */}
          <button
            type="submit"
            disabled={loading}
            className="w-full flex items-center justify-center gap-2 bg-yellow-400 hover:bg-yellow-500 text-slate-800 font-semibold py-3 rounded-xl shadow-md shadow-yellow-200 transition-all hover:scale-[1.01] active:scale-[0.99] text-sm disabled:opacity-50"
          >
            <Send className="w-4 h-4" />
            {loading ? "送信中..." : "送信する"}
          </button>
        </form>

        <p className="text-[10px] text-slate-300 text-center mt-6">
          運営: 株式会社ヒトコト　代表 小南優作
        </p>
      </div>
    </div>
  );
}
