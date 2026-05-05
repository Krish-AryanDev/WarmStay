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
      className="group flex flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white transition active:scale-[0.99] sm:hover:border-brand sm:hover:shadow-md"
    >
      <div className="relative aspect-[16/10] w-full overflow-hidden bg-slate-100 sm:aspect-[4/3]">
        {cover ? (
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
        <span className="absolute left-3 top-3 rounded-full bg-white/95 px-2.5 py-1 text-[11px] font-semibold text-slate-700 shadow-sm backdrop-blur">
          {genderLabel[pg.gender]}
        </span>
        {pg.distance_km != null && (
          <span className="absolute right-3 top-3 rounded-full bg-slate-900/80 px-2.5 py-1 text-[11px] font-semibold text-white shadow-sm backdrop-blur">
            {pg.distance_km} km from MUJ
          </span>
        )}
      </div>
      <div className="flex flex-1 flex-col gap-1.5 p-4">
        <h3 className="line-clamp-1 text-base font-semibold leading-tight text-slate-900 group-hover:text-brand sm:text-lg">
          {pg.name}
        </h3>
        <p className="line-clamp-1 text-sm text-slate-500">{pg.area ?? pg.address}</p>
        <div className="mt-2 flex items-end justify-between border-t border-slate-100 pt-3">
          <div>
            <div className="text-[11px] uppercase tracking-wide text-slate-500">Starting at</div>
            <div className="text-lg font-bold text-slate-900 sm:text-xl">
              ₹{pg.starting_price.toLocaleString("en-IN")}
              <span className="text-xs font-normal text-slate-500">/mo</span>
            </div>
          </div>
          <span className="rounded-full bg-brand/10 px-3 py-1.5 text-xs font-semibold text-brand">
            View →
          </span>
        </div>
      </div>
    </Link>
  );
}
