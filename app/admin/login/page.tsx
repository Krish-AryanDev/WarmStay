import { redirect } from "next/navigation";
import { isAdminAuthed } from "@/lib/admin-session";
import { loginAdmin } from "../actions";

interface Props {
  searchParams: Promise<{ error?: string }>;
}

export default async function AdminLoginPage({ searchParams }: Props) {
  if (await isAdminAuthed()) redirect("/admin/pgs");
  const { error } = await searchParams;

  return (
    <div className="mx-auto max-w-md">
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
        <h2 className="text-lg font-semibold text-slate-900 sm:text-xl">Sign in</h2>
        <p className="mt-1 text-sm text-slate-500">
          Enter the admin passcode to access the inquiry tracker.
        </p>

        <form action={loginAdmin} className="mt-5 space-y-4">
          <div>
            <label htmlFor="passcode" className="mb-1.5 block text-sm font-medium text-slate-700">
              Passcode
            </label>
            <input
              id="passcode"
              name="passcode"
              type="password"
              required
              autoComplete="off"
              autoFocus
              className="h-12 w-full rounded-xl border border-slate-200 bg-white px-3 outline-none focus:border-brand focus:ring-2 focus:ring-brand/10"
            />
          </div>

          {error && (
            <div className="rounded-xl border border-red-100 bg-red-50 px-3 py-2.5 text-sm text-red-700">
              Incorrect passcode. Try again.
            </div>
          )}

          <button
            type="submit"
            className="w-full rounded-xl bg-brand px-5 py-3.5 text-base font-semibold text-white shadow-sm transition active:bg-brand-dark"
          >
            Sign in
          </button>
        </form>
      </div>
    </div>
  );
}
