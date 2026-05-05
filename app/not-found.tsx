import Link from "next/link";

export default function NotFound() {
  return (
    <div className="grid place-items-center py-20 text-center">
      <h1 className="text-2xl font-bold">PG not found</h1>
      <p className="mt-2 text-slate-500">The listing you're looking for doesn't exist or was removed.</p>
      <Link href="/" className="mt-4 rounded-xl bg-brand px-5 py-2 font-semibold text-white">
        Browse all PGs
      </Link>
    </div>
  );
}
