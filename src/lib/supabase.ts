import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

/** Custom fetch that silently handles AbortError (Next.js Strict Mode double-mount) */
const resilientFetch: typeof globalThis.fetch = async (input, init) => {
  try {
    return await globalThis.fetch(input, init);
  } catch (e) {
    if (e instanceof DOMException && e.name === "AbortError") {
      return new Response(JSON.stringify({}), { status: 499, statusText: "Aborted" });
    }
    throw e;
  }
};

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  global: { fetch: resilientFetch },
});
