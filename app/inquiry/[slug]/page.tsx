import { notFound } from "next/navigation";
import { supabase } from "@/lib/supabase";
import type { PG } from "@/lib/types";
import InquiryForm from "./InquiryForm";

async function fetchPG(slug: string): Promise<PG | null> {
  const { data, error } = await supabase
    .from("pgs")
    .select("*")
    .eq("slug", slug)
    .eq("is_active", true)
    .maybeSingle();
  if (error) {
    console.error("[inquiry] supabase error:", error.message);
    return null;
  }
  return data as PG | null;
}

export default async function InquiryPage({
  params
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const pg = await fetchPG(slug);
  if (!pg) notFound();

  return (
    <div className="mx-auto max-w-xl space-y-4">
      <div>
        <h1 className="text-2xl font-bold">Check availability</h1>
        <p className="text-slate-500">
          Inquiry for <span className="font-medium text-slate-900">{pg.name}</span>
        </p>
      </div>
      <InquiryForm
        pgId={pg.id}
        pgSlug={pg.slug}
        pgName={pg.name}
        ownerPhone={pg.owner_phone}
      />
    </div>
  );
}
