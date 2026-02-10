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

    // Delete user data — errors are logged but don't block deletion
    // (missing rows or tables that don't exist yet should not prevent account deletion)
    const del = async (table: string, col: string, id: string): Promise<void> => {
      const { error } = await supabaseAdmin.from(table).delete().eq(col, id);
      if (error) console.warn(`delete-account: ${table} cleanup warning:`, error.message);
    };

    await del("likes", "user_id", userId);
    await del("favorites", "user_id", userId);
    await del("folders", "user_id", userId);

    // Delete prompt_history for user's prompts before deleting prompts
    const { data: userPrompts } = await supabaseAdmin.from("prompts").select("id").eq("user_id", userId) as { data: { id: string }[] | null };
    if (userPrompts && userPrompts.length > 0) {
      const promptIds = userPrompts.map(p => p.id);
      await supabaseAdmin.from("prompt_history").delete().in("prompt_id", promptIds)
        .then(({ error }) => { if (error) console.warn("delete-account: prompt_history cleanup warning:", error.message); });
    }

    await del("prompts", "user_id", userId);
    await del("profiles", "id", userId);

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

