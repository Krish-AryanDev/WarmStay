import Link from "next/link";
import { redirect } from "next/navigation";
import { isAdminAuthed } from "@/lib/admin-session";
import { supabaseAdmin } from "@/lib/supabase-admin";
import type { PG } from "@/lib/types";
import { togglePgActive } from "./actions";
import DeleteButton from "./DeleteButton";

export const dynamic = "force-dynamic";

interface SearchParams {
  created?: string;
  updated?: string;
  deleted?: string;
}

async function fetchPGs(): Promise<PG[]> {
  const { data, error } = await supabaseAdmin
    .from("pgs")
    .select("*")
    .order("created_at", { ascending: false });
  if (error) {
    console.error("[admin/pgs] fetch error:", error.message);
    return [];
  }
  return (data ?? []) as PG[];
}

export default async function AdminPGsPage({
  searchParams
}: {
  searchParams: Promise<SearchParams>;
}) {
  if (!(await isAdminAuthed())) redirect("/admin/login");

  const params = await searchParams;
  const pgs = await fetchPGs();

  const banner =
    params.created === "1"
      ? { tone: "green", text: "PG created successfully." }
      : params.updated === "1"
      ? { tone: "green", text: "Changes saved." }
      : params.deleted === "1"
      ? { tone: "amber", text: "PG deleted." }
      : null;

  const activeCount = pgs.filter((p) => p.is_active).length;

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold text-slate-900 sm:text-xl">PG listings</h2>
          <p className="text-sm text-slate-500">
            {pgs.length} total · {activeCount} published
          </p>
        </div>
        <Link
          href="/admin/pgs/new"
          className="rounded-xl bg-brand px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-brand-dark"
        >
          + Add new PG
        </Link>
      </div>

      {banner && (
        <div
          className={`rounded-xl border px-4 py-3 text-sm ${
            banner.tone === "green"
              ? "border-emerald-100 bg-emerald-50 text-emerald-700"
              : "border-amber-100 bg-amber-50 text-amber-800"
          }`}
        >
          {banner.text}
        </div>
      )}

      {pgs.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-12 text-center">
          <p className="text-sm text-slate-500">No PGs yet.</p>
          <Link
            href="/admin/pgs/new"
            className="mt-3 inline-block rounded-xl bg-brand px-4 py-2 text-sm font-semibold text-white"
          >
            Add your first PG
          </Link>
        </div>
      ) : (
        <>
          {/* MOBILE */}
          <div className="space-y-3 sm:hidden">
            {pgs.map((pg) => (
              <PGCardRow key={pg.id} pg={pg} />
            ))}
          </div>

          {/* DESKTOP */}
          <div className="hidden overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm sm:block">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                <tr>
                  <th className="px-4 py-3 font-semibold">PG</th>
                  <th className="px-4 py-3 font-semibold">Area</th>
                  <th className="px-4 py-3 font-semibold">Gender</th>
                  <th className="px-4 py-3 font-semibold">From</th>
                  <th className="px-4 py-3 font-semibold">Rooms</th>
                  <th className="px-4 py-3 font-semibold">Status</th>
                  <th className="px-4 py-3 text-right font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {pgs.map((pg) => (
                  <tr key={pg.id} className={pg.is_active ? "" : "bg-slate-50/60"}>
                    <td className="px-4 py-3 align-top">
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-14 shrink-0 overflow-hidden rounded-md bg-slate-100">
                          {pg.photos[0] ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img
                              src={pg.photos[0]}
                              alt=""
                              className="h-full w-full object-cover"
                            />
                          ) : null}
                        </div>
                        <div className="min-w-0">
                          <Link
                            href={`/pg/${pg.slug}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="font-medium text-slate-900 hover:text-brand"
                          >
                            {pg.name}
                          </Link>
                          <div className="truncate text-xs text-slate-500">/{pg.slug}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 align-top text-slate-700">
                      {pg.area ?? "—"}
                      {pg.distance_km != null && (
                        <div className="text-xs text-slate-500">{pg.distance_km} km</div>
                      )}
                    </td>
                    <td className="px-4 py-3 align-top capitalize text-slate-700">
                      {pg.gender === "both" ? "Co-living" : pg.gender}
                    </td>
                    <td className="px-4 py-3 align-top text-slate-700">
                      ₹{pg.starting_price.toLocaleString("en-IN")}
                    </td>
                    <td className="px-4 py-3 align-top text-slate-700">
                      {pg.room_types.length}
                    </td>
                    <td className="px-4 py-3 align-top">
                      <ToggleActive id={pg.id} active={pg.is_active} />
                    </td>
                    <td className="px-4 py-3 align-top">
                      <div className="flex items-center justify-end gap-2">
                        <Link
                          href={`/admin/pgs/${pg.id}/edit`}
                          className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 hover:border-brand hover:text-brand"
                        >
                          Edit
                        </Link>
                        <DeleteButton id={pg.id} name={pg.name} />
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}

function PGCardRow({ pg }: { pg: PG }) {
  return (
    <div
      className={`overflow-hidden rounded-2xl border shadow-sm ${
        pg.is_active ? "border-slate-200 bg-white" : "border-slate-200 bg-slate-50"
      }`}
    >
      <div className="flex gap-3 p-3">
        <div className="h-20 w-24 shrink-0 overflow-hidden rounded-lg bg-slate-100">
          {pg.photos[0] ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={pg.photos[0]} alt="" className="h-full w-full object-cover" />
          ) : null}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-2">
            <Link
              href={`/pg/${pg.slug}`}
              target="_blank"
              rel="noopener noreferrer"
              className="font-semibold text-slate-900 hover:text-brand"
            >
              {pg.name}
            </Link>
            <ToggleActive id={pg.id} active={pg.is_active} compact />
          </div>
          <div className="mt-0.5 truncate text-xs text-slate-500">
            {pg.area ?? pg.address}
          </div>
          <div className="mt-1.5 flex flex-wrap gap-x-3 gap-y-0.5 text-xs text-slate-600">
            <span className="capitalize">
              {pg.gender === "both" ? "Co-living" : pg.gender}
            </span>
            <span>·</span>
            <span>From ₹{pg.starting_price.toLocaleString("en-IN")}</span>
            <span>·</span>
            <span>{pg.room_types.length} rooms</span>
          </div>
        </div>
      </div>
      <div className="flex items-center justify-end gap-2 border-t border-slate-100 bg-slate-50/50 px-3 py-2">
        <Link
          href={`/admin/pgs/${pg.id}/edit`}
          className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-700"
        >
          Edit
        </Link>
        <DeleteButton id={pg.id} name={pg.name} />
      </div>
    </div>
  );
}

function ToggleActive({
  id,
  active,
  compact
}: {
  id: string;
  active: boolean;
  compact?: boolean;
}) {
  return (
    <form action={togglePgActive} className="inline-flex">
      <input type="hidden" name="id" value={id} />
      <input type="hidden" name="next" value={active ? "false" : "true"} />
      <button
        type="submit"
        className={`rounded-full px-3 py-1 text-xs font-semibold transition ${
          active
            ? "bg-emerald-100 text-emerald-700 hover:bg-emerald-200"
            : "bg-slate-200 text-slate-600 hover:bg-slate-300"
        } ${compact ? "py-0.5 text-[11px]" : ""}`}
      >
        {active ? "Published" : "Hidden"}
      </button>
    </form>
  );
}

