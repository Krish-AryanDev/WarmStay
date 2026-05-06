import Link from "next/link";
import { redirect } from "next/navigation";
import { isAdminAuthed } from "@/lib/admin-session";
import { supabaseAdmin } from "@/lib/supabase-admin";
import type { Inquiry } from "@/lib/types";
import { toggleHandled } from "../actions";

export const dynamic = "force-dynamic";

type StatusFilter = "pending" | "handled" | "all";

interface SearchParams {
  status?: string;
}

interface PgRef {
  id: string;
  name: string;
  slug: string;
}

async function fetchData(filter: StatusFilter) {
  let q = supabaseAdmin
    .from("inquiries")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(500);

  if (filter === "pending") q = q.eq("handled", false);
  if (filter === "handled") q = q.eq("handled", true);

  const { data: inquiries, error } = await q;
  if (error) {
    console.error("[admin/inquiries] fetch error:", error.message);
    return { inquiries: [] as Inquiry[], pgsById: new Map<string, PgRef>(), counts: { total: 0, pending: 0, handled: 0 } };
  }

  const list = (inquiries ?? []) as Inquiry[];
  const pgIds = Array.from(new Set(list.map((i) => i.pg_id).filter((x): x is string => !!x)));

  const pgsById = new Map<string, PgRef>();
  if (pgIds.length > 0) {
    const { data: pgs } = await supabaseAdmin
      .from("pgs")
      .select("id, name, slug")
      .in("id", pgIds);
    (pgs ?? []).forEach((p) => pgsById.set(p.id, p as PgRef));
  }

  // Stats are independent of the current filter, so a small extra query.
  const { data: countsRows } = await supabaseAdmin
    .from("inquiries")
    .select("handled");
  const all = (countsRows ?? []) as { handled: boolean }[];
  const counts = {
    total: all.length,
    pending: all.filter((r) => !r.handled).length,
    handled: all.filter((r) => r.handled).length
  };

  return { inquiries: list, pgsById, counts };
}

export default async function AdminInquiriesPage({
  searchParams
}: {
  searchParams: Promise<SearchParams>;
}) {
  if (!(await isAdminAuthed())) redirect("/admin/login");

  const { status } = await searchParams;
  const filter: StatusFilter =
    status === "handled" ? "handled" : status === "all" ? "all" : "pending";

  const { inquiries, pgsById, counts } = await fetchData(filter);

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-3 gap-3">
        <Stat label="Total" value={counts.total} />
        <Stat label="Pending" value={counts.pending} accent="brand" />
        <Stat label="Handled" value={counts.handled} accent="green" />
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <FilterPill href="/admin/inquiries?status=pending" active={filter === "pending"}>
          Pending
        </FilterPill>
        <FilterPill href="/admin/inquiries?status=handled" active={filter === "handled"}>
          Handled
        </FilterPill>
        <FilterPill href="/admin/inquiries?status=all" active={filter === "all"}>
          All
        </FilterPill>
      </div>

      {inquiries.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-10 text-center text-sm text-slate-500">
          No {filter === "all" ? "" : filter} inquiries.
        </div>
      ) : (
        <>
          {/* MOBILE: card list */}
          <div className="space-y-3 sm:hidden">
            {inquiries.map((i) => (
              <InquiryCard key={i.id} inquiry={i} pg={i.pg_id ? pgsById.get(i.pg_id) : undefined} />
            ))}
          </div>

          {/* DESKTOP: table */}
          <div className="hidden overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm sm:block">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                <tr>
                  <th className="px-4 py-3 font-semibold">When</th>
                  <th className="px-4 py-3 font-semibold">Student</th>
                  <th className="px-4 py-3 font-semibold">PG</th>
                  <th className="px-4 py-3 font-semibold">Move-in</th>
                  <th className="px-4 py-3 font-semibold">Budget</th>
                  <th className="px-4 py-3 font-semibold">Room</th>
                  <th className="px-4 py-3 text-right font-semibold">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {inquiries.map((i) => {
                  const pg = i.pg_id ? pgsById.get(i.pg_id) : undefined;
                  return (
                    <tr key={i.id} className={i.handled ? "bg-slate-50/60" : ""}>
                      <td className="px-4 py-3 align-top text-xs text-slate-500">
                        {formatDateTime(i.created_at)}
                      </td>
                      <td className="px-4 py-3 align-top">
                        <div className="font-medium text-slate-900">{i.student_name}</div>
                        <a
                          href={`tel:+91${i.student_phone}`}
                          className="text-xs text-slate-500 hover:text-brand"
                        >
                          +91 {i.student_phone}
                        </a>
                        {i.notes && (
                          <p className="mt-1 line-clamp-2 max-w-xs text-xs text-slate-500">
                            {i.notes}
                          </p>
                        )}
                      </td>
                      <td className="px-4 py-3 align-top">
                        {pg ? (
                          <Link href={`/pg/${pg.slug}`} className="text-slate-900 hover:text-brand">
                            {pg.name}
                          </Link>
                        ) : (
                          <span className="text-slate-400">{i.pg_slug ?? "—"}</span>
                        )}
                      </td>
                      <td className="px-4 py-3 align-top text-slate-700">
                        {i.move_in_date ? formatDate(i.move_in_date) : "—"}
                      </td>
                      <td className="px-4 py-3 align-top text-slate-700">
                        {i.budget ? `₹${i.budget.toLocaleString("en-IN")}` : "—"}
                      </td>
                      <td className="px-4 py-3 align-top capitalize text-slate-700">
                        {i.room_preference ?? "—"}
                      </td>
                      <td className="px-4 py-3 align-top text-right">
                        <ToggleHandled id={i.id} handled={i.handled} />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}

function Stat({
  label,
  value,
  accent
}: {
  label: string;
  value: number;
  accent?: "brand" | "green";
}) {
  const tone =
    accent === "brand"
      ? "text-brand"
      : accent === "green"
      ? "text-green-600"
      : "text-slate-900";
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">
        {label}
      </div>
      <div className={`mt-1 text-2xl font-bold ${tone}`}>{value}</div>
    </div>
  );
}

function FilterPill({
  href,
  active,
  children
}: {
  href: string;
  active: boolean;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      className={`rounded-full border px-3.5 py-1.5 text-sm font-medium transition ${
        active
          ? "border-brand bg-brand text-white"
          : "border-slate-200 bg-white text-slate-700 hover:border-brand hover:text-brand"
      }`}
    >
      {children}
    </Link>
  );
}

function ToggleHandled({ id, handled }: { id: string; handled: boolean }) {
  return (
    <form action={toggleHandled} className="inline-flex">
      <input type="hidden" name="id" value={id} />
      <input type="hidden" name="next" value={handled ? "false" : "true"} />
      <button
        type="submit"
        className={`rounded-full px-3 py-1.5 text-xs font-semibold transition ${
          handled
            ? "bg-green-100 text-green-700 hover:bg-green-200"
            : "bg-brand text-white hover:bg-brand-dark"
        }`}
      >
        {handled ? "✓ Handled" : "Mark handled"}
      </button>
    </form>
  );
}

function InquiryCard({ inquiry, pg }: { inquiry: Inquiry; pg?: PgRef }) {
  return (
    <div
      className={`rounded-2xl border p-4 shadow-sm ${
        inquiry.handled ? "border-slate-200 bg-slate-50" : "border-slate-200 bg-white"
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="font-semibold text-slate-900">{inquiry.student_name}</div>
          <a href={`tel:+91${inquiry.student_phone}`} className="text-sm text-brand">
            +91 {inquiry.student_phone}
          </a>
        </div>
        <span className="shrink-0 text-[11px] text-slate-500">
          {formatDateTime(inquiry.created_at)}
        </span>
      </div>

      <div className="mt-2 text-sm text-slate-700">
        {pg ? (
          <Link href={`/pg/${pg.slug}`} className="font-medium hover:text-brand">
            {pg.name}
          </Link>
        ) : (
          <span className="text-slate-500">{inquiry.pg_slug ?? "Unknown PG"}</span>
        )}
      </div>

      <div className="mt-2 grid grid-cols-3 gap-2 text-xs text-slate-600">
        <Detail label="Move-in" value={inquiry.move_in_date ? formatDate(inquiry.move_in_date) : "—"} />
        <Detail
          label="Budget"
          value={inquiry.budget ? `₹${inquiry.budget.toLocaleString("en-IN")}` : "—"}
        />
        <Detail label="Room" value={inquiry.room_preference ?? "—"} />
      </div>

      {inquiry.notes && (
        <p className="mt-2 rounded-lg bg-slate-100 px-3 py-2 text-xs text-slate-600">
          {inquiry.notes}
        </p>
      )}

      <div className="mt-3 flex items-center justify-between gap-2">
        <a
          href={`https://wa.me/91${inquiry.student_phone}`}
          target="_blank"
          rel="noopener noreferrer"
          className="text-xs font-medium text-brand"
        >
          WhatsApp →
        </a>
        <ToggleHandled id={inquiry.id} handled={inquiry.handled} />
      </div>
    </div>
  );
}

function Detail({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="text-[10px] uppercase tracking-wide text-slate-400">{label}</div>
      <div className="truncate capitalize">{value}</div>
    </div>
  );
}

function formatDateTime(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleString("en-IN", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit"
  });
}

function formatDate(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
}
