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
      className="space-y-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-6"
    >
      <Field label="Your name" name="name" required placeholder="Rahul Gupta" autoComplete="name" />
      <Field
        label="Phone (WhatsApp)"
        name="phone"
        required
        placeholder="98XXXXXXXX"
        inputMode="numeric"
        autoComplete="tel"
        pattern="[6-9][0-9]{9}"
      />
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Field label="Move-in date" name="move_in" type="date" />
        <Field
          label="Yearly budget (₹)"
          name="budget"
          type="number"
          placeholder="9000"
          inputMode="numeric"
          min={1000}
        />
      </div>
      <div>
        <label htmlFor="room" className="mb-1.5 block text-sm font-medium text-slate-700">
          Room preference
        </label>
        <select
          id="room"
          name="room"
          className="h-12 w-full rounded-xl border border-slate-200 bg-white px-3 outline-none focus:border-brand focus:ring-2 focus:ring-brand/10"
          defaultValue=""
        >
          <option value="">No preference</option>
          <option value="single">Single</option>
          <option value="double">Double sharing</option>
          <option value="triple">Triple sharing</option>
        </select>
      </div>
      <div>
        <label htmlFor="notes" className="mb-1.5 block text-sm font-medium text-slate-700">
          Notes <span className="text-slate-400">(optional)</span>
        </label>
        <textarea
          id="notes"
          name="notes"
          rows={3}
          placeholder="Any special requirements?"
          className="w-full rounded-xl border border-slate-200 px-3 py-2.5 outline-none focus:border-brand focus:ring-2 focus:ring-brand/10"
        />
      </div>

      {error && (
        <div className="rounded-xl border border-red-100 bg-red-50 px-3 py-2.5 text-sm text-red-700">
          {error}
        </div>
      )}

      <button
        type="submit"
        disabled={submitting}
        className="flex w-full items-center justify-center gap-2 rounded-xl bg-brand px-5 py-3.5 text-base font-semibold text-white shadow-sm transition active:bg-brand-dark disabled:opacity-60 sm:py-3"
      >
        {submitting ? (
          "Sending…"
        ) : (
          <>
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="currentColor"
              className="h-5 w-5"
            >
              <path d="M19.05 4.91A10 10 0 0 0 12.06 2C6.55 2 2.07 6.48 2.07 12a9.93 9.93 0 0 0 1.36 5L2 22l5.16-1.36A10 10 0 0 0 12.06 22C17.57 22 22 17.52 22 12a9.95 9.95 0 0 0-2.95-7.09zM12.06 20.13a8.13 8.13 0 0 1-4.24-1.18l-.31-.18-3.06.81.81-2.99-.2-.31a8.16 8.16 0 1 1 7 3.85zm4.7-6.05c-.26-.13-1.52-.75-1.76-.83-.24-.09-.4-.13-.58.13-.17.26-.66.83-.81 1-.15.17-.3.18-.55.06-.26-.13-1.08-.4-2.06-1.27-.76-.68-1.27-1.51-1.42-1.77-.15-.26-.02-.4.11-.53.11-.11.26-.3.39-.45.12-.15.17-.26.26-.43.09-.17.04-.32-.02-.45-.06-.13-.58-1.4-.79-1.91-.21-.5-.42-.43-.58-.44h-.49c-.17 0-.45.06-.69.32s-.91.89-.91 2.18.94 2.53 1.07 2.7c.13.17 1.85 2.83 4.49 3.97.63.27 1.12.43 1.5.55.63.2 1.2.17 1.65.1.5-.07 1.52-.62 1.74-1.22.21-.6.21-1.11.15-1.22-.06-.11-.24-.17-.5-.3z" />
            </svg>
            Send via WhatsApp
          </>
        )}
      </button>
      <p className="text-center text-xs text-slate-500">
        WhatsApp will open with your inquiry pre-filled.
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
      <label htmlFor={name} className="mb-1.5 block text-sm font-medium text-slate-700">
        {label}
        {rest.required && <span className="ml-0.5 text-red-500">*</span>}
      </label>
      <input
        id={name}
        name={name}
        className="h-12 w-full rounded-xl border border-slate-200 bg-white px-3 outline-none focus:border-brand focus:ring-2 focus:ring-brand/10"
        {...rest}
      />
    </div>
  );
}
