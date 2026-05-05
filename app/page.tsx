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

  const activeCount = [params.gender, params.max, params.room].filter(Boolean).length;

  return (
    <div className="space-y-6 sm:space-y-4">
      {/* MOBILE: simple stacked hero + filter (no overlap) */}
      <div className="sm:hidden">
        <section className="relative overflow-hidden rounded-2xl bg-slate-900 text-white">
          <div className="absolute inset-0">
            <img
              src="https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?fit=crop&w=1600&q=80"
              alt=""
              className="h-full w-full object-cover opacity-70"
            />
            <div className="absolute inset-0 bg-gradient-to-b from-slate-900/40 via-slate-900/50 to-slate-900/80" />
          </div>
          <div className="relative px-5 py-10 text-center">
            <h1 className="text-2xl font-bold leading-tight tracking-tight">
              Book with HappyStay
            </h1>
            <p className="mx-auto mt-3 max-w-xl text-sm text-white/90">
              Verified listings · real photos · WhatsApp inquiry in one tap.
            </p>
          </div>
        </section>
        <div className="mt-5">
          <Filters />
        </div>
      </div>

      {/* DESKTOP: hero with filter card overlapping the bottom edge */}
      <div className="relative hidden sm:block">
        <section className="relative flex flex-col items-center justify-center overflow-hidden rounded-3xl bg-slate-900 px-6 py-10 text-center text-white sm:px-10 sm:py-12 lg:py-16">
          <div className="absolute inset-0">
            <img
              src="https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?fit=crop&w=1600&q=80"
              alt="Hero background"
              className="h-full w-full object-cover opacity-50"
            />
            <div className="absolute inset-0 bg-black/30 mix-blend-multiply" />
          </div>
          <div className="relative z-10 mb-6 max-w-3xl">
            <h1 className="text-3xl font-bold tracking-tight sm:text-4xl lg:text-5xl">
              Book your Hostel with HappyStay
            </h1>
            <p className="mt-3 text-sm text-white/90 sm:text-base lg:text-lg">
              Verified listings, real photos, transparent pricing. Inquire on WhatsApp in one click.
            </p>
          </div>
        </section>

        {/* Filter card floats over the hero's bottom edge */}
        <div className="absolute -bottom-8 left-0 right-0 z-20 mx-auto w-full max-w-5xl px-4 sm:px-6">
          <Filters />
        </div>
      </div>

      {/* Spacer so the floating filter card doesn't collide with the grid (desktop only) */}
      <div className="hidden h-10 sm:block" aria-hidden="true" />

      <div className="flex items-baseline justify-between">
        <h2 className="text-lg font-semibold text-slate-900 sm:text-xl">
          {pgs.length === 0
            ? "No PGs found"
            : `${pgs.length} PG${pgs.length === 1 ? "" : "s"} available`}
        </h2>
        {activeCount > 0 && (
          <span className="text-xs text-slate-500 sm:text-sm">
            {activeCount} filter{activeCount === 1 ? "" : "s"} active
          </span>
        )}
      </div>

      {pgs.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-8 text-center text-sm text-slate-500 sm:p-10 sm:text-base">
          No PGs match your filters. Try clearing them.
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-5 lg:grid-cols-3">
          {pgs.map((pg) => (
            <PGCard key={pg.id} pg={pg} />
          ))}
        </div>
      )}
    </div>
  );
}
