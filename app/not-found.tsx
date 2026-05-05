import Link from "next/link";

export default function NotFound() {
  return (
    <div className="grid place-items-center px-4 py-16 text-center sm:py-20">
      <h1 className="text-2xl font-bold sm:text-3xl">PG not found</h1>
      <p className="mt-2 max-w-sm text-sm text-slate-500 sm:text-base">
        The listing you&apos;re looking for doesn&apos;t exist or was removed.
      </p>
      <Link
        href="/"
        className="mt-5 rounded-xl bg-brand px-6 py-3 text-sm font-semibold text-white shadow-sm active:bg-brand-dark sm:text-base"
      >
        Browse all PGs
      </Link>
    </div>
  );
}
