import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { isAdminAuthed } from "@/lib/admin-session";
import { supabaseAdmin } from "@/lib/supabase-admin";
import type { PG } from "@/lib/types";
import PGForm from "../../PGForm";

export const dynamic = "force-dynamic";

export default async function EditPGPage({
  params
}: {
  params: Promise<{ id: string }>;
}) {
  if (!(await isAdminAuthed())) redirect("/admin/login");

  const { id } = await params;
  const { data, error } = await supabaseAdmin
    .from("pgs")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (error) {
    console.error("[admin/pgs/edit] fetch error:", error.message);
  }
  if (!data) notFound();

  const pg = data as PG;

  return (
    <div className="space-y-5">
      <div>
        <Link
          href="/admin/pgs"
          className="inline-flex items-center gap-1 text-sm text-slate-500 hover:text-brand"
        >
          ← All PGs
        </Link>
        <div className="mt-2 flex flex-wrap items-end justify-between gap-3">
          <div>
            <h2 className="text-lg font-semibold text-slate-900 sm:text-xl">{pg.name}</h2>
            <p className="text-sm text-slate-500">/{pg.slug}</p>
          </div>
          <Link
            href={`/pg/${pg.slug}`}
            target="_blank"
            rel="noopener noreferrer"
            className="rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 hover:border-brand hover:text-brand"
          >
            View public page →
          </Link>
        </div>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-7">
        <PGForm mode="edit" pg={pg} />
      </div>
    </div>
  );
}
