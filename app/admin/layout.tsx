import Link from "next/link";
import { isAdminAuthed } from "@/lib/admin-session";
import { logoutAdmin } from "./actions";

export const metadata = {
  title: "Admin – WarmStay",
  robots: { index: false, follow: false }
};

export const dynamic = "force-dynamic";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const authed = await isAdminAuthed();

  return (
    <div className="-mx-4 -mb-6 -mt-2 min-h-[calc(100vh-9rem)] bg-slate-50 px-4 py-6 sm:-mx-6 sm:-mb-8 sm:-mt-3 sm:px-6 sm:py-8">
      <div className="mx-auto max-w-6xl">
        <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-brand">
              WarmStay Admin
            </p>
            <h1 className="text-xl font-bold text-slate-900 sm:text-2xl">Dashboard</h1>
          </div>
          {authed && (
            <div className="flex flex-wrap items-center gap-2">
              <Link
                href="/admin/pgs"
                className="rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 hover:border-brand hover:text-brand sm:text-sm"
              >
                PGs
              </Link>
              <Link
                href="/admin/inquiries"
                className="rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 hover:border-brand hover:text-brand sm:text-sm"
              >
                Inquiries
              </Link>
              <form action={logoutAdmin}>
                <button
                  type="submit"
                  className="rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-600 hover:border-red-300 hover:text-red-600 sm:text-sm"
                >
                  Sign out
                </button>
              </form>
            </div>
          )}
        </div>
        {children}
      </div>
    </div>
  );
}
