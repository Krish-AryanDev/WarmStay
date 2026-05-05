import Link from "next/link";
import { notFound } from "next/navigation";
import { supabase } from "@/lib/supabase";
import type { PG } from "@/lib/types";

export const revalidate = 60;

async function fetchPG(slug: string): Promise<PG | null> {
  const { data, error } = await supabase
    .from("pgs")
    .select("*")
    .eq("slug", slug)
    .eq("is_active", true)
    .maybeSingle();
  if (error) {
    console.error("[pg detail] supabase error:", error.message);
    return null;
  }
  return data as PG | null;
}

const amenityLabel: Record<string, string> = {
  wifi: "Wi-Fi",
  food: "Food",
  laundry: "Laundry",
  parking: "Parking",
  cctv: "CCTV",
  ac: "AC",
  ro_water: "RO Water",
  warden: "Warden"
};

const genderLabel = (g: string) =>
  g === "both" ? "Co-living" : g === "boys" ? "Boys" : "Girls";

export default async function PGDetail({
  params
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const pg = await fetchPG(slug);
  if (!pg) notFound();

  const activeAmenities = Object.entries(pg.amenities ?? {})
    .filter(([, v]) => v === true)
    .map(([k]) => k);

  return (
    <article className="space-y-6 pb-24 sm:space-y-6 sm:pb-8">
      <Link
        href="/"
        className="inline-flex items-center gap-1 text-sm text-slate-500 hover:text-brand"
      >
        ← Back to all PGs
      </Link>

      {/* DESKTOP: title block ABOVE the gallery (Airbnb pattern) */}
      <div className="hidden sm:block">
        <div className="flex items-end justify-between gap-6">
          <div className="min-w-0">
            <h1 className="text-3xl font-bold leading-tight text-slate-900 lg:text-4xl">
              {pg.name}
            </h1>
            <p className="mt-2 flex flex-wrap items-center gap-x-2 text-sm text-slate-600">
              <PinIcon className="h-4 w-4 text-slate-500" />
              <span>{pg.address}</span>
              {pg.distance_km != null && (
                <>
                  <span className="text-slate-300">·</span>
                  <span>{pg.distance_km} km from MUJ</span>
                </>
              )}
            </p>
          </div>
          <div className="flex shrink-0 gap-2 text-xs">
            <span className="rounded-full bg-slate-100 px-3 py-1.5 font-medium capitalize text-slate-700">
              {genderLabel(pg.gender)}
            </span>
            <span className="rounded-full bg-emerald-50 px-3 py-1.5 font-semibold text-emerald-700">
              From ₹{pg.starting_price.toLocaleString("en-IN")}/mo
            </span>
          </div>
        </div>
      </div>

      {/* PHOTOS */}
      {pg.photos.length === 0 ? (
        <div className="grid aspect-[16/9] place-items-center rounded-2xl bg-slate-100 text-slate-400">
          No photos yet
        </div>
      ) : (
        <>
          {/* MOBILE: horizontal scroll (UNCHANGED) */}
          <div className="scrollbar-hide -mx-4 flex snap-x snap-mandatory gap-2 overflow-x-auto px-4 sm:hidden">
            {pg.photos.map((url, i) => (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                key={i}
                src={url}
                alt={`${pg.name} photo ${i + 1}`}
                className="aspect-[4/3] w-[88%] flex-none snap-center rounded-2xl object-cover"
              />
            ))}
          </div>

          {/* DESKTOP: Airbnb-style hero gallery — 1 large + up to 4 thumbs */}
          <div className="relative hidden h-[420px] grid-cols-4 grid-rows-2 gap-2 overflow-hidden rounded-2xl sm:grid lg:h-[480px]">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={pg.photos[0]}
              alt={`${pg.name} photo 1`}
              className="col-span-2 row-span-2 h-full w-full cursor-pointer object-cover transition hover:brightness-95"
            />
            {pg.photos.slice(1, 5).map((url, i) => (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                key={i}
                src={url}
                alt={`${pg.name} photo ${i + 2}`}
                className="h-full w-full cursor-pointer object-cover transition hover:brightness-95"
              />
            ))}
            {pg.photos.length > 5 && (
              <div className="absolute bottom-4 right-4 rounded-full bg-white/95 px-4 py-2 text-sm font-semibold text-slate-900 shadow-md backdrop-blur">
                + {pg.photos.length - 5} photos
              </div>
            )}
          </div>
        </>
      )}

      {/* MOBILE-ONLY: header block (UNCHANGED) */}
      <div className="flex flex-col gap-4 sm:hidden">
        <div className="min-w-0">
          <h1 className="text-2xl font-bold leading-tight">{pg.name}</h1>
          <p className="mt-1.5 text-sm text-slate-500">
            {pg.address}
            {pg.distance_km != null && ` · ${pg.distance_km} km from MUJ`}
          </p>
          <div className="mt-3 flex flex-wrap gap-2 text-xs">
            <span className="rounded-full bg-slate-100 px-2.5 py-1 font-medium capitalize">
              {pg.gender === "both" ? "Co-living" : pg.gender}
            </span>
            <span className="rounded-full bg-emerald-50 px-2.5 py-1 font-semibold text-emerald-700">
              From ₹{pg.starting_price.toLocaleString("en-IN")}/mo
            </span>
          </div>
        </div>
      </div>

      {/* MOBILE-ONLY: description (UNCHANGED) */}
      {pg.description && (
        <section className="sm:hidden">
          <h2 className="mb-2 text-lg font-semibold">About</h2>
          <p className="text-[15px] leading-relaxed text-slate-700">{pg.description}</p>
        </section>
      )}

      {/* MOBILE-ONLY: rooms (UNCHANGED) */}
      <section className="sm:hidden">
        <h2 className="mb-3 text-lg font-semibold">Rooms & pricing</h2>
        <div className="space-y-2">
          {pg.room_types.map((r, i) => (
            <div
              key={i}
              className="flex items-center justify-between rounded-2xl border border-slate-200 bg-white p-4"
            >
              <div>
                <div className="font-semibold capitalize text-slate-900">
                  {r.type} sharing
                </div>
                <div className="mt-0.5 flex flex-wrap gap-x-3 gap-y-0.5 text-xs text-slate-500">
                  <span>{r.ac ? "AC" : "Non-AC"}</span>
                  <span className={r.available > 0 ? "text-emerald-600" : "text-red-500"}>
                    {r.available > 0 ? `${r.available} available` : "Full"}
                  </span>
                </div>
              </div>
              <div className="text-right">
                <div className="text-base font-bold text-slate-900">
                  ₹{r.price.toLocaleString("en-IN")}
                </div>
                <div className="text-[11px] text-slate-500">/month</div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* MOBILE-ONLY: amenities (UNCHANGED) */}
      {activeAmenities.length > 0 && (
        <section className="sm:hidden">
          <h2 className="mb-3 text-lg font-semibold">Amenities</h2>
          <ul className="flex flex-wrap gap-2">
            {activeAmenities.map((a) => (
              <li
                key={a}
                className="rounded-full border border-slate-200 bg-white px-3 py-1.5 text-sm text-slate-700"
              >
                {amenityLabel[a] ?? a}
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* DESKTOP: 2-column body — main content + sticky booking sidebar */}
      <div className="hidden gap-10 sm:grid sm:grid-cols-[minmax(0,1fr)_360px] sm:pt-2 lg:gap-14">
        {/* MAIN COLUMN */}
        <div className="min-w-0">
          {/* Quick highlights row */}
          <div className="grid grid-cols-3 gap-3 rounded-2xl border border-slate-200 bg-white p-4">
            <Highlight
              icon={<UsersIcon className="h-5 w-5 text-brand" />}
              label="Type"
              value={genderLabel(pg.gender)}
            />
            <Highlight
              icon={<PinIcon className="h-5 w-5 text-brand" />}
              label="Distance"
              value={pg.distance_km != null ? `${pg.distance_km} km` : "—"}
            />
            <Highlight
              icon={<HomeIcon className="h-5 w-5 text-brand" />}
              label="Room types"
              value={`${pg.room_types.length}`}
            />
          </div>

          {/* About */}
          {pg.description && (
            <section className="mt-8 border-t border-slate-100 pt-8">
              <h2 className="mb-3 text-xl font-semibold text-slate-900">About this PG</h2>
              <p className="text-[15px] leading-relaxed text-slate-700">{pg.description}</p>
            </section>
          )}

          {/* Rooms — card grid */}
          <section className="mt-8 border-t border-slate-100 pt-8">
            <h2 className="mb-4 text-xl font-semibold text-slate-900">Rooms & pricing</h2>
            <div className="grid gap-3 lg:grid-cols-2">
              {pg.room_types.map((r, i) => (
                <div
                  key={i}
                  className="flex items-start justify-between rounded-2xl border border-slate-200 bg-white p-5 transition hover:border-brand hover:shadow-sm"
                >
                  <div>
                    <div className="text-base font-semibold capitalize text-slate-900">
                      {r.type} sharing
                    </div>
                    <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs">
                      <span className="rounded-full bg-slate-100 px-2 py-0.5 font-medium text-slate-600">
                        {r.ac ? "AC" : "Non-AC"}
                      </span>
                      <span
                        className={`inline-flex items-center gap-1 font-medium ${
                          r.available > 0 ? "text-emerald-600" : "text-red-500"
                        }`}
                      >
                        <span
                          className={`h-1.5 w-1.5 rounded-full ${
                            r.available > 0 ? "bg-emerald-500" : "bg-red-500"
                          }`}
                        />
                        {r.available > 0 ? `${r.available} available` : "Full"}
                      </span>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-xl font-bold text-slate-900">
                      ₹{r.price.toLocaleString("en-IN")}
                    </div>
                    <div className="text-[11px] text-slate-500">/month</div>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* Amenities — icon grid */}
          {activeAmenities.length > 0 && (
            <section className="mt-8 border-t border-slate-100 pt-8">
              <h2 className="mb-4 text-xl font-semibold text-slate-900">What this PG offers</h2>
              <ul className="grid grid-cols-2 gap-3 lg:grid-cols-3">
                {activeAmenities.map((a) => (
                  <li
                    key={a}
                    className="flex items-center gap-3 rounded-xl border border-slate-200 bg-white px-3.5 py-3 text-sm font-medium text-slate-700"
                  >
                    <AmenityIcon name={a} />
                    {amenityLabel[a] ?? a}
                  </li>
                ))}
              </ul>
            </section>
          )}
        </div>

        {/* STICKY BOOKING SIDEBAR */}
        <aside>
          <div className="sticky top-24">
            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-lg">
              <div className="flex items-baseline gap-1.5">
                <span className="text-3xl font-bold text-slate-900">
                  ₹{pg.starting_price.toLocaleString("en-IN")}
                </span>
                <span className="text-sm text-slate-500">/ month</span>
              </div>
              <p className="mt-1 text-xs text-slate-500">
                Starting price · final rent depends on room type
              </p>

              <div className="my-5 space-y-3 rounded-xl bg-slate-50 p-4 text-sm">
                <SidebarRow label="Gender" value={genderLabel(pg.gender)} />
                {pg.distance_km != null && (
                  <SidebarRow label="Distance from MUJ" value={`${pg.distance_km} km`} />
                )}
                <SidebarRow label="Room options" value={`${pg.room_types.length}`} />
                {pg.owner_name && <SidebarRow label="Managed by" value={pg.owner_name} />}
              </div>

              <Link
                href={`/inquiry/${pg.slug}`}
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-brand px-5 py-3.5 font-semibold text-white shadow-sm transition hover:bg-brand-dark"
              >
                Check Availability
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth={2.2}
                  stroke="currentColor"
                  className="h-4 w-4"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M13.5 4.5 21 12m0 0-7.5 7.5M21 12H3"
                  />
                </svg>
              </Link>

              <p className="mt-3 text-center text-xs text-slate-500">
                Free · WhatsApp inquiry · No charges
              </p>
            </div>

            {/* Trust note */}
            <div className="mt-4 rounded-2xl border border-slate-200 bg-white p-4 text-xs text-slate-600">
              <div className="mb-1 flex items-center gap-2 font-semibold text-slate-900">
                <ShieldIcon className="h-4 w-4 text-emerald-600" />
                Verified listing
              </div>
              Visited and verified by the HappyStay team. Real photos, no surprises.
            </div>
          </div>
        </aside>
      </div>

      {/* MOBILE STICKY CTA BAR (UNCHANGED) */}
      <div
        className="fixed inset-x-0 bottom-0 z-20 border-t border-slate-200 bg-white/95 px-4 py-3 backdrop-blur sm:hidden"
        style={{ paddingBottom: "calc(0.75rem + env(safe-area-inset-bottom))" }}
      >
        <div className="mx-auto flex max-w-6xl items-center gap-3">
          <div className="min-w-0 flex-1">
            <div className="text-[11px] uppercase tracking-wide text-slate-500">From</div>
            <div className="truncate text-base font-bold text-slate-900">
              ₹{pg.starting_price.toLocaleString("en-IN")}
              <span className="text-xs font-normal text-slate-500">/mo</span>
            </div>
          </div>
          <Link
            href={`/inquiry/${pg.slug}`}
            className="flex-1 rounded-xl bg-brand px-5 py-3 text-center text-sm font-semibold text-white shadow-sm active:bg-brand-dark"
          >
            Check Availability
          </Link>
        </div>
      </div>
    </article>
  );
}

function Highlight({
  icon,
  label,
  value
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-center gap-3">
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-brand/10">
        {icon}
      </div>
      <div className="min-w-0">
        <div className="text-[11px] uppercase tracking-wide text-slate-500">{label}</div>
        <div className="truncate text-sm font-semibold text-slate-900">{value}</div>
      </div>
    </div>
  );
}

function SidebarRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-2">
      <span className="text-slate-600">{label}</span>
      <span className="truncate font-medium text-slate-900">{value}</span>
    </div>
  );
}

/* ----------------- ICONS ----------------- */

function PinIcon({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
      strokeWidth={1.8}
      stroke="currentColor"
      className={className}
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M15 10.5a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z"
      />
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1 1 15 0Z"
      />
    </svg>
  );
}

function UsersIcon({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
      strokeWidth={1.8}
      stroke="currentColor"
      className={className}
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M15 19.128a9.38 9.38 0 0 0 2.625.372 9.337 9.337 0 0 0 4.121-.952 4.125 4.125 0 0 0-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 0 1 8.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0 1 11.964-3.07M12 6.375a3.375 3.375 0 1 1-6.75 0 3.375 3.375 0 0 1 6.75 0Zm8.25 2.25a2.625 2.625 0 1 1-5.25 0 2.625 2.625 0 0 1 5.25 0Z"
      />
    </svg>
  );
}

function HomeIcon({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
      strokeWidth={1.8}
      stroke="currentColor"
      className={className}
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M2.25 12 12 2.25 21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75"
      />
    </svg>
  );
}

function ShieldIcon({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
      strokeWidth={1.8}
      stroke="currentColor"
      className={className}
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M9 12.75 11.25 15 15 9.75M21 12c0 4.97-4.03 9-9 9s-9-4.03-9-9 4.03-9 9-9 9 4.03 9 9Z"
      />
    </svg>
  );
}

function AmenityIcon({ name }: { name: string }) {
  const common = {
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 1.8,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
    className: "h-5 w-5 shrink-0 text-brand",
    viewBox: "0 0 24 24"
  };

  switch (name) {
    case "wifi":
      return (
        <svg {...common}>
          <path d="M5 12.55a11 11 0 0 1 14.08 0" />
          <path d="M1.42 9a16 16 0 0 1 21.16 0" />
          <path d="M8.53 16.11a6 6 0 0 1 6.95 0" />
          <path d="M12 20h.01" />
        </svg>
      );
    case "food":
      return (
        <svg {...common}>
          <path d="M3 2v7c0 1.1.9 2 2 2h4" />
          <path d="M7 2v20" />
          <path d="M21 15V2a5 5 0 0 0-5 5v6c0 1.1.9 2 2 2h3Zm0 0v7" />
        </svg>
      );
    case "laundry":
      return (
        <svg {...common}>
          <rect x="4" y="2.5" width="16" height="19" rx="2" />
          <circle cx="12" cy="13" r="4.5" />
          <circle cx="8" cy="6" r="0.5" fill="currentColor" />
          <circle cx="11" cy="6" r="0.5" fill="currentColor" />
        </svg>
      );
    case "parking":
      return (
        <svg {...common}>
          <rect width="18" height="18" x="3" y="3" rx="2" />
          <path d="M9 17V7h4a3 3 0 0 1 0 6H9" />
        </svg>
      );
    case "cctv":
      return (
        <svg {...common}>
          <path d="M16.75 12 22 7.25v9.5L16.75 12Z" />
          <rect x="2" y="6" width="14" height="12" rx="2" />
          <circle cx="9" cy="12" r="2.5" />
        </svg>
      );
    case "ac":
      return (
        <svg {...common}>
          <path d="M12 2v20" />
          <path d="M2 12h20" />
          <path d="m4.5 4.5 15 15" />
          <path d="m19.5 4.5-15 15" />
        </svg>
      );
    case "ro_water":
      return (
        <svg {...common}>
          <path d="M12 2.69 5.42 9.27a8 8 0 1 0 13.16 0Z" />
        </svg>
      );
    case "warden":
      return (
        <svg {...common}>
          <path d="M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8Z" />
          <path d="M4 21a8 8 0 0 1 16 0" />
        </svg>
      );
    default:
      return (
        <svg {...common}>
          <circle cx="12" cy="12" r="9" />
          <path d="m9 12 2 2 4-4" />
        </svg>
      );
  }
}
