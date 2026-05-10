import type { MetadataRoute } from "next";
import { supabase } from "@/lib/supabase";
import { SITE_URL } from "@/lib/site-url";

// Re-generated on each request (cheap query, table will stay small for a while).
// If/when the listings table grows past a few hundred rows, switch to
// `revalidate` with an ISR window.
export const dynamic = "force-dynamic";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date();

  const staticEntries: MetadataRoute.Sitemap = [
    {
      url: `${SITE_URL}/`,
      lastModified: now,
      changeFrequency: "daily",
      priority: 1.0
    }
  ];

  const { data, error } = await supabase
    .from("pgs")
    .select("slug, created_at")
    .eq("is_active", true)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("[sitemap] supabase error:", error.message);
    return staticEntries;
  }

  const pgEntries: MetadataRoute.Sitemap = (data ?? []).map((row) => ({
    url: `${SITE_URL}/pg/${row.slug as string}`,
    lastModified: row.created_at ? new Date(row.created_at as string) : now,
    changeFrequency: "weekly",
    priority: 0.8
  }));

  return [...staticEntries, ...pgEntries];
}
