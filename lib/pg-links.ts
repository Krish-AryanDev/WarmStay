import type { PgLink } from "@/lib/types";

export type LinkKind =
  | "instagram"
  | "youtube"
  | "facebook"
  | "maps"
  | "twitter"
  | "whatsapp"
  | "website";

export interface ResolvedLink {
  kind: LinkKind;
  url: string;
  label: string;
}

const DEFAULT_LABEL: Record<LinkKind, string> = {
  instagram: "Instagram",
  youtube: "YouTube",
  facebook: "Facebook",
  maps: "Google Maps",
  twitter: "Twitter",
  whatsapp: "WhatsApp",
  website: "Website"
};

function detectKind(host: string, pathname: string): LinkKind {
  if (host === "instagram.com" || host.endsWith(".instagram.com")) return "instagram";
  if (host === "youtube.com" || host === "youtu.be" || host.endsWith(".youtube.com")) return "youtube";
  if (host === "facebook.com" || host === "fb.com" || host.endsWith(".facebook.com")) return "facebook";
  if (host === "twitter.com" || host === "x.com") return "twitter";
  if (host === "wa.me" || host === "whatsapp.com" || host.endsWith(".whatsapp.com")) return "whatsapp";
  if (
    host === "maps.google.com" ||
    host === "maps.app.goo.gl" ||
    (host === "google.com" && pathname.startsWith("/maps")) ||
    (host.endsWith(".google.com") && pathname.startsWith("/maps"))
  )
    return "maps";
  return "website";
}

export function resolveLink(link: PgLink): ResolvedLink | null {
  const raw = link.url?.trim();
  if (!raw) return null;
  let parsed: URL;
  try {
    parsed = new URL(raw);
  } catch {
    return null;
  }
  if (parsed.protocol !== "http:" && parsed.protocol !== "https:") return null;

  const host = parsed.hostname.replace(/^www\./, "").toLowerCase();
  const kind = detectKind(host, parsed.pathname.toLowerCase());

  const customLabel = link.label?.trim();
  return {
    kind,
    url: parsed.toString(),
    label: customLabel || DEFAULT_LABEL[kind]
  };
}
