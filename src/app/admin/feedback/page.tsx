"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/components/AuthProvider";
import { AuthProvider } from "@/components/AuthProvider";
import {
  Trash2,
  RefreshCw,
  Shield,
  CheckCircle2,
  Clock,
  Circle,
  XCircle,
  MessageSquarePlus,
  Lightbulb,
  Bug,
  ThumbsUp,
  History,
  Plus,
} from "lucide-react";
import { cn } from "@/lib/utils";

/* ─── Admin Owner ID ─── */
const ADMIN_EMAILS = ["komi0929@gmail.com"];

/* ─── Types ─── */
interface FeedbackItem {
  id: string;
  type: "feature" | "bug";
  title: string;
  description: string;
  screenshot_url: string | null;
  status: "open" | "in_progress" | "done" | "rejected";
  like_count: number;
  author_name: string;
  author_id: string | null;
  created_at: string;
}

interface ChangelogItem {
  id: string;
  version: string;
  title: string;
  description: string;
  type: "feature" | "improvement" | "bugfix";
  created_at: string;
}

const STATUS_CONFIG = {
  open: { label: "受付中", icon: Circle, color: "bg-blue-100 text-blue-700" },
  in_progress: { label: "対応中", icon: Clock, color: "bg-yellow-100 text-yellow-700" },
  done: { label: "完了", icon: CheckCircle2, color: "bg-green-100 text-green-700" },
  rejected: { label: "見送り", icon: XCircle, color: "bg-slate-100 text-slate-500" },
};

/* ═══════════════════════════════════════════ */
/*  Admin Feedback Management                  */
/* ═══════════════════════════════════════════ */
function AdminContent(): React.ReactElement {
  const { user, isLoading, email } = useAuth();
  const [activeTab, setActiveTab] = useState<"feedback" | "changelog">("feedback");
  const [feedbackItems, setFeedbackItems] = useState<FeedbackItem[]>([]);
  const [changelog, setChangelog] = useState<ChangelogItem[]>([]);
  const [fetching, setFetching] = useState(true);
  const [selectedFeedbackId, setSelectedFeedbackId] = useState<string | null>(null);

  // Changelog form
  const [showChangelogForm, setShowChangelogForm] = useState(false);
  const [clVersion, setClVersion] = useState("");
  const [clTitle, setClTitle] = useState("");
  const [clDesc, setClDesc] = useState("");
  const [clType, setClType] = useState<"feature" | "improvement" | "bugfix">("improvement");

  const isAdmin = !isLoading && user && ADMIN_EMAILS.includes(email);

  const fetchAll = useCallback(async (): Promise<void> => {
    setFetching(true);
    const [{ data: fb }, { data: cl }] = await Promise.all([
      supabase.from("feedback").select("*").order("created_at", { ascending: false }),
      supabase.from("changelog").select("*").order("created_at", { ascending: false }),
    ]);
    setFeedbackItems((fb as FeedbackItem[]) ?? []);
    setChangelog((cl as ChangelogItem[]) ?? []);
    setFetching(false);
  }, []);

  useEffect(() => {
    if (!isAdmin) return;
    fetchAll();
  }, [isAdmin, fetchAll]);

  const updateFeedbackStatus = async (id: string, status: string): Promise<void> => {
    const prev = feedbackItems.find(f => f.id === id)?.status;
    setFeedbackItems(p => p.map(f => f.id === id ? { ...f, status: status as FeedbackItem["status"] } : f));
    const { error } = await supabase.from("feedback").update({ status, updated_at: new Date().toISOString() }).eq("id", id);
    if (error && prev) {
      setFeedbackItems(p => p.map(f => f.id === id ? { ...f, status: prev } : f));
      console.error("updateFeedbackStatus failed:", error.message);
    }
  };

  const deleteFeedback = async (id: string): Promise<void> => {
    const backup = feedbackItems.find(f => f.id === id);
    setFeedbackItems(prev => prev.filter(f => f.id !== id));
    if (selectedFeedbackId === id) setSelectedFeedbackId(null);
    const { error } = await supabase.from("feedback").delete().eq("id", id);
    if (error && backup) {
      setFeedbackItems(prev => [...prev, backup]);
      console.error("deleteFeedback failed:", error.message);
    }
  };

  const addChangelog = async (): Promise<void> => {
    if (!clTitle.trim()) return;
    const { error } = await supabase.from("changelog").insert({
      version: clVersion.trim(),
      title: clTitle.trim(),
      description: clDesc.trim(),
      type: clType,
    });
    if (error) {
      console.error("addChangelog failed:", error.message);
      return;
    }
    setClVersion("");
    setClTitle("");
    setClDesc("");
    setShowChangelogForm(false);
    await fetchAll();
  };

  const deleteChangelog = async (id: string): Promise<void> => {
    const backup = changelog.find(c => c.id === id);
    setChangelog(prev => prev.filter(c => c.id !== id));
    const { error } = await supabase.from("changelog").delete().eq("id", id);
    if (error && backup) {
      setChangelog(prev => [...prev, backup]);
      console.error("deleteChangelog failed:", error.message);
    }
  };

  /* ─── Guard ─── */
  if (isLoading) {
    return <div className="min-h-screen bg-slate-50 flex items-center justify-center"><p className="text-slate-400">読み込み中...</p></div>;
  }
  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center px-6">
        <div className="text-center max-w-md">
          <Shield className="w-16 h-16 text-slate-300 mx-auto mb-4" />
          <h1 className="text-xl font-bold text-slate-800 mb-2">アクセス権がありません</h1>
          <p className="text-sm text-slate-500 mb-6">このページは管理者専用です。</p>
          <Link href="/" className="text-sm text-yellow-600 hover:text-yellow-700 font-medium">← マイプロンプトに戻る</Link>
        </div>
      </div>
    );
  }

  const selected = feedbackItems.find(f => f.id === selectedFeedbackId);
  const openCount = feedbackItems.filter(f => f.status === "open").length;

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="max-w-6xl mx-auto px-6 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <Link href="/" className="text-sm text-slate-400 hover:text-slate-600 transition-colors mb-2 inline-block">
              ← マイプロンプトに戻る
            </Link>
            <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
              <MessageSquarePlus className="w-6 h-6 text-yellow-500" />
              フィードバック管理
              {openCount > 0 && (
                <span className="text-xs bg-red-500 text-white px-2 py-0.5 rounded-full font-medium">
                  {openCount} 件の新着
                </span>
              )}
            </h1>
          </div>
          <button
            onClick={fetchAll}
            className="flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-700 bg-white border border-slate-200 px-3 py-2 rounded-lg transition-colors"
          >
            <RefreshCw className={`w-4 h-4 ${fetching ? "animate-spin" : ""}`} />
            更新
          </button>
        </div>

        {/* Tabs */}
        <div className="flex gap-4 mb-6 border-b border-slate-200">
          <button
            onClick={() => setActiveTab("feedback")}
            className={cn(
              "flex items-center gap-1.5 px-1 pb-2 text-sm font-medium border-b-2 transition-colors",
              activeTab === "feedback" ? "border-yellow-400 text-yellow-700" : "border-transparent text-slate-400 hover:text-slate-600"
            )}
          >
            <ThumbsUp className="w-4 h-4" />
            フィードバック ({feedbackItems.length})
          </button>
          <button
            onClick={() => setActiveTab("changelog")}
            className={cn(
              "flex items-center gap-1.5 px-1 pb-2 text-sm font-medium border-b-2 transition-colors",
              activeTab === "changelog" ? "border-yellow-400 text-yellow-700" : "border-transparent text-slate-400 hover:text-slate-600"
            )}
          >
            <History className="w-4 h-4" />
            改善履歴 ({changelog.length})
          </button>
        </div>

        {/* ─── Feedback Tab ─── */}
        {activeTab === "feedback" && (
          <div className="flex gap-6">
            {/* List */}
            <div className="w-2/5 space-y-2 max-h-[calc(100vh-220px)] overflow-y-auto">
              {feedbackItems.length === 0 && !fetching && (
                <div className="text-center py-16 text-slate-400 text-sm">フィードバックはまだありません</div>
              )}
              {feedbackItems.map(f => {
                const st = STATUS_CONFIG[f.status];
                return (
                  <button
                    key={f.id}
                    onClick={() => setSelectedFeedbackId(f.id)}
                    className={cn(
                      "w-full text-left p-4 rounded-xl border transition-all",
                      selectedFeedbackId === f.id
                        ? "bg-white border-yellow-300 shadow-md"
                        : "bg-white border-slate-200 hover:border-slate-300 hover:shadow-sm"
                    )}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center gap-1.5">
                        {f.type === "feature" ? (
                          <Lightbulb className="w-3.5 h-3.5 text-yellow-500" />
                        ) : (
                          <Bug className="w-3.5 h-3.5 text-red-500" />
                        )}
                        <span className="font-semibold text-sm text-slate-700 truncate">{f.title}</span>
                      </div>
                      <span className={cn("text-[10px] px-2 py-0.5 rounded-full font-medium", st.color)}>
                        {st.label}
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 truncate mt-1">{f.description || "（説明なし）"}</p>
                    <div className="flex items-center justify-between mt-2">
                      <span className="text-[10px] text-slate-400">
                        {f.author_name} · {new Date(f.created_at).toLocaleDateString("ja-JP")}
                      </span>
                      <span className="text-[10px] text-yellow-600 font-medium flex items-center gap-0.5">
                        <ThumbsUp className="w-2.5 h-2.5" /> {f.like_count}
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Detail */}
            <div className="flex-1">
              {selected ? (
                <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <div className="flex items-center gap-2 mb-2">
                        {selected.type === "feature" ? (
                          <span className="text-[10px] px-2 py-0.5 rounded-full bg-yellow-50 text-yellow-700 border border-yellow-200 font-medium">💡 改善提案</span>
                        ) : (
                          <span className="text-[10px] px-2 py-0.5 rounded-full bg-red-50 text-red-600 border border-red-200 font-medium">🐛 バグ報告</span>
                        )}
                        <span className="text-[10px] text-yellow-600 font-medium flex items-center gap-0.5">
                          <ThumbsUp className="w-2.5 h-2.5" /> {selected.like_count} いいね！
                        </span>
                      </div>
                      <h2 className="text-lg font-bold text-slate-800">{selected.title}</h2>
                      <p className="text-xs text-slate-400 mt-1">
                        {selected.author_name} · {new Date(selected.created_at).toLocaleString("ja-JP")}
                      </p>
                    </div>
                    <button
                      onClick={() => deleteFeedback(selected.id)}
                      className="text-slate-300 hover:text-red-500 transition-colors p-1"
                      title="削除"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>

                  <div className="bg-slate-50 rounded-lg p-4 mb-4">
                    <p className="text-sm text-slate-600 whitespace-pre-wrap leading-relaxed">
                      {selected.description || "（説明なし）"}
                    </p>
                  </div>

                  {selected.screenshot_url && (
                    <div className="mb-4">
                      <p className="text-xs text-slate-400 mb-2">添付画像:</p>
                      <a href={selected.screenshot_url} target="_blank" rel="noopener noreferrer">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={selected.screenshot_url}
                          alt="添付画像"
                          className="max-h-64 rounded-lg border border-slate-200 hover:opacity-90 transition-opacity"
                        />
                      </a>
                    </div>
                  )}

                  {/* Status buttons */}
                  <div className="flex gap-2">
                    {(Object.entries(STATUS_CONFIG) as [FeedbackItem["status"], typeof STATUS_CONFIG[keyof typeof STATUS_CONFIG]][]).map(([key, cfg]) => {
                      const Icon = cfg.icon;
                      return (
                        <button
                          key={key}
                          onClick={() => updateFeedbackStatus(selected.id, key)}
                          className={cn(
                            "flex items-center gap-1 text-xs px-3 py-1.5 rounded-lg border transition-all",
                            selected.status === key
                              ? cfg.color + " border-transparent font-semibold"
                              : "bg-white border-slate-200 text-slate-400 hover:bg-slate-50"
                          )}
                        >
                          <Icon className="w-3 h-3" />
                          {cfg.label}
                        </button>
                      );
                    })}
                  </div>
                </div>
              ) : (
                <div className="flex items-center justify-center h-64 text-slate-300 text-sm">
                  フィードバックを選択してください
                </div>
              )}
            </div>
          </div>
        )}

        {/* ─── Changelog Tab ─── */}
        {activeTab === "changelog" && (
          <div className="space-y-4">
            {/* Add Changelog */}
            {!showChangelogForm ? (
              <button
                onClick={() => setShowChangelogForm(true)}
                className="flex items-center gap-2 bg-yellow-400 hover:bg-yellow-500 text-slate-800 font-semibold px-4 py-2.5 rounded-xl text-sm shadow-sm transition-all"
              >
                <Plus className="w-4 h-4" />
                改善履歴を追加
              </button>
            ) : (
              <div className="bg-white rounded-xl border border-slate-200 p-5 space-y-3 shadow-sm">
                <h3 className="text-sm font-bold text-slate-700">改善履歴を追加</h3>
                <div className="flex gap-2">
                  {(["feature", "improvement", "bugfix"] as const).map(t => (
                    <button
                      key={t}
                      onClick={() => setClType(t)}
                      className={cn(
                        "px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors",
                        clType === t
                          ? t === "feature" ? "bg-green-50 text-green-700 border-green-300"
                          : t === "improvement" ? "bg-blue-50 text-blue-700 border-blue-300"
                          : "bg-red-50 text-red-700 border-red-300"
                          : "bg-white text-slate-500 border-slate-200"
                      )}
                    >
                      {t === "feature" ? "✨ 新機能" : t === "improvement" ? "🔧 改善" : "🐛 バグ修正"}
                    </button>
                  ))}
                </div>
                <div className="flex gap-2">
                  <input
                    value={clVersion}
                    onChange={e => setClVersion(e.target.value)}
                    placeholder="バージョン (例: 1.2.0)"
                    className="w-32 h-9 px-3 rounded-lg border border-slate-200 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-yellow-400/30"
                  />
                  <input
                    value={clTitle}
                    onChange={e => setClTitle(e.target.value)}
                    placeholder="タイトル"
                    className="flex-1 h-9 px-3 rounded-lg border border-slate-200 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-yellow-400/30"
                  />
                </div>
                <textarea
                  value={clDesc}
                  onChange={e => setClDesc(e.target.value)}
                  placeholder="詳細"
                  rows={3}
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-yellow-400/30 resize-none"
                />
                <div className="flex gap-2 justify-end">
                  <button
                    onClick={() => setShowChangelogForm(false)}
                    className="px-3 py-1.5 text-xs text-slate-500 hover:bg-slate-50 rounded-lg transition-colors"
                  >
                    キャンセル
                  </button>
                  <button
                    onClick={addChangelog}
                    disabled={!clTitle.trim()}
                    className="px-4 py-1.5 text-xs font-semibold bg-yellow-400 text-slate-800 rounded-lg hover:bg-yellow-500 transition-all disabled:opacity-50"
                  >
                    追加
                  </button>
                </div>
              </div>
            )}

            {/* Changelog list */}
            {changelog.map(item => (
              <div key={item.id} className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm flex items-start gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className={cn(
                      "text-[10px] px-2 py-0.5 rounded-full font-medium",
                      item.type === "feature" ? "bg-green-100 text-green-700"
                      : item.type === "improvement" ? "bg-blue-100 text-blue-700"
                      : "bg-red-100 text-red-600"
                    )}>
                      {item.type === "feature" ? "✨ 新機能" : item.type === "improvement" ? "🔧 改善" : "🐛 バグ修正"}
                    </span>
                    {item.version && <span className="text-[10px] text-slate-400 font-mono">v{item.version}</span>}
                    <span className="text-[10px] text-slate-400">{new Date(item.created_at).toLocaleDateString("ja-JP")}</span>
                  </div>
                  <h4 className="text-sm font-semibold text-slate-800">{item.title}</h4>
                  {item.description && <p className="text-xs text-slate-500 mt-1">{item.description}</p>}
                </div>
                <button
                  onClick={() => deleteChangelog(item.id)}
                  className="text-slate-300 hover:text-red-500 transition-colors p-1 shrink-0"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default function AdminFeedbackPage(): React.ReactElement {
  return (
    <AuthProvider>
      <AdminContent />
    </AuthProvider>
  );
}
