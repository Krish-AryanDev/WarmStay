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
    .map(([k]) => amenityLabel[k] ?? k);

  return (
    <article className="space-y-6 pb-24 sm:pb-6">
      <Link
        href="/"
        className="inline-flex items-center gap-1 text-sm text-slate-500 hover:text-brand"
      >
        ← Back to all PGs
      </Link>

      {/* Photos: horizontal scroll on mobile, grid on desktop */}
      {pg.photos.length > 0 ? (
        <>
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
          <div className="hidden gap-2 sm:grid sm:grid-cols-2">
            {pg.photos.slice(0, 4).map((url, i) => (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                key={i}
                src={url}
                alt={`${pg.name} photo ${i + 1}`}
                className={`w-full rounded-xl object-cover ${
                  i === 0 ? "aspect-[16/9] sm:col-span-2" : "aspect-[4/3]"
                }`}
              />
            ))}
          </div>
        </>
      ) : (
        <div className="grid aspect-[16/9] place-items-center rounded-2xl bg-slate-100 text-slate-400">
          No photos yet
        </div>
      )}

      {/* Header + CTA */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <h1 className="text-2xl font-bold leading-tight sm:text-3xl">{pg.name}</h1>
          <p className="mt-1.5 text-sm text-slate-500 sm:text-base">
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
        <Link
          href={`/inquiry/${pg.slug}`}
          className="hidden shrink-0 rounded-xl bg-brand px-5 py-3 text-center font-semibold text-white shadow-sm transition hover:bg-brand-dark sm:inline-block"
        >
          Check Availability
        </Link>
      </div>

      {/* Description */}
      {pg.description && (
        <section>
          <h2 className="mb-2 text-lg font-semibold">About</h2>
          <p className="text-[15px] leading-relaxed text-slate-700">{pg.description}</p>
        </section>
      )}

      {/* Room types: cards on mobile, table on desktop */}
      <section>
        <h2 className="mb-3 text-lg font-semibold">Rooms & pricing</h2>
        <div className="space-y-2 sm:hidden">
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
        <div className="hidden overflow-hidden rounded-xl border border-slate-200 bg-white sm:block">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-left text-slate-600">
              <tr>
                <th className="px-4 py-2">Type</th>
                <th className="px-4 py-2">AC</th>
                <th className="px-4 py-2">Available</th>
                <th className="px-4 py-2 text-right">Price / month</th>
              </tr>
            </thead>
            <tbody>
              {pg.room_types.map((r, i) => (
                <tr key={i} className="border-t border-slate-100">
                  <td className="px-4 py-2 capitalize">{r.type}</td>
                  <td className="px-4 py-2">{r.ac ? "Yes" : "No"}</td>
                  <td className="px-4 py-2">{r.available}</td>
                  <td className="px-4 py-2 text-right font-semibold">
                    ₹{r.price.toLocaleString("en-IN")}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* Amenities */}
      {activeAmenities.length > 0 && (
        <section>
          <h2 className="mb-3 text-lg font-semibold">Amenities</h2>
          <ul className="flex flex-wrap gap-2">
            {activeAmenities.map((a) => (
              <li
                key={a}
                className="rounded-full border border-slate-200 bg-white px-3 py-1.5 text-sm text-slate-700"
              >
                {a}
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* Sticky mobile CTA bar */}
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
