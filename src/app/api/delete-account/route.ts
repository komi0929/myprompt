import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const dynamic = "force-dynamic";

function getAdminClient(): ReturnType<typeof createClient> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    throw new Error("Missing SUPABASE_SERVICE_ROLE_KEY");
  }
  return createClient(url, key, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}

export async function POST(request: Request): Promise<NextResponse> {
  try {
    const supabaseAdmin = getAdminClient();

    const { userId } = await request.json() as { userId: string };

    if (!userId || typeof userId !== "string") {
      return NextResponse.json({ error: "Missing userId" }, { status: 400 });
    }

    // Verify the requesting user matches (basic check via auth header)
    const authHeader = request.headers.get("authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token);
    if (authError || !user || user.id !== userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Delete user data first (cascade should handle most, but be explicit)
    const tables = ["likes", "favorites", "folders"] as const;
    for (const table of tables) {
      const { error } = await supabaseAdmin.from(table).delete().eq("user_id", userId);
      if (error) {
        console.error(`delete-account: ${table} deletion failed:`, error.message);
        return NextResponse.json({ error: `Failed to delete ${table}` }, { status: 500 });
      }
    }
    // Delete prompt_history for user's prompts before deleting prompts
    const { data: userPrompts } = await supabaseAdmin.from("prompts").select("id").eq("user_id", userId) as { data: { id: string }[] | null };
    if (userPrompts && userPrompts.length > 0) {
      const promptIds = userPrompts.map(p => p.id);
      const { error: histError } = await supabaseAdmin.from("prompt_history").delete().in("prompt_id", promptIds);
      if (histError) {
        console.error("delete-account: prompt_history deletion failed:", histError.message);
        return NextResponse.json({ error: "Failed to delete prompt_history" }, { status: 500 });
      }
    }
    const { error: promptsError } = await supabaseAdmin.from("prompts").delete().eq("user_id", userId);
    if (promptsError) {
      console.error("delete-account: prompts deletion failed:", promptsError.message);
      return NextResponse.json({ error: "Failed to delete prompts" }, { status: 500 });
    }
    const { error: profileError } = await supabaseAdmin.from("profiles").delete().eq("id", userId);
    if (profileError) {
      console.error("delete-account: profiles deletion failed:", profileError.message);
      return NextResponse.json({ error: "Failed to delete profile" }, { status: 500 });
    }

    // Delete the auth user completely
    const { error: deleteError } = await supabaseAdmin.auth.admin.deleteUser(userId);
    if (deleteError) {
      return NextResponse.json({ error: deleteError.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

