"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import { useAuth, AuthProvider } from "@/components/AuthProvider";
import { fetchRecentKpi, aggregateDailyKpi, type DailyKpi } from "@/lib/analytics";
import type { FeatureFlag } from "@/lib/feature-flags";
import {
  Shield,
  RefreshCw,
  BarChart3,
  ToggleLeft,
  ToggleRight,
  Mail,
  MessageSquarePlus,
  TrendingUp,
  TrendingDown,
  Minus,
  ArrowLeft,
  Trash2,
  ExternalLink,
  ThumbsUp,
  Lightbulb,
  Bug,
  Clock,
  Circle,
  CheckCircle2,
  XCircle,
  Plus,
  History,
} from "lucide-react";
import { cn } from "@/lib/utils";

/* ─── Config ─── */
const ADMIN_EMAILS = ["komi0929@gmail.com"];

/* ─── Tab Definition ─── */
type TabId = "kpi" | "flags" | "contacts" | "feedback";
const TABS: { id: TabId; label: string; icon: typeof BarChart3 }[] = [
  { id: "kpi", label: "KPIサマリー", icon: BarChart3 },
  { id: "flags", label: "Feature Flags", icon: ToggleRight },
  { id: "contacts", label: "お問い合わせ", icon: Mail },
  { id: "feedback", label: "フィードバック", icon: MessageSquarePlus },
];

/* ─── Shared Types ─── */
interface ContactEntry {
  id: string;
  name: string;
  email: string;
  category: string;
  message: string;
  status: string;
  created_at: string;
}

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

/* ═══════════════════════════════════════════════ */
/*  Admin Dashboard                                */
/* ═══════════════════════════════════════════════ */
function AdminDashboard(): React.ReactElement {
  const { user, isLoading, email } = useAuth();
  const [activeTab, setActiveTab] = useState<TabId>("kpi");
  const [fetching, setFetching] = useState(false);

  // KPI data
  const [kpiData, setKpiData] = useState<DailyKpi[]>([]);

  // Feature Flags
  const [flags, setFlags] = useState<FeatureFlag[]>([]);

  // Contacts
  const [contacts, setContacts] = useState<ContactEntry[]>([]);
  const [selectedContactId, setSelectedContactId] = useState<string | null>(null);

  // Feedback
  const [feedbackItems, setFeedbackItems] = useState<FeedbackItem[]>([]);
  const [selectedFeedbackId, setSelectedFeedbackId] = useState<string | null>(null);
  const [changelog, setChangelog] = useState<ChangelogItem[]>([]);
  const [feedbackSubTab, setFeedbackSubTab] = useState<"list" | "changelog">("list");

  // Changelog form
  const [showClForm, setShowClForm] = useState(false);
  const [clVersion, setClVersion] = useState("");
  const [clTitle, setClTitle] = useState("");
  const [clDesc, setClDesc] = useState("");
  const [clType, setClType] = useState<"feature" | "improvement" | "bugfix">("improvement");

  const isAdmin = !isLoading && user && ADMIN_EMAILS.includes(email);

  /* ─── Fetch All Data ─── */
  const fetchAll = useCallback(async (): Promise<void> => {
    setFetching(true);

    // Aggregate today & yesterday KPI
    const today = new Date().toISOString().split("T")[0];
    const yesterday = new Date(Date.now() - 86400000).toISOString().split("T")[0];
    await Promise.all([
      aggregateDailyKpi(today),
      aggregateDailyKpi(yesterday),
    ]);

    const [kpi, flagsData, contactsData, fbData, clData] = await Promise.all([
      fetchRecentKpi(14),
      supabase.from("feature_flags" as "profiles").select("*").order("id") as unknown as { data: FeatureFlag[] | null },
      supabase.from("contacts").select("*").order("created_at", { ascending: false }),
      supabase.from("feedback").select("*").order("created_at", { ascending: false }),
      supabase.from("changelog").select("*").order("created_at", { ascending: false }),
    ]);

    setKpiData(kpi);
    setFlags(flagsData.data ?? []);
    setContacts((contactsData.data as unknown as ContactEntry[]) ?? []);
    setFeedbackItems((fbData.data as unknown as FeedbackItem[]) ?? []);
    setChangelog((clData.data as unknown as ChangelogItem[]) ?? []);
    setFetching(false);
  }, []);

  useEffect(() => {
    if (isAdmin) { void fetchAll(); }
  }, [isAdmin, fetchAll]);

  /* ─── Guards ─── */
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

  const newContactCount = contacts.filter(c => c.status === "new").length;
  const openFbCount = feedbackItems.filter(f => f.status === "open").length;

  /* ═══════════════════ RENDER ═══════════════════ */
  return (
    <div className="min-h-screen bg-slate-50">
      <div className="max-w-6xl mx-auto px-4 md:px-6 py-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div>
            <Link href="/" className="text-sm text-slate-400 hover:text-slate-600 transition-colors mb-1 inline-block">
              <span className="flex items-center gap-1"><ArrowLeft className="w-3 h-3" /> マイプロンプト</span>
            </Link>
            <h1 className="text-xl font-bold text-slate-800 flex items-center gap-2">
              ⚙️ 管理ダッシュボード
            </h1>
          </div>
          <button
            onClick={fetchAll}
            className="flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-700 bg-white border border-slate-200 px-3 py-2 rounded-lg transition-colors"
          >
            <RefreshCw className={cn("w-4 h-4", fetching && "animate-spin")} />
            更新
          </button>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 bg-white rounded-xl border border-slate-200 p-1 mb-6 overflow-x-auto">
          {TABS.map(tab => {
            const Icon = tab.icon;
            const badge = tab.id === "contacts" ? newContactCount : tab.id === "feedback" ? openFbCount : 0;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={cn(
                  "flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium transition-colors whitespace-nowrap relative",
                  activeTab === tab.id
                    ? "bg-yellow-400 text-slate-800 shadow-sm"
                    : "text-slate-500 hover:text-slate-700 hover:bg-slate-50"
                )}
              >
                <Icon className="w-4 h-4" />
                {tab.label}
                {badge > 0 && (
                  <span className="ml-1 text-[10px] bg-red-500 text-white px-1.5 py-0.5 rounded-full font-bold min-w-[18px] text-center">
                    {badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Tab Content */}
        {activeTab === "kpi" && <KpiTab data={kpiData} />}
        {activeTab === "flags" && <FlagsTab flags={flags} setFlags={setFlags} />}
        {activeTab === "contacts" && (
          <ContactsTab
            contacts={contacts}
            setContacts={setContacts}
            selectedId={selectedContactId}
            setSelectedId={setSelectedContactId}
          />
        )}
        {activeTab === "feedback" && (
          <FeedbackTab
            items={feedbackItems}
            setItems={setFeedbackItems}
            selectedId={selectedFeedbackId}
            setSelectedId={setSelectedFeedbackId}
            changelog={changelog}
            setChangelog={setChangelog}
            subTab={feedbackSubTab}
            setSubTab={setFeedbackSubTab}
            showClForm={showClForm}
            setShowClForm={setShowClForm}
            clVersion={clVersion} setClVersion={setClVersion}
            clTitle={clTitle} setClTitle={setClTitle}
            clDesc={clDesc} setClDesc={setClDesc}
            clType={clType} setClType={setClType}
          />
        )}
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════ */
/*  Tab 1: KPI Summary                            */
/* ═══════════════════════════════════════════════ */
function KpiTab({ data }: { data: DailyKpi[] }): React.ReactElement {
  const today = data[0];
  const yesterday = data[1];

  const KPI_DEFS: { key: keyof DailyKpi; label: string; emoji: string; target: number }[] = [
    { key: "dau", label: "DAU", emoji: "👥", target: 50 },
    { key: "new_signups", label: "新規登録", emoji: "🆕", target: 5 },
    { key: "prompts_created", label: "作成数", emoji: "✏️", target: 20 },
    { key: "copies_executed", label: "コピー利用", emoji: "📋", target: 15 },
    { key: "prompts_published", label: "公開数", emoji: "🌐", target: 5 },
    { key: "likes_given", label: "いいね", emoji: "❤️", target: 10 },
    { key: "favorites_given", label: "お気に入り", emoji: "⭐", target: 5 },
    { key: "searches", label: "検索数", emoji: "🔍", target: 20 },
    { key: "feedback_submitted", label: "フィードバック", emoji: "💬", target: 2 },
  ];

  if (!today) {
    return (
      <div className="text-center py-16 text-slate-400 text-sm">
        <BarChart3 className="w-10 h-10 mx-auto mb-3 text-slate-200" />
        <p>KPIデータがまだありません</p>
        <p className="text-xs text-slate-300 mt-1">イベントログが蓄積されるとここに表示されます</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-3 md:grid-cols-5 gap-3">
        {KPI_DEFS.map(def => {
          const todayVal = (today[def.key] as number) ?? 0;
          const yesterdayVal = yesterday ? ((yesterday[def.key] as number) ?? 0) : 0;
          const diff = yesterdayVal > 0 ? Math.round(((todayVal - yesterdayVal) / yesterdayVal) * 100) : 0;
          const targetPct = def.target > 0 ? Math.min(100, Math.round((todayVal / def.target) * 100)) : 0;

          return (
            <div key={def.key} className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
              <div className="flex items-center justify-between mb-2">
                <span className="text-lg">{def.emoji}</span>
                {diff !== 0 && (
                  <span className={cn(
                    "flex items-center gap-0.5 text-[10px] font-bold px-1.5 py-0.5 rounded-full",
                    diff > 0 ? "text-green-700 bg-green-50" : "text-red-600 bg-red-50"
                  )}>
                    {diff > 0 ? <TrendingUp className="w-2.5 h-2.5" /> : <TrendingDown className="w-2.5 h-2.5" />}
                    {diff > 0 ? "+" : ""}{diff}%
                  </span>
                )}
                {diff === 0 && yesterday && <Minus className="w-3 h-3 text-slate-300" />}
              </div>
              <p className="text-2xl font-bold text-slate-800">{todayVal}</p>
              <p className="text-[10px] text-slate-400 mt-0.5">{def.label}</p>
              {/* Target progress bar */}
              <div className="mt-2">
                <div className="h-1 bg-slate-100 rounded-full overflow-hidden">
                  <div
                    className={cn(
                      "h-full rounded-full transition-all",
                      targetPct >= 100 ? "bg-green-400" : targetPct >= 50 ? "bg-yellow-400" : "bg-red-400"
                    )}
                    style={{ width: `${targetPct}%` }}
                  />
                </div>
                <p className="text-[8px] text-slate-300 mt-0.5">目標: {def.target}</p>
              </div>
            </div>
          );
        })}
      </div>

      {/* 7-day trend table */}
      {data.length > 1 && (
        <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm overflow-x-auto">
          <h3 className="text-sm font-bold text-slate-700 mb-3">📈 直近7日間の推移</h3>
          <table className="w-full text-xs">
            <thead>
              <tr className="text-left text-slate-400">
                <th className="pb-2 pr-4">日付</th>
                <th className="pb-2 pr-3 text-center">DAU</th>
                <th className="pb-2 pr-3 text-center">登録</th>
                <th className="pb-2 pr-3 text-center">作成</th>
                <th className="pb-2 pr-3 text-center font-bold text-yellow-600">コピー</th>
                <th className="pb-2 pr-3 text-center">公開</th>
                <th className="pb-2 pr-3 text-center">いいね</th>
              </tr>
            </thead>
            <tbody>
              {data.slice(0, 7).map(row => (
                <tr key={row.date} className="border-t border-slate-100">
                  <td className="py-2 pr-4 text-slate-600 font-medium">{new Date(row.date).toLocaleDateString("ja-JP", { month: "short", day: "numeric" })}</td>
                  <td className="py-2 pr-3 text-center text-slate-700">{row.dau}</td>
                  <td className="py-2 pr-3 text-center text-slate-700">{row.new_signups}</td>
                  <td className="py-2 pr-3 text-center text-slate-700">{row.prompts_created}</td>
                  <td className="py-2 pr-3 text-center font-bold text-yellow-700">{row.copies_executed}</td>
                  <td className="py-2 pr-3 text-center text-slate-700">{row.prompts_published}</td>
                  <td className="py-2 pr-3 text-center text-slate-700">{row.likes_given}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

/* ═══════════════════════════════════════════════ */
/*  Tab 2: Feature Flags                           */
/* ═══════════════════════════════════════════════ */
function FlagsTab({ flags, setFlags }: { flags: FeatureFlag[]; setFlags: React.Dispatch<React.SetStateAction<FeatureFlag[]>> }): React.ReactElement {
  const toggleFlag = async (id: string, current: boolean): Promise<void> => {
    const newVal = !current;
    setFlags(prev => prev.map(f => f.id === id ? { ...f, enabled: newVal } : f));
    try {
      await (supabase.from("feature_flags" as "profiles") as unknown as { update: (data: Record<string, unknown>) => { eq: (col: string, val: string) => Promise<{ error: unknown }> } }).update({ enabled: newVal, updated_at: new Date().toISOString() }).eq("id", id);
    } catch {
      setFlags(prev => prev.map(f => f.id === id ? { ...f, enabled: current } : f));
    }
  };

  if (flags.length === 0) {
    return <div className="text-center py-16 text-slate-400 text-sm">Feature Flagsがまだ設定されていません</div>;
  }

  return (
    <div className="space-y-3">
      <p className="text-xs text-slate-400">機能のON/OFFを切り替えると、即座に全ユーザーに反映されます。</p>
      {flags.map(flag => (
        <div
          key={flag.id}
          className={cn(
            "flex items-center justify-between bg-white rounded-xl border p-4 shadow-sm transition-all",
            flag.enabled ? "border-green-200" : "border-slate-200"
          )}
        >
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-0.5">
              <code className="text-[10px] bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded font-mono">{flag.id}</code>
              <span className={cn(
                "text-[10px] px-1.5 py-0.5 rounded-full font-medium",
                flag.enabled ? "bg-green-100 text-green-700" : "bg-red-100 text-red-600"
              )}>
                {flag.enabled ? "ON" : "OFF"}
              </span>
            </div>
            <p className="text-sm font-semibold text-slate-800">{flag.label}</p>
            <p className="text-xs text-slate-400">{flag.description}</p>
          </div>
          <button
            onClick={() => toggleFlag(flag.id, flag.enabled)}
            className="ml-4 shrink-0 transition-colors"
          >
            {flag.enabled ? (
              <ToggleRight className="w-8 h-8 text-green-500" />
            ) : (
              <ToggleLeft className="w-8 h-8 text-slate-300" />
            )}
          </button>
        </div>
      ))}
    </div>
  );
}

/* ═══════════════════════════════════════════════ */
/*  Tab 3: Contacts                                */
/* ═══════════════════════════════════════════════ */
const CATEGORY_LABELS: Record<string, string> = { general: "一般", bug: "不具合", feature: "機能要望", other: "その他" };
const CONTACT_STATUS_COLORS: Record<string, string> = { new: "bg-yellow-100 text-yellow-700", read: "bg-blue-100 text-blue-700", resolved: "bg-green-100 text-green-700" };

function ContactsTab({
  contacts, setContacts, selectedId, setSelectedId
}: {
  contacts: ContactEntry[];
  setContacts: React.Dispatch<React.SetStateAction<ContactEntry[]>>;
  selectedId: string | null;
  setSelectedId: (id: string | null) => void;
}): React.ReactElement {
  const updateStatus = async (id: string, status: string): Promise<void> => {
    const prev = contacts.find(c => c.id === id)?.status;
    setContacts(p => p.map(c => c.id === id ? { ...c, status } : c));
    const { error } = await supabase.from("contacts").update({ status }).eq("id", id);
    if (error && prev) {
      setContacts(p => p.map(c => c.id === id ? { ...c, status: prev } : c));
    }
  };
  const deleteContact = async (id: string): Promise<void> => {
    const backup = contacts.find(c => c.id === id);
    setContacts(prev => prev.filter(c => c.id !== id));
    if (selectedId === id) setSelectedId(null);
    const { error } = await supabase.from("contacts").delete().eq("id", id);
    if (error && backup) {
      setContacts(prev => [...prev, backup]);
    }
  };

  const selected = contacts.find(c => c.id === selectedId);

  return (
    <div className="flex gap-4">
      {/* List */}
      <div className="w-2/5 space-y-2 max-h-[calc(100vh-240px)] overflow-y-auto">
        {contacts.length === 0 ? (
          <div className="text-center py-16 text-slate-400 text-sm">お問い合わせはまだありません</div>
        ) : contacts.map(c => (
          <button
            key={c.id}
            onClick={() => { setSelectedId(c.id); if (c.status === "new") updateStatus(c.id, "read"); }}
            className={cn("w-full text-left p-3 rounded-xl border transition-all text-xs", selectedId === c.id ? "bg-white border-yellow-300 shadow-md" : "bg-white border-slate-200 hover:border-slate-300")}
          >
            <div className="flex items-center justify-between mb-0.5">
              <span className="font-semibold text-slate-700 truncate">{c.name}</span>
              <span className={cn("text-[10px] px-1.5 py-0.5 rounded-full font-medium", CONTACT_STATUS_COLORS[c.status] ?? "bg-slate-100 text-slate-500")}>
                {c.status === "new" ? "新着" : c.status === "read" ? "確認済" : "対応済"}
              </span>
            </div>
            <p className="text-[10px] text-slate-400 truncate">{c.email}</p>
            <p className="text-slate-500 mt-1 line-clamp-1">{c.message}</p>
          </button>
        ))}
      </div>
      {/* Detail */}
      <div className="flex-1">
        {selected ? (
          <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
            <div className="flex items-start justify-between mb-3">
              <div>
                <h2 className="text-base font-bold text-slate-800">{selected.name}</h2>
                <a href={`mailto:${selected.email}`} className="text-xs text-yellow-600 hover:text-yellow-700 flex items-center gap-1">
                  {selected.email} <ExternalLink className="w-3 h-3" />
                </a>
              </div>
              <button onClick={() => deleteContact(selected.id)} className="text-slate-300 hover:text-red-500 transition-colors p-1"><Trash2 className="w-4 h-4" /></button>
            </div>
            <div className="flex items-center gap-2 mb-3">
              <span className="text-[10px] bg-slate-100 text-slate-500 px-2 py-1 rounded-lg">{CATEGORY_LABELS[selected.category] ?? selected.category}</span>
              <span className="text-[10px] text-slate-400">{new Date(selected.created_at).toLocaleString("ja-JP")}</span>
            </div>
            <div className="bg-slate-50 rounded-lg p-3 mb-4">
              <p className="text-sm text-slate-600 whitespace-pre-wrap leading-relaxed">{selected.message}</p>
            </div>
            <div className="flex gap-2">
              {["new", "read", "resolved"].map(s => (
                <button key={s} onClick={() => updateStatus(selected.id, s)} className={cn("text-xs px-3 py-1.5 rounded-lg border transition-all", selected.status === s ? (CONTACT_STATUS_COLORS[s] ?? "") + " border-transparent font-semibold" : "bg-white border-slate-200 text-slate-400 hover:bg-slate-50")}>
                  {s === "new" ? "新着" : s === "read" ? "確認済" : "対応済"}
                </button>
              ))}
            </div>
          </div>
        ) : (
          <div className="flex items-center justify-center h-64 text-slate-300 text-sm">お問い合わせを選択してください</div>
        )}
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════ */
/*  Tab 4: Feedback (merged)                       */
/* ═══════════════════════════════════════════════ */
const FB_STATUS = {
  open: { label: "受付中", icon: Circle, color: "bg-blue-100 text-blue-700" },
  in_progress: { label: "対応中", icon: Clock, color: "bg-yellow-100 text-yellow-700" },
  done: { label: "完了", icon: CheckCircle2, color: "bg-green-100 text-green-700" },
  rejected: { label: "見送り", icon: XCircle, color: "bg-slate-100 text-slate-500" },
};

interface FeedbackTabAllProps {
  items: FeedbackItem[];
  setItems: React.Dispatch<React.SetStateAction<FeedbackItem[]>>;
  selectedId: string | null;
  setSelectedId: (id: string | null) => void;
  changelog: ChangelogItem[];
  setChangelog: React.Dispatch<React.SetStateAction<ChangelogItem[]>>;
  subTab: "list" | "changelog";
  setSubTab: (t: "list" | "changelog") => void;
  showClForm: boolean;
  setShowClForm: (v: boolean) => void;
  clVersion: string; setClVersion: (v: string) => void;
  clTitle: string; setClTitle: (v: string) => void;
  clDesc: string; setClDesc: (v: string) => void;
  clType: "feature" | "improvement" | "bugfix"; setClType: (v: "feature" | "improvement" | "bugfix") => void;
}

function FeedbackTab(props: FeedbackTabAllProps): React.ReactElement {
  const {
    items, setItems, selectedId, setSelectedId,
    changelog, setChangelog,
    subTab, setSubTab,
    showClForm, setShowClForm,
    clVersion, setClVersion, clTitle, setClTitle, clDesc, setClDesc, clType, setClType,
  } = props;

  const updateStatus = async (id: string, status: string): Promise<void> => {
    const prev = items.find(f => f.id === id)?.status;
    setItems(p => p.map(f => f.id === id ? { ...f, status: status as FeedbackItem["status"] } : f));
    const { error } = await supabase.from("feedback").update({ status, updated_at: new Date().toISOString() }).eq("id", id);
    if (error && prev) {
      setItems(p => p.map(f => f.id === id ? { ...f, status: prev } : f));
    }
  };
  const deleteFb = async (id: string): Promise<void> => {
    const backup = items.find(f => f.id === id);
    setItems(prev => prev.filter(f => f.id !== id));
    if (selectedId === id) setSelectedId(null);
    const { error } = await supabase.from("feedback").delete().eq("id", id);
    if (error && backup) {
      setItems(prev => [...prev, backup]);
    }
  };
  const addChangelog = async (): Promise<void> => {
    if (!clTitle.trim()) return;
    const { error } = await supabase.from("changelog").insert({ version: clVersion.trim(), title: clTitle.trim(), description: clDesc.trim(), type: clType });
    if (error) return;
    setClVersion(""); setClTitle(""); setClDesc(""); setShowClForm(false);
    const { data } = await supabase.from("changelog").select("*").order("created_at", { ascending: false });
    setChangelog((data as ChangelogItem[]) ?? []);
  };
  const deleteChangelog = async (id: string): Promise<void> => {
    const backup = changelog.find(c => c.id === id);
    setChangelog(prev => prev.filter(c => c.id !== id));
    const { error } = await supabase.from("changelog").delete().eq("id", id);
    if (error && backup) {
      setChangelog(prev => [...prev, backup]);
    }
  };

  const selected = items.find(f => f.id === selectedId);

  return (
    <div className="space-y-4">
      {/* Sub tabs */}
      <div className="flex gap-3 border-b border-slate-200 mb-4">
        <button onClick={() => setSubTab("list")} className={cn("flex items-center gap-1 px-1 pb-2 text-sm font-medium border-b-2 transition-colors", subTab === "list" ? "border-yellow-400 text-yellow-700" : "border-transparent text-slate-400")}>
          <ThumbsUp className="w-3.5 h-3.5" /> フィードバック ({items.length})
        </button>
        <button onClick={() => setSubTab("changelog")} className={cn("flex items-center gap-1 px-1 pb-2 text-sm font-medium border-b-2 transition-colors", subTab === "changelog" ? "border-yellow-400 text-yellow-700" : "border-transparent text-slate-400")}>
          <History className="w-3.5 h-3.5" /> 改善履歴 ({changelog.length})
        </button>
      </div>

      {subTab === "list" && (
        <div className="flex gap-4">
          {/* List */}
          <div className="w-2/5 space-y-2 max-h-[calc(100vh-300px)] overflow-y-auto">
            {items.length === 0 ? (
              <div className="text-center py-12 text-slate-400 text-sm">フィードバックなし</div>
            ) : items.map(f => {
              const st = FB_STATUS[f.status];
              return (
                <button key={f.id} onClick={() => setSelectedId(f.id)} className={cn("w-full text-left p-3 rounded-xl border transition-all text-xs", selectedId === f.id ? "bg-white border-yellow-300 shadow-md" : "bg-white border-slate-200 hover:border-slate-300")}>
                  <div className="flex items-center justify-between mb-0.5">
                    <div className="flex items-center gap-1">
                      {f.type === "feature" ? <Lightbulb className="w-3 h-3 text-yellow-500" /> : <Bug className="w-3 h-3 text-red-500" />}
                      <span className="font-semibold text-slate-700 truncate">{f.title}</span>
                    </div>
                    <span className={cn("text-[10px] px-1.5 py-0.5 rounded-full font-medium", st.color)}>{st.label}</span>
                  </div>
                  <div className="flex items-center justify-between mt-1">
                    <span className="text-[10px] text-slate-400">{f.author_name} · {new Date(f.created_at).toLocaleDateString("ja-JP")}</span>
                    <span className="text-[10px] text-yellow-600 font-medium flex items-center gap-0.5"><ThumbsUp className="w-2.5 h-2.5" /> {f.like_count}</span>
                  </div>
                </button>
              );
            })}
          </div>
          {/* Detail */}
          <div className="flex-1">
            {selected ? (
              <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className={cn("text-[10px] px-2 py-0.5 rounded-full font-medium border", selected.type === "feature" ? "bg-yellow-50 text-yellow-700 border-yellow-200" : "bg-red-50 text-red-600 border-red-200")}>
                        {selected.type === "feature" ? "💡 改善提案" : "🐛 バグ報告"}
                      </span>
                      <span className="text-[10px] text-yellow-600 font-medium flex items-center gap-0.5"><ThumbsUp className="w-2.5 h-2.5" /> {selected.like_count}</span>
                    </div>
                    <h2 className="text-base font-bold text-slate-800">{selected.title}</h2>
                    <p className="text-[10px] text-slate-400 mt-0.5">{selected.author_name} · {new Date(selected.created_at).toLocaleString("ja-JP")}</p>
                  </div>
                  <button onClick={() => deleteFb(selected.id)} className="text-slate-300 hover:text-red-500 transition-colors p-1"><Trash2 className="w-4 h-4" /></button>
                </div>
                <div className="bg-slate-50 rounded-lg p-3 mb-3">
                  <p className="text-sm text-slate-600 whitespace-pre-wrap leading-relaxed">{selected.description || "（説明なし）"}</p>
                </div>
                {selected.screenshot_url && (
                  <div className="mb-3">
                    <a href={selected.screenshot_url} target="_blank" rel="noopener noreferrer">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={selected.screenshot_url} alt="添付画像" className="max-h-48 rounded-lg border border-slate-200" />
                    </a>
                  </div>
                )}
                <div className="flex gap-2">
                  {(Object.entries(FB_STATUS) as [FeedbackItem["status"], typeof FB_STATUS[keyof typeof FB_STATUS]][]).map(([key, cfg]) => {
                    const Icon = cfg.icon;
                    return (
                      <button key={key} onClick={() => updateStatus(selected.id, key)} className={cn("flex items-center gap-1 text-xs px-3 py-1.5 rounded-lg border transition-all", selected.status === key ? cfg.color + " border-transparent font-semibold" : "bg-white border-slate-200 text-slate-400 hover:bg-slate-50")}>
                        <Icon className="w-3 h-3" /> {cfg.label}
                      </button>
                    );
                  })}
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-center h-48 text-slate-300 text-sm">フィードバックを選択</div>
            )}
          </div>
        </div>
      )}

      {subTab === "changelog" && (
        <div className="space-y-3">
          {!showClForm ? (
            <button onClick={() => setShowClForm(true)} className="flex items-center gap-2 bg-yellow-400 hover:bg-yellow-500 text-slate-800 font-semibold px-4 py-2 rounded-xl text-sm shadow-sm transition-all">
              <Plus className="w-4 h-4" /> 改善履歴を追加
            </button>
          ) : (
            <div className="bg-white rounded-xl border border-slate-200 p-4 space-y-3 shadow-sm">
              <h3 className="text-sm font-bold text-slate-700">改善履歴を追加</h3>
              <div className="flex gap-2">
                {(["feature", "improvement", "bugfix"] as const).map(t => (
                  <button key={t} onClick={() => setClType(t)} className={cn("px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors", clType === t ? (t === "feature" ? "bg-green-50 text-green-700 border-green-300" : t === "improvement" ? "bg-blue-50 text-blue-700 border-blue-300" : "bg-red-50 text-red-700 border-red-300") : "bg-white text-slate-500 border-slate-200")}>
                    {t === "feature" ? "✨ 新機能" : t === "improvement" ? "🔧 改善" : "🐛 バグ修正"}
                  </button>
                ))}
              </div>
              <div className="flex gap-2">
                <input value={clVersion} onChange={e => setClVersion(e.target.value)} placeholder="v1.0.0" className="w-24 h-9 px-3 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-yellow-400/30" />
                <input value={clTitle} onChange={e => setClTitle(e.target.value)} placeholder="タイトル" className="flex-1 h-9 px-3 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-yellow-400/30" />
              </div>
              <textarea value={clDesc} onChange={e => setClDesc(e.target.value)} placeholder="詳細" rows={2} className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-yellow-400/30 resize-none" />
              <div className="flex gap-2 justify-end">
                <button onClick={() => setShowClForm(false)} className="px-3 py-1.5 text-xs text-slate-500 hover:bg-slate-50 rounded-lg">キャンセル</button>
                <button onClick={addChangelog} disabled={!clTitle.trim()} className="px-4 py-1.5 text-xs font-semibold bg-yellow-400 text-slate-800 rounded-lg hover:bg-yellow-500 disabled:opacity-50">追加</button>
              </div>
            </div>
          )}
          {changelog.map(item => (
            <div key={item.id} className="bg-white rounded-xl border border-slate-200 p-3 shadow-sm flex items-start gap-3">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-0.5">
                  <span className={cn("text-[10px] px-1.5 py-0.5 rounded-full font-medium", item.type === "feature" ? "bg-green-100 text-green-700" : item.type === "improvement" ? "bg-blue-100 text-blue-700" : "bg-red-100 text-red-600")}>
                    {item.type === "feature" ? "✨" : item.type === "improvement" ? "🔧" : "🐛"}
                  </span>
                  {item.version && <span className="text-[10px] text-slate-400 font-mono">v{item.version}</span>}
                  <span className="text-[10px] text-slate-400">{new Date(item.created_at).toLocaleDateString("ja-JP")}</span>
                </div>
                <h4 className="text-sm font-semibold text-slate-800">{item.title}</h4>
                {item.description && <p className="text-xs text-slate-500 mt-0.5">{item.description}</p>}
              </div>
              <button onClick={() => deleteChangelog(item.id)} className="text-slate-300 hover:text-red-500 transition-colors p-1 shrink-0"><Trash2 className="w-3.5 h-3.5" /></button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

/* ─── Page Wrapper ─── */
export default function AdminPage(): React.ReactElement {
  return (
    <AuthProvider>
      <AdminDashboard />
    </AuthProvider>
  );
}
