"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/components/AuthProvider";
import { AuthProvider } from "@/components/AuthProvider";
import { Trash2, RefreshCw, Mail, ExternalLink, Shield } from "lucide-react";

/* ─── Admin Owner ID ─── */
const ADMIN_EMAILS = ["komi0929@gmail.com"]; // 管理者メールアドレス

interface ContactEntry {
  id: string;
  name: string;
  email: string;
  category: string;
  message: string;
  status: string;
  created_at: string;
}

const CATEGORY_LABELS: Record<string, string> = {
  general: "一般",
  bug: "不具合",
  feature: "機能要望",
  other: "その他",
};

const STATUS_COLORS: Record<string, string> = {
  new: "bg-yellow-100 text-yellow-700",
  read: "bg-blue-100 text-blue-700",
  resolved: "bg-green-100 text-green-700",
};

function AdminContent(): React.ReactElement {
  const { user, isLoading, email } = useAuth();
  const [contacts, setContacts] = useState<ContactEntry[]>([]);
  const [fetching, setFetching] = useState(true);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const isAdmin = !isLoading && user && ADMIN_EMAILS.includes(email);

  const fetchContacts = useCallback(async (): Promise<void> => {
    setFetching(true);
    const { data } = await supabase
      .from("contacts")
      .select("*")
      .order("created_at", { ascending: false });
    setContacts((data as ContactEntry[]) ?? []);
    setFetching(false);
  }, []);

  useEffect(() => {
    if (!isAdmin) return;
    let cancelled = false;
    const load = async (): Promise<void> => {
      try {
        setFetching(true);
        const { data } = await supabase
          .from("contacts")
          .select("*")
          .order("created_at", { ascending: false });
        if (!cancelled) {
          setContacts((data as ContactEntry[]) ?? []);
          setFetching(false);
        }
      } catch {
        if (!cancelled) setFetching(false);
      }
    };
    load();
    return () => { cancelled = true; };
  }, [isAdmin]);

  const updateStatus = async (id: string, status: string): Promise<void> => {
    await supabase.from("contacts").update({ status }).eq("id", id);
    setContacts(prev => prev.map(c => c.id === id ? { ...c, status } : c));
  };

  const deleteContact = async (id: string): Promise<void> => {
    await supabase.from("contacts").delete().eq("id", id);
    setContacts(prev => prev.filter(c => c.id !== id));
    if (selectedId === id) setSelectedId(null);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <p className="text-slate-400">読み込み中...</p>
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center px-6">
        <div className="text-center max-w-md">
          <Shield className="w-16 h-16 text-slate-300 mx-auto mb-4" />
          <h1 className="text-xl font-bold text-slate-800 mb-2">アクセス権がありません</h1>
          <p className="text-sm text-slate-500 mb-6">このページは管理者専用です。</p>
          <Link href="/" className="text-sm text-yellow-600 hover:text-yellow-700 font-medium">
            ← マイプロンプトに戻る
          </Link>
        </div>
      </div>
    );
  }

  const selected = contacts.find(c => c.id === selectedId);
  const newCount = contacts.filter(c => c.status === "new").length;

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="max-w-6xl mx-auto px-6 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <Link href="/" className="text-sm text-slate-400 hover:text-slate-600 transition-colors mb-2 inline-block">
              ← マイプロンプトに戻る
            </Link>
            <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
              <Mail className="w-6 h-6 text-yellow-500" />
              お問い合わせ管理
              {newCount > 0 && (
                <span className="text-xs bg-red-500 text-white px-2 py-0.5 rounded-full font-medium">
                  {newCount} 件の新着
                </span>
              )}
            </h1>
          </div>
          <button
            onClick={fetchContacts}
            className="flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-700 bg-white border border-slate-200 px-3 py-2 rounded-lg transition-colors"
          >
            <RefreshCw className={`w-4 h-4 ${fetching ? "animate-spin" : ""}`} />
            更新
          </button>
        </div>

        <div className="flex gap-6">
          {/* List */}
          <div className="w-2/5 space-y-2">
            {contacts.length === 0 && !fetching && (
              <div className="text-center py-16 text-slate-400 text-sm">
                お問い合わせはまだありません
              </div>
            )}
            {contacts.map(c => (
              <button
                key={c.id}
                onClick={() => {
                  setSelectedId(c.id);
                  if (c.status === "new") updateStatus(c.id, "read");
                }}
                className={`w-full text-left p-4 rounded-xl border transition-all ${
                  selectedId === c.id
                    ? "bg-white border-yellow-300 shadow-md"
                    : "bg-white border-slate-200 hover:border-slate-300 hover:shadow-sm"
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="font-semibold text-sm text-slate-700 truncate">{c.name}</span>
                  <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${STATUS_COLORS[c.status] ?? "bg-slate-100 text-slate-500"}`}>
                    {c.status === "new" ? "新着" : c.status === "read" ? "確認済" : "対応済"}
                  </span>
                </div>
                <p className="text-xs text-slate-400 truncate">{c.email}</p>
                <div className="flex items-center justify-between mt-2">
                  <span className="text-[10px] text-slate-300">
                    {CATEGORY_LABELS[c.category] ?? c.category} · {new Date(c.created_at).toLocaleDateString("ja-JP")}
                  </span>
                </div>
                <p className="text-xs text-slate-500 mt-1.5 line-clamp-2">{c.message}</p>
              </button>
            ))}
          </div>

          {/* Detail */}
          <div className="flex-1">
            {selected ? (
              <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h2 className="text-lg font-bold text-slate-800">{selected.name}</h2>
                    <a
                      href={`mailto:${selected.email}`}
                      className="text-sm text-yellow-600 hover:text-yellow-700 flex items-center gap-1"
                    >
                      {selected.email} <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>
                  <button
                    onClick={() => deleteContact(selected.id)}
                    className="text-slate-300 hover:text-red-500 transition-colors p-1"
                    title="削除"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>

                <div className="flex items-center gap-2 mb-4">
                  <span className="text-xs bg-slate-100 text-slate-500 px-2 py-1 rounded-lg">
                    {CATEGORY_LABELS[selected.category] ?? selected.category}
                  </span>
                  <span className="text-xs text-slate-300">
                    {new Date(selected.created_at).toLocaleString("ja-JP")}
                  </span>
                </div>

                <div className="bg-slate-50 rounded-lg p-4 mb-6">
                  <p className="text-sm text-slate-600 whitespace-pre-wrap leading-relaxed">{selected.message}</p>
                </div>

                {/* Status buttons */}
                <div className="flex gap-2">
                  {["new", "read", "resolved"].map(s => (
                    <button
                      key={s}
                      onClick={() => updateStatus(selected.id, s)}
                      className={`text-xs px-3 py-1.5 rounded-lg border transition-all ${
                        selected.status === s
                          ? STATUS_COLORS[s] + " border-transparent font-semibold"
                          : "bg-white border-slate-200 text-slate-400 hover:bg-slate-50"
                      }`}
                    >
                      {s === "new" ? "新着" : s === "read" ? "確認済" : "対応済"}
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-center h-64 text-slate-300 text-sm">
                お問い合わせを選択してください
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function AdminContactsPage(): React.ReactElement {
  return (
    <AuthProvider>
      <AdminContent />
    </AuthProvider>
  );
}
