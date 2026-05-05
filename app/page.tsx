import { supabase } from "@/lib/supabase";
import type { PG, RoomType } from "@/lib/types";
import PGCard from "@/components/PGCard";
import Filters from "@/components/Filters";

export const revalidate = 60;

interface SearchParams {
  gender?: string;
  max?: string;
  room?: string;
}

async function fetchPGs(params: SearchParams): Promise<PG[]> {
  let query = supabase
    .from("pgs")
    .select("*")
    .eq("is_active", true)
    .order("starting_price", { ascending: true });

  if (params.gender && ["boys", "girls", "both"].includes(params.gender)) {
    query = query.eq("gender", params.gender);
  }
  if (params.max) {
    const max = Number(params.max);
    if (!Number.isNaN(max)) query = query.lte("starting_price", max);
  }

  const { data, error } = await query;
  if (error) {
    console.error("[home] supabase error:", error.message);
    return [];
  }

  let pgs = (data ?? []) as PG[];

  // Room-type filter is JSONB-side; do it in JS (small N).
  if (params.room && ["single", "double", "triple"].includes(params.room)) {
    const want = params.room as RoomType;
    pgs = pgs.filter((pg) => pg.room_types?.some((r) => r.type === want && r.available > 0));
  }

  return pgs;
}

export default async function HomePage({
  searchParams
}: {
  searchParams: Promise<SearchParams>;
}) {
  const params = await searchParams;
  const pgs = await fetchPGs(params);

  return (
    <div className="space-y-12">
      <div className="relative">
        <section className="relative flex flex-col items-center justify-center overflow-hidden rounded-3xl bg-slate-900 px-6 py-16 text-center text-white sm:px-10">
          <div className="absolute inset-0">
            <img
              src="https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?fit=crop&w=1600&q=80"
              alt="Hero background"
              className="h-full w-full object-cover opacity-50"
            />
            <div className="absolute inset-0 bg-black/30 mix-blend-multiply" />
          </div>
          <div className="relative z-10 mb-5 mt-4">
            <h1 className="text-3xl font-bold tracking-tight sm:text-5xl">Book your Hostel with HappyStay</h1>
            <p className="mt-4 max-w-2xl text-base text-white/90 sm:text-lg">
              Verified listings, real photos, transparent pricing. Inquire on WhatsApp in one click.
            </p>
          </div>
        </section>

        <div className="absolute -bottom-8 left-0 right-0 z-20 mx-auto w-full max-w-4xl px-4 sm:px-6">
          <Filters />
        </div>
      </div>

      {pgs.length === 0 ? (
        <div className="rounded-xl border border-dashed border-slate-300 bg-white p-10 text-center text-slate-500">
          No PGs match your filters. Try clearing them.
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {pgs.map((pg) => (
            <PGCard key={pg.id} pg={pg} />
          ))}
        </div>
      )}
    </div>
  );
}
