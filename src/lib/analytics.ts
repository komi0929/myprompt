import { supabase } from "@/lib/supabase";

/* ─── Session ID (persisted per browser session) ─── */
let _sessionId: string | null = null;

function getSessionId(): string {
  if (typeof window === "undefined") return "server";
  if (_sessionId) return _sessionId;
  let sid = sessionStorage.getItem("mp_session_id");
  if (!sid) {
    sid = crypto.randomUUID();
    sessionStorage.setItem("mp_session_id", sid);
  }
  _sessionId = sid;
  return sid;
}

/* ─── GA4 gtag helper ─── */
function gtagEvent(eventName: string, params?: Record<string, unknown>): void {
  if (typeof window === "undefined") return;
  const w = window as Window & { gtag?: (...args: unknown[]) => void };
  if (w.gtag) {
    w.gtag("event", eventName, params ?? {});
  }
}

/* ─── Event Names ─── */
export type AnalyticsEvent =
  | "page_view"
  | "sign_up"
  | "sign_in"
  | "prompt_create"
  | "prompt_copy"
  | "prompt_publish"
  | "prompt_like"
  | "prompt_favorite"
  | "search_execute"
  | "feedback_submit"
  | "prompt_edit"
  | "prompt_delete";

/* ─── Main Track Function ─── */
export function trackEvent(
  eventName: AnalyticsEvent,
  metadata?: Record<string, unknown>
): void {
  if (typeof window === "undefined") return;

  const sessionId = getSessionId();
  const userId = getCurrentUserId();

  // 1. Fire-and-forget insert to Supabase
  void (async () => {
    try {
      await supabase
        .from("analytics_events")
        .insert({
          event_name: eventName,
          session_id: sessionId,
          user_id: userId,
          metadata: metadata ?? {},
        });
    } catch {
      // silently fail — analytics should never block UX
    }
  })();

  // 2. Also send to GA4 if available
  gtagEvent(eventName, {
    session_id: sessionId,
    ...metadata,
  });
}

/* ─── Helper: get current user id from supabase session ─── */
function getCurrentUserId(): string | null {
  try {
    // Access synchronously from stored session
    const stored = localStorage.getItem("sb-parfxkcytzgwhzgkpzjx-auth-token");
    if (!stored) return null;
    const parsed = JSON.parse(stored) as { user?: { id?: string } };
    return parsed?.user?.id ?? null;
  } catch {
    return null;
  }
}

/* ─── Aggregate Today's KPI (called from admin dashboard) ─── */
export async function aggregateDailyKpi(date: string): Promise<void> {
  await supabase.rpc("aggregate_daily_kpi", { target_date: date });
}

/* ─── Fetch KPI data for admin dashboard ─── */
export interface DailyKpi {
  date: string;
  dau: number;
  new_signups: number;
  prompts_created: number;
  copies_executed: number;
  prompts_published: number;
  likes_given: number;
  favorites_given: number;
  searches: number;
  feedback_submitted: number;
}

export async function fetchRecentKpi(days: number = 7): Promise<DailyKpi[]> {
  const { data } = await supabase
    .from("daily_kpi")
    .select("*")
    .order("date", { ascending: false })
    .limit(days);
  return (data as DailyKpi[]) ?? [];
}
