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
    <article className="space-y-6">
      <Link href="/" className="text-sm text-slate-500 hover:text-brand">
        ← Back to all PGs
      </Link>

      {/* Photos */}
      <div className="grid gap-2 sm:grid-cols-2">
        {pg.photos.length > 0 ? (
          pg.photos.slice(0, 4).map((url, i) => (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              key={i}
              src={url}
              alt={`${pg.name} photo ${i + 1}`}
              className={`w-full rounded-xl object-cover ${
                i === 0 ? "aspect-[16/9] sm:col-span-2" : "aspect-[4/3]"
              }`}
            />
          ))
        ) : (
          <div className="grid aspect-[16/9] place-items-center rounded-xl bg-slate-100 text-slate-400 sm:col-span-2">
            No photos yet
          </div>
        )}
      </div>

      {/* Header + CTA */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold sm:text-3xl">{pg.name}</h1>
          <p className="mt-1 text-slate-500">
            {pg.address}
            {pg.distance_km != null && ` · ${pg.distance_km} km from MUJ`}
          </p>
          <div className="mt-2 flex flex-wrap gap-2 text-xs">
            <span className="rounded-full bg-slate-100 px-2 py-0.5">
              {pg.gender === "both" ? "Co-living" : pg.gender}
            </span>
            <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-emerald-700">
              From ₹{pg.starting_price.toLocaleString("en-IN")}/mo
            </span>
          </div>
        </div>
        <Link
          href={`/inquiry/${pg.slug}`}
          className="rounded-xl bg-brand px-5 py-3 text-center font-semibold text-white shadow-sm transition hover:bg-brand-dark"
        >
          Check Availability
        </Link>
      </div>

      {/* Description */}
      {pg.description && (
        <section>
          <h2 className="mb-2 text-lg font-semibold">About</h2>
          <p className="leading-relaxed text-slate-700">{pg.description}</p>
        </section>
      )}

      {/* Room types */}
      <section>
        <h2 className="mb-3 text-lg font-semibold">Rooms & pricing</h2>
        <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
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
                className="rounded-full border border-slate-200 bg-white px-3 py-1 text-sm text-slate-700"
              >
                {a}
              </li>
            ))}
          </ul>
        </section>
      )}

      <div className="sticky bottom-4 sm:hidden">
        <Link
          href={`/inquiry/${pg.slug}`}
          className="block rounded-xl bg-brand px-5 py-3 text-center font-semibold text-white shadow-lg"
        >
          Check Availability
        </Link>
      </div>
    </article>
  );
}
