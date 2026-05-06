import "server-only";
import { createClient, SupabaseClient } from "@supabase/supabase-js";

let client: SupabaseClient | null = null;

function build(): SupabaseClient {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !serviceKey) {
    throw new Error(
      "Missing Supabase admin env vars. Set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY."
    );
  }

  return createClient(url, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false }
  });
}

export const supabaseAdmin = new Proxy({} as SupabaseClient, {
  get(_target, prop) {
    if (!client) client = build();
    // @ts-expect-error - dynamic forwarding
    return client[prop];
  }
});
