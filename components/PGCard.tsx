import Link from "next/link";
import type { PG } from "@/lib/types";

const genderLabel: Record<PG["gender"], string> = {
  boys: "Boys",
  girls: "Girls",
  both: "Co-living"
};

export default function PGCard({ pg }: { pg: PG }) {
  const cover = pg.photos?.[0];
  return (
    <Link
      href={`/pg/${pg.slug}`}
      className="group flex flex-col overflow-hidden rounded-xl border border-slate-200 bg-white transition hover:border-brand hover:shadow-md"
    >
      <div className="aspect-[4/3] w-full overflow-hidden bg-slate-100">
        {cover ? (
          // Plain img keeps things simple; switch to next/image once you host on Supabase Storage.
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={cover}
            alt={pg.name}
            className="h-full w-full object-cover transition group-hover:scale-105"
            loading="lazy"
          />
        ) : (
          <div className="grid h-full w-full place-items-center text-slate-400">No photo</div>
        )}
      </div>
      <div className="flex flex-1 flex-col gap-2 p-4">
        <div className="flex items-start justify-between gap-2">
          <h3 className="font-semibold leading-tight text-slate-900 group-hover:text-brand">
            {pg.name}
          </h3>
          <span className="shrink-0 rounded-full bg-slate-100 px-2 py-0.5 text-xs text-slate-600">
            {genderLabel[pg.gender]}
          </span>
        </div>
        <p className="text-sm text-slate-500">
          {pg.area ?? pg.address}
          {pg.distance_km != null && ` · ${pg.distance_km} km from MUJ`}
        </p>
        <div className="mt-auto flex items-end justify-between pt-2">
          <span className="text-sm text-slate-500">Starting</span>
          <span className="text-lg font-bold text-slate-900">
            ₹{pg.starting_price.toLocaleString("en-IN")}
            <span className="text-xs font-normal text-slate-500">/mo</span>
          </span>
        </div>
      </div>
    </Link>
  );
}
