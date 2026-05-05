"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabase";
import { buildWhatsAppLink, getInquiryWhatsAppNumber } from "@/lib/whatsapp";

interface Props {
  pgId: string;
  pgSlug: string;
  pgName: string;
  ownerPhone: string | null;
}

export default function InquiryForm({ pgId, pgSlug, pgName, ownerPhone }: Props) {
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);

    const fd = new FormData(e.currentTarget);
    const studentName = String(fd.get("name") ?? "").trim();
    const studentPhone = String(fd.get("phone") ?? "").trim();
    const moveInDate = String(fd.get("move_in") ?? "").trim() || undefined;
    const budgetRaw = String(fd.get("budget") ?? "").trim();
    const budget = budgetRaw ? Number(budgetRaw) : undefined;
    const roomPreference = String(fd.get("room") ?? "").trim() || undefined;
    const notes = String(fd.get("notes") ?? "").trim() || undefined;

    if (!studentName || !studentPhone) {
      setError("Please enter your name and phone number.");
      setSubmitting(false);
      return;
    }
    if (!/^[6-9]\d{9}$/.test(studentPhone)) {
      setError("Please enter a valid 10-digit Indian mobile number.");
      setSubmitting(false);
      return;
    }

    // Persist the inquiry. Even if WhatsApp redirect fails, we have the lead.
    const { error: insertError } = await supabase.from("inquiries").insert({
      pg_id: pgId,
      pg_slug: pgSlug,
      student_name: studentName,
      student_phone: studentPhone,
      move_in_date: moveInDate ?? null,
      budget: budget ?? null,
      room_preference: roomPreference ?? null,
      notes: notes ?? null
    });

    if (insertError) {
      console.error(insertError);
      setError("Could not save your inquiry. Please try again.");
      setSubmitting(false);
      return;
    }

    const to = getInquiryWhatsAppNumber(ownerPhone);
    const link = buildWhatsAppLink(to, {
      pgName,
      pgSlug,
      studentName,
      studentPhone,
      moveInDate,
      budget,
      roomPreference,
      notes
    });

    window.location.href = link;
  }

  return (
    <form
      onSubmit={onSubmit}
      className="space-y-4 rounded-2xl border border-slate-200 bg-white p-5"
    >
      <Field label="Your name" name="name" required placeholder="Rahul Gupta" />
      <Field
        label="Phone (WhatsApp)"
        name="phone"
        required
        placeholder="98XXXXXXXX"
        inputMode="numeric"
        pattern="[6-9][0-9]{9}"
      />
      <Field label="Move-in date" name="move_in" type="date" />
      <Field
        label="Monthly budget (₹)"
        name="budget"
        type="number"
        placeholder="9000"
        min={1000}
      />
      <div>
        <label className="mb-1 block text-sm font-medium text-slate-700">Room preference</label>
        <select
          name="room"
          className="w-full rounded-lg border border-slate-200 px-3 py-2"
          defaultValue=""
        >
          <option value="">No preference</option>
          <option value="single">Single</option>
          <option value="double">Double sharing</option>
          <option value="triple">Triple sharing</option>
        </select>
      </div>
      <div>
        <label className="mb-1 block text-sm font-medium text-slate-700">Notes (optional)</label>
        <textarea
          name="notes"
          rows={3}
          placeholder="Any special requirements?"
          className="w-full rounded-lg border border-slate-200 px-3 py-2"
        />
      </div>

      {error && (
        <div className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</div>
      )}

      <button
        type="submit"
        disabled={submitting}
        className="w-full rounded-xl bg-brand px-5 py-3 font-semibold text-white shadow-sm transition hover:bg-brand-dark disabled:opacity-60"
      >
        {submitting ? "Sending…" : "Send via WhatsApp"}
      </button>
      <p className="text-center text-xs text-slate-500">
        Clicking Send will open WhatsApp with your inquiry pre-filled.
      </p>
    </form>
  );
}

interface FieldProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string;
  name: string;
}

function Field({ label, name, ...rest }: FieldProps) {
  return (
    <div>
      <label htmlFor={name} className="mb-1 block text-sm font-medium text-slate-700">
        {label}
      </label>
      <input
        id={name}
        name={name}
        className="w-full rounded-lg border border-slate-200 px-3 py-2 outline-none focus:border-brand"
        {...rest}
      />
    </div>
  );
}
