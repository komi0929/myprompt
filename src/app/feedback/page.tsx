"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import Link from "next/link";
import Image from "next/image";
import { supabase } from "@/lib/supabase";
import { showToast } from "@/components/ui/Toast";
import { useAuth } from "@/components/AuthProvider";
import {
  Lightbulb,
  Bug,
  ThumbsUp,
  Send,
  ImagePlus,
  X,
  Sparkles,
  History,
  MessageSquarePlus,
  ArrowLeft,
  CheckCircle2,
  Clock,
  Circle,
  XCircle,
} from "lucide-react";
import { cn } from "@/lib/utils";

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

/* ─── Session ID helper ─── */
function getSessionId(): string {
  if (typeof window === "undefined") return "server";
  let sid = sessionStorage.getItem("feedback_sid");
  if (!sid) {
    sid = crypto.randomUUID();
    sessionStorage.setItem("feedback_sid", sid);
  }
  return sid;
}

/* ─── Feature Roadmap Data ─── */
const FEATURES = [
  { name: "プロンプトのメモ・管理", status: "done" as const, icon: "📝" },
  { name: "フェーズ別フィルター", status: "done" as const, icon: "🎯" },
  { name: "テンプレート変数 ({変数})", status: "done" as const, icon: "⚡" },
  { name: "コピー＆ペースト", status: "done" as const, icon: "📋" },
  { name: "みんなのプロンプト共有", status: "done" as const, icon: "🌐" },
  { name: "いいね！＆ お気に入り", status: "done" as const, icon: "❤️" },
  { name: "Google ログイン", status: "done" as const, icon: "🔐" },

  { name: "タグ付け＆タグ検索", status: "done" as const, icon: "🏷️" },
  { name: "JSON / Markdown エクスポート", status: "done" as const, icon: "📤" },
  { name: "ピン留め機能", status: "done" as const, icon: "📌" },
  { name: "改善提案・バグ報告", status: "done" as const, icon: "💡" },
  { name: "ダークモード", status: "planned" as const, icon: "🌙" },
  { name: "プロンプト実行 (AI連携)", status: "planned" as const, icon: "🤖" },
  { name: "チーム共有機能", status: "planned" as const, icon: "👥" },
  { name: "カテゴリ別統計ダッシュボード", status: "planned" as const, icon: "📊" },
];

const STATUS_CONFIG = {
  done: { label: "リリース済", color: "bg-green-100 text-green-700 border-green-200" },
  wip: { label: "開発中", color: "bg-yellow-100 text-yellow-700 border-yellow-200" },
  planned: { label: "予定", color: "bg-slate-100 text-slate-500 border-slate-200" },
} as const;

/* ─── Tab Definitions ─── */
type TabId = "features" | "feedback" | "changelog";
const TABS: { id: TabId; label: string; icon: typeof Sparkles }[] = [
  { id: "feedback", label: "改善要望・バグ報告", icon: MessageSquarePlus },
  { id: "features", label: "現在の機能", icon: Sparkles },
  { id: "changelog", label: "改善履歴", icon: History },
];

/* ─── FEEDBACK STATUS ─── */
const FEEDBACK_STATUS = {
  open: { label: "受付中", icon: Circle, color: "text-blue-500" },
  in_progress: { label: "対応中", icon: Clock, color: "text-yellow-500" },
  done: { label: "完了", icon: CheckCircle2, color: "text-green-500" },
  rejected: { label: "見送り", icon: XCircle, color: "text-slate-400" },
};

/* ═══════════════════════════════════════════ */
/*  Main Page Component                        */
/* ═══════════════════════════════════════════ */
function FeedbackPageContent(): React.ReactElement {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<TabId>("feedback");
  const [feedbackItems, setFeedbackItems] = useState<FeedbackItem[]>([]);
  const [changelog, setChangelog] = useState<ChangelogItem[]>([]);
  const [likedIds, setLikedIds] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);

  // Form state
  const [formOpen, setFormOpen] = useState(false);
  const [formType, setFormType] = useState<"feature" | "bug">("feature");
  const [formTitle, setFormTitle] = useState("");
  const [formDesc, setFormDesc] = useState("");
  const [formScreenshot, setFormScreenshot] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  /* ─── Fetch Data ─── */
  const fetchFeedback = useCallback(async (): Promise<void> => {
    const { data } = await supabase
      .from("feedback")
      .select("*")
      .order("like_count", { ascending: false });
    setFeedbackItems((data as FeedbackItem[]) ?? []);
  }, []);

  const fetchChangelog = useCallback(async (): Promise<void> => {
    const { data } = await supabase
      .from("changelog")
      .select("*")
      .order("created_at", { ascending: false });
    setChangelog((data as ChangelogItem[]) ?? []);
  }, []);

  const fetchLikedIds = useCallback(async (): Promise<void> => {
    const sid = getSessionId();
    const { data } = await supabase
      .from("feedback_likes")
      .select("feedback_id")
      .eq("session_id", sid);
    if (data) {
      setLikedIds(new Set(data.map((d: { feedback_id: string }) => d.feedback_id)));
    }
  }, []);

  useEffect(() => {
    const load = async (): Promise<void> => {
      setLoading(true);
      await Promise.all([fetchFeedback(), fetchChangelog(), fetchLikedIds()]);
      setLoading(false);
    };
    load();
  }, [fetchFeedback, fetchChangelog, fetchLikedIds]);

  /* ─── Like Toggle ─── */
  const handleLike = async (feedbackId: string): Promise<void> => {
    const sid = getSessionId();
    // Optimistic update
    const alreadyLiked = likedIds.has(feedbackId);
    setLikedIds(prev => {
      const next = new Set(prev);
      if (alreadyLiked) next.delete(feedbackId);
      else next.add(feedbackId);
      return next;
    });
    setFeedbackItems(prev =>
      prev.map(f =>
        f.id === feedbackId
          ? { ...f, like_count: f.like_count + (alreadyLiked ? -1 : 1) }
          : f
      )
    );

    const { error } = await supabase.rpc("increment_feedback_like", {
      p_feedback_id: feedbackId,
      p_session_id: sid,
    });
    if (error) {
      // Rollback optimistic update
      setLikedIds(prev => {
        const next = new Set(prev);
        if (alreadyLiked) next.add(feedbackId);
        else next.delete(feedbackId);
        return next;
      });
      setFeedbackItems(prev =>
        prev.map(f =>
          f.id === feedbackId
            ? { ...f, like_count: f.like_count + (alreadyLiked ? 1 : -1) }
            : f
        )
      );
    }
  };

  /* ─── Screenshot paste/upload ─── */
  const handlePaste = (e: React.ClipboardEvent): void => {
    const items = e.clipboardData?.items;
    if (!items) return;
    for (const item of Array.from(items)) {
      if (item.type.startsWith("image/")) {
        e.preventDefault();
        const file = item.getAsFile();
        if (file) readFileAsDataUrl(file);
        break;
      }
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>): void => {
    const file = e.target.files?.[0];
    if (file) readFileAsDataUrl(file);
  };

  const readFileAsDataUrl = (file: File): void => {
    const reader = new FileReader();
    reader.onload = () => setFormScreenshot(reader.result as string);
    reader.readAsDataURL(file);
  };

  /* ─── Submit ─── */
  const handleSubmit = async (): Promise<void> => {
    if (!formTitle.trim()) return;
    setSubmitting(true);

    let screenshotUrl: string | null = null;

    // Upload screenshot if present
    if (formScreenshot) {
      try {
        const base64 = formScreenshot.split(",")[1];
        const ext = formScreenshot.includes("png") ? "png" : "jpg";
        const fileName = `feedback/${Date.now()}.${ext}`;
        const { error } = await supabase.storage
          .from("avatars")
          .upload(fileName, Uint8Array.from(atob(base64), c => c.charCodeAt(0)), {
            contentType: `image/${ext}`,
          });
        if (!error) {
          const { data } = supabase.storage.from("avatars").getPublicUrl(fileName);
          screenshotUrl = data.publicUrl;
        }
      } catch {
        // Screenshot upload failed, continue without it
      }
    }

    const authorName = user
      ? (user.user_metadata?.full_name ?? user.user_metadata?.name ?? user.email?.split("@")[0] ?? "ゲスト")
      : "ゲスト";

    const { error: insertError } = await supabase.from("feedback").insert({
      type: formType,
      title: formTitle.trim(),
      description: formDesc.trim(),
      screenshot_url: screenshotUrl,
      author_name: authorName,
      author_id: user?.id ?? null,
    });

    setSubmitting(false);
    if (insertError) {
      showToast("投稿に失敗しました。もう一度お試しください");
      return;
    }

    // Reset form only on success
    setFormTitle("");
    setFormDesc("");
    setFormScreenshot(null);
    setFormOpen(false);

    // Refresh
    await fetchFeedback();
  };

  /* ═══════════════════ RENDER ═══════════════════ */
  return (
    <div className="min-h-screen bg-linear-to-b from-yellow-50/40 to-white">
      {/* Header */}
      <header className="sticky top-0 z-30 bg-white/80 backdrop-blur-md border-b border-slate-200/60">
        <div className="max-w-3xl mx-auto px-4 py-3 flex items-center gap-3">
          <Link
            href="/"
            className="flex items-center gap-1.5 text-sm text-slate-400 hover:text-slate-600 transition-colors shrink-0"
          >
            <ArrowLeft className="w-4 h-4" />
            <span className="hidden sm:inline">戻る</span>
          </Link>
          <div className="flex items-center gap-2 flex-1 justify-center">
            <Image
              src="/mascot.png"
              alt="マイプロンプト"
              width={32}
              height={32}
              className="h-7 w-7 object-contain"
            />
            <h1 className="text-base font-bold text-slate-800">
              みんなでつくる <span className="text-yellow-500">マイプロンプト</span>
            </h1>
          </div>
          <div className="w-16 shrink-0" /> {/* Spacer for centering */}
        </div>

        {/* Tabs */}
        <div className="max-w-3xl mx-auto px-4">
          <div className="flex border-b border-transparent">
            {TABS.map(tab => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={cn(
                    "flex items-center gap-1.5 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors",
                    isActive
                      ? "border-yellow-400 text-yellow-700"
                      : "border-transparent text-slate-400 hover:text-slate-600"
                  )}
                >
                  <Icon className="w-4 h-4" />
                  {tab.label}
                </button>
              );
            })}
          </div>
        </div>
      </header>

      {/* Content */}
      <div className="max-w-3xl mx-auto px-4 py-6">
        {loading && activeTab !== "features" ? (
          <div className="flex flex-col items-center justify-center py-20 gap-3">
            <div className="w-8 h-8 border-2 border-yellow-300 border-t-yellow-500 rounded-full animate-spin" />
            <span className="text-slate-400 text-sm">読み込み中...</span>
          </div>
        ) : (
          <>
            {activeTab === "features" && <FeaturesTab />}
            {activeTab === "feedback" && (
              <FeedbackTab
                items={feedbackItems}
                likedIds={likedIds}
                onLike={handleLike}
                formOpen={formOpen}
                onOpenForm={() => setFormOpen(true)}
                onCloseForm={() => { setFormOpen(false); setFormScreenshot(null); }}
                formType={formType}
                onFormTypeChange={setFormType}
                formTitle={formTitle}
                onFormTitleChange={setFormTitle}
                formDesc={formDesc}
                onFormDescChange={setFormDesc}
                formScreenshot={formScreenshot}
                onRemoveScreenshot={() => setFormScreenshot(null)}
                onPaste={handlePaste}
                onFileChange={handleFileChange}
                fileInputRef={fileInputRef}
                onSubmit={handleSubmit}
                submitting={submitting}
              />
            )}
            {activeTab === "changelog" && <ChangelogTab items={changelog} />}
          </>
        )}
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════ */
/*  Tab 1: Features / Roadmap                  */
/* ═══════════════════════════════════════════ */
function FeaturesTab(): React.ReactElement {
  const doneFeatures = FEATURES.filter(f => f.status === "done");
  const planned = FEATURES.filter(f => f.status !== "done");

  return (
    <div className="space-y-8">
      {/* Released */}
      <section>
        <h2 className="text-sm font-bold text-slate-700 mb-3 flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-green-500" />
          リリース済みの機能 <span className="text-slate-400 font-normal">({doneFeatures.length})</span>
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {doneFeatures.map(f => (
            <div
              key={f.name}
              className="flex items-center gap-3 bg-white rounded-xl border border-slate-200/80 px-4 py-3 shadow-sm"
            >
              <span className="text-lg">{f.icon}</span>
              <span className="text-sm text-slate-700 flex-1">{f.name}</span>
              <span className={cn("text-[10px] px-2 py-0.5 rounded-full border font-medium", STATUS_CONFIG[f.status].color)}>
                {STATUS_CONFIG[f.status].label}
              </span>
            </div>
          ))}
        </div>
      </section>

      {/* Planned */}
      {planned.length > 0 && (
        <section>
          <h2 className="text-sm font-bold text-slate-700 mb-3 flex items-center gap-2">
            <Clock className="w-4 h-4 text-yellow-500" />
            今後の予定
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {planned.map(f => (
              <div
                key={f.name}
                className="flex items-center gap-3 bg-white rounded-xl border border-dashed border-slate-200 px-4 py-3"
              >
                <span className="text-lg">{f.icon}</span>
                <span className="text-sm text-slate-500 flex-1">{f.name}</span>
                <span className={cn("text-[10px] px-2 py-0.5 rounded-full border font-medium", STATUS_CONFIG[f.status].color)}>
                  {STATUS_CONFIG[f.status].label}
                </span>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}

/* ═══════════════════════════════════════════ */
/*  Tab 2: Feedback / User Requests            */
/* ═══════════════════════════════════════════ */
interface FeedbackTabProps {
  items: FeedbackItem[];
  likedIds: Set<string>;
  onLike: (id: string) => Promise<void>;
  formOpen: boolean;
  onOpenForm: () => void;
  onCloseForm: () => void;
  formType: "feature" | "bug";
  onFormTypeChange: (type: "feature" | "bug") => void;
  formTitle: string;
  onFormTitleChange: (v: string) => void;
  formDesc: string;
  onFormDescChange: (v: string) => void;
  formScreenshot: string | null;
  onRemoveScreenshot: () => void;
  onPaste: (e: React.ClipboardEvent) => void;
  onFileChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  fileInputRef: React.RefObject<HTMLInputElement | null>;
  onSubmit: () => Promise<void>;
  submitting: boolean;
}

function FeedbackTab(props: FeedbackTabProps): React.ReactElement {
  const {
    items, likedIds, onLike, formOpen, onOpenForm, onCloseForm,
    formType, onFormTypeChange, formTitle, onFormTitleChange,
    formDesc, onFormDescChange, formScreenshot, onRemoveScreenshot,
    onPaste, onFileChange, fileInputRef, onSubmit, submitting,
  } = props;

  return (
    <div className="space-y-4">
      {/* Submit Button */}
      {!formOpen && (
        <button
          onClick={onOpenForm}
          className="flex items-center gap-2 w-full justify-center bg-yellow-400 hover:bg-yellow-500 text-slate-800 font-semibold py-3 rounded-xl shadow-sm hover:shadow-md transition-all"
        >
          <MessageSquarePlus className="w-4 h-4" />
          改善提案・バグ報告をする
        </button>
      )}

      {/* Submission Form */}
      {formOpen && (
        <div className="bg-white rounded-xl border border-yellow-200 shadow-md p-5 space-y-4 animate-in fade-in zoom-in-95 duration-200">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-700">新しい提案を投稿</h3>
            <button onClick={onCloseForm} className="text-slate-400 hover:text-slate-600 p-1">
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Type selector */}
          <div className="flex gap-2">
            <button
              onClick={() => onFormTypeChange("feature")}
              className={cn(
                "flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium border transition-colors flex-1 justify-center",
                formType === "feature"
                  ? "bg-yellow-50 text-yellow-700 border-yellow-300"
                  : "bg-white text-slate-500 border-slate-200 hover:bg-slate-50"
              )}
            >
              <Lightbulb className="w-3.5 h-3.5" />
              改善提案
            </button>
            <button
              onClick={() => onFormTypeChange("bug")}
              className={cn(
                "flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium border transition-colors flex-1 justify-center",
                formType === "bug"
                  ? "bg-red-50 text-red-700 border-red-300"
                  : "bg-white text-slate-500 border-slate-200 hover:bg-slate-50"
              )}
            >
              <Bug className="w-3.5 h-3.5" />
              バグ報告
            </button>
          </div>

          {/* Title */}
          <input
            value={formTitle}
            onChange={e => onFormTitleChange(e.target.value)}
            placeholder="タイトル（一言で）"
            className="w-full h-10 px-3 rounded-lg border border-slate-200 text-sm text-slate-700 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-yellow-400/30 focus:border-yellow-400 transition-all"
          />

          {/* Description with paste support */}
          <textarea
            value={formDesc}
            onChange={e => onFormDescChange(e.target.value)}
            onPaste={onPaste}
            placeholder="詳しく教えてください（Ctrl+V でスクリーンショットも貼れます）"
            rows={4}
            className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm text-slate-700 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-yellow-400/30 focus:border-yellow-400 transition-all resize-none"
          />

          {/* Screenshot preview */}
          {formScreenshot && (
            <div className="relative inline-block">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={formScreenshot}
                alt="スクリーンショット"
                className="max-h-40 rounded-lg border border-slate-200"
              />
              <button
                onClick={onRemoveScreenshot}
                className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center"
              >
                <X className="w-3 h-3" />
              </button>
            </div>
          )}

          {/* Actions */}
          <div className="flex items-center justify-between">
            <div className="flex gap-2">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={onFileChange}
                className="hidden"
              />
              <button
                onClick={() => fileInputRef.current?.click()}
                className="flex items-center gap-1 text-xs text-slate-400 hover:text-slate-600 px-2 py-1 rounded-lg hover:bg-slate-50 transition-colors"
              >
                <ImagePlus className="w-3.5 h-3.5" />
                画像添付
              </button>
            </div>
            <button
              onClick={onSubmit}
              disabled={!formTitle.trim() || submitting}
              className={cn(
                "flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-semibold transition-all",
                formTitle.trim() && !submitting
                  ? "bg-yellow-400 text-slate-800 hover:bg-yellow-500 shadow-sm"
                  : "bg-slate-100 text-slate-400 cursor-not-allowed"
              )}
            >
              <Send className="w-3.5 h-3.5" />
              送信
            </button>
          </div>
        </div>
      )}

      {/* Feedback List */}
      {items.length === 0 ? (
        <div className="text-center py-16">
          <MessageSquarePlus className="w-10 h-10 text-slate-200 mx-auto mb-3" />
          <p className="text-sm text-slate-400">まだ投稿がありません</p>
          <p className="text-xs text-slate-300 mt-1">最初の提案を投稿してみましょう！</p>
        </div>
      ) : (
        <div className="space-y-3">
          {items.map(item => {
            const isLiked = likedIds.has(item.id);
            const statusInfo = FEEDBACK_STATUS[item.status];
            const StatusIcon = statusInfo.icon;
            return (
              <div
                key={item.id}
                className="bg-white rounded-xl border border-slate-200/80 p-4 shadow-sm hover:shadow-md transition-shadow"
              >
                <div className="flex items-start gap-3">
                  {/* Like button */}
                  <button
                    onClick={() => onLike(item.id)}
                    className={cn(
                      "flex flex-col items-center gap-0.5 min-w-[44px] py-2 rounded-lg transition-all",
                      isLiked
                        ? "bg-yellow-50 text-yellow-600"
                        : "text-slate-300 hover:bg-slate-50 hover:text-yellow-500"
                    )}
                  >
                    <ThumbsUp className={cn("w-4 h-4", isLiked && "fill-yellow-400")} />
                    <span className="text-xs font-bold">{item.like_count}</span>
                  </button>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <span className={cn(
                        "text-[10px] px-2 py-0.5 rounded-full font-medium border",
                        item.type === "feature"
                          ? "bg-yellow-50 text-yellow-700 border-yellow-200"
                          : "bg-red-50 text-red-600 border-red-200"
                      )}>
                        {item.type === "feature" ? "💡 改善提案" : "🐛 バグ報告"}
                      </span>
                      <span className={cn("flex items-center gap-0.5 text-[10px] font-medium", statusInfo.color)}>
                        <StatusIcon className="w-3 h-3" />
                        {statusInfo.label}
                      </span>
                    </div>
                    <h3 className="text-sm font-semibold text-slate-800 mb-1">{item.title}</h3>
                    {item.description && (
                      <p className="text-xs text-slate-500 leading-relaxed whitespace-pre-wrap">{item.description}</p>
                    )}
                    {item.screenshot_url && (
                      <a href={item.screenshot_url} target="_blank" rel="noopener noreferrer" className="mt-2 inline-block">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={item.screenshot_url}
                          alt="添付画像"
                          className="max-h-32 rounded-lg border border-slate-200 hover:opacity-90 transition-opacity"
                        />
                      </a>
                    )}
                    <div className="flex items-center gap-2 mt-2 text-[10px] text-slate-400">
                      <span>{item.author_name}</span>
                      <span>·</span>
                      <span>{new Date(item.created_at).toLocaleDateString("ja-JP")}</span>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

/* ═══════════════════════════════════════════ */
/*  Tab 3: Changelog                           */
/* ═══════════════════════════════════════════ */
function ChangelogTab({ items }: { items: ChangelogItem[] }): React.ReactElement {
  const typeConfig = {
    feature: { label: "新機能", color: "bg-green-100 text-green-700", icon: "✨" },
    improvement: { label: "改善", color: "bg-blue-100 text-blue-700", icon: "🔧" },
    bugfix: { label: "バグ修正", color: "bg-red-100 text-red-600", icon: "🐛" },
  };

  if (items.length === 0) {
    return (
      <div className="text-center py-16">
        <History className="w-10 h-10 text-slate-200 mx-auto mb-3" />
        <p className="text-sm text-slate-400">改善履歴はまだありません</p>
      </div>
    );
  }

  // Group by date
  const grouped = items.reduce<Record<string, ChangelogItem[]>>((acc, item) => {
    const date = new Date(item.created_at).toLocaleDateString("ja-JP", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
    if (!acc[date]) acc[date] = [];
    acc[date].push(item);
    return acc;
  }, {});

  return (
    <div className="space-y-6">
      {Object.entries(grouped).map(([date, items]) => (
        <div key={date}>
          <div className="flex items-center gap-2 mb-3">
            <span className="text-lg">🍳</span>
            <h3 className="text-sm font-bold text-slate-700">{date}</h3>
          </div>
          <div className="space-y-2 pl-2 border-l-2 border-slate-200 ml-2">
            {items.map(item => {
              const cfg = typeConfig[item.type];
              return (
                <div
                  key={item.id}
                  className="bg-white rounded-xl border border-slate-200/80 p-4 shadow-sm ml-4"
                >
                  <div className="flex items-center gap-2 mb-2">
                    <span className={cn("text-[10px] px-2 py-0.5 rounded-full font-medium", cfg.color)}>
                      {cfg.icon} {cfg.label}
                    </span>
                    {item.version && (
                      <span className="text-[10px] text-slate-400 font-mono">v{item.version}</span>
                    )}
                  </div>
                  <h4 className="text-sm font-semibold text-slate-800 mb-1">{item.title}</h4>
                  <p className="text-xs text-slate-500 leading-relaxed whitespace-pre-wrap">{item.description}</p>
                </div>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}

/* ─── Page Wrapper ─── */
export default function FeedbackPage(): React.ReactElement {
  return <FeedbackPageContent />;
}
