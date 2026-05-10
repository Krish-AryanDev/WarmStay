// Resolves the absolute site URL for sitemaps, OG tags, and shareable links.
// Precedence:
//   1. NEXT_PUBLIC_SITE_URL — explicit production setting (e.g. https://warmstay.in)
//   2. VERCEL_URL — auto-injected on Vercel preview & prod deploys
//   3. localhost fallback for `next dev`
function resolve(): string {
  const explicit = process.env.NEXT_PUBLIC_SITE_URL;
  if (explicit) return explicit.replace(/\/+$/, "");

  const vercel = process.env.VERCEL_URL;
  if (vercel) return `https://${vercel.replace(/\/+$/, "")}`;

  return "http://localhost:3000";
}

export const SITE_URL = resolve();
