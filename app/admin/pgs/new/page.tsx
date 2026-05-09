import Link from "next/link";
import { redirect } from "next/navigation";
import { isAdminAuthed } from "@/lib/admin-session";
import PGForm from "../PGForm";

export const dynamic = "force-dynamic";

export default async function NewPGPage() {
  if (!(await isAdminAuthed())) redirect("/admin/login");

  return (
    <div className="space-y-5">
      <div>
        <Link
          href="/admin/pgs"
          className="inline-flex items-center gap-1 text-sm text-slate-500 hover:text-brand"
        >
          ← All PGs
        </Link>
        <h2 className="mt-2 text-lg font-semibold text-slate-900 sm:text-xl">Add a new PG</h2>
        <p className="text-sm text-slate-500">
          Photos upload as you add them. Save when everything looks right.
        </p>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-7">
        <PGForm mode="create" />
      </div>
    </div>
  );
}
