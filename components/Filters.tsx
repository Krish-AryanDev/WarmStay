"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useState } from "react";

const GENDERS = [
  { value: "", label: "Any" },
  { value: "boys", label: "Boys" },
  { value: "girls", label: "Girls" },
  { value: "both", label: "Co-Living" }
];

const PRICES = [
  { value: "", label: "Any price" },
  { value: "85000", label: "Under ₹85,000" },
  { value: "110000", label: "Under ₹1,10,000" },
  { value: "140000", label: "Under ₹1,40,000" },
  { value: "180000", label: "Under ₹1,80,000" }
];

const ROOMS = [
  { value: "", label: "Any room" },
  { value: "single", label: "Single" },
  { value: "double", label: "Double" },
  { value: "triple", label: "Triple" }
];

export default function Filters() {
  const router = useRouter();
  const params = useSearchParams();
  const [open, setOpen] = useState(false);

  const gender = params.get("gender") ?? "";
  const max = params.get("max") ?? "";
  const room = params.get("room") ?? "";

  const update = useCallback(
    (key: string, value: string) => {
      const next = new URLSearchParams(params.toString());
      if (value) next.set(key, value);
      else next.delete(key);
      router.replace(`/?${next.toString()}`, { scroll: false });
    },
    [params, router]
  );

  const clearAll = () => router.replace("/", { scroll: false });

  const activeCount = [gender, max, room].filter(Boolean).length;

  useEffect(() => {
    if (!open) return;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  const labelFor = (list: { value: string; label: string }[], v: string) =>
    list.find((x) => x.value === v)?.label ?? list[0].label;

  return (
    <>
      {/* MOBILE: compact summary bar that opens a bottom sheet */}
      <div className="sm:hidden">
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="flex w-full items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-white px-4 py-3 shadow-sm active:scale-[0.99]"
          aria-label="Open filters"
        >
          <span className="flex items-center gap-2 text-sm text-slate-700">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={2}
              stroke="currentColor"
              className="h-5 w-5 text-brand"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M12 3c2.755 0 5.455.232 8.083.678.533.09.917.556.917 1.096v1.044a2.25 2.25 0 01-.659 1.591l-5.432 5.432a2.25 2.25 0 00-.659 1.591v2.927a2.25 2.25 0 01-1.244 2.013L9.75 21v-6.568a2.25 2.25 0 00-.659-1.591L3.659 7.409A2.25 2.25 0 013 5.818V4.774c0-.54.384-1.006.917-1.096A48.32 48.32 0 0112 3z"
              />
            </svg>
            <span className="font-medium">Filter</span>
            {activeCount > 0 && (
              <span className="ml-1 inline-flex h-5 min-w-[20px] items-center justify-center rounded-full bg-brand px-1.5 text-[11px] font-semibold text-white">
                {activeCount}
              </span>
            )}
          </span>
          <span className="truncate text-xs text-slate-500">
            {gender ? labelFor(GENDERS, gender) : "Any gender"} ·{" "}
            {max ? `≤₹${Number(max).toLocaleString("en-IN")}` : "Any price"}
            {room ? ` · ${labelFor(ROOMS, room)}` : ""}
          </span>
        </button>
      </div>

      {/* DESKTOP: inline pill row */}
      <div className="hidden sm:block">
        <div className="mx-auto flex items-center gap-1 rounded-full border border-slate-100 bg-white py-2 pl-2 pr-2 shadow-2xl">
          <SelectField label="GENDER" value={gender} onChange={(v) => update("gender", v)} options={GENDERS} />
          <Divider />
          <SelectField label="MAX PRICE" value={max} onChange={(v) => update("max", v)} options={PRICES} />
          <Divider />
          <SelectField label="ROOM TYPE" value={room} onChange={(v) => update("room", v)} options={ROOMS} />
          <div className="ml-auto shrink-0 pl-3">
            {activeCount > 0 ? (
              <button
                onClick={clearAll}
                className="flex h-12 w-12 items-center justify-center rounded-full bg-slate-100 text-slate-600 transition hover:bg-slate-200"
                title="Clear filters"
                aria-label="Clear filters"
              >
                <CloseIcon />
              </button>
            ) : (
              <div
                className="flex h-12 w-12 items-center justify-center rounded-full bg-blue-600 text-white shadow-md transition hover:bg-blue-700"
                aria-hidden="true"
                title="Search"
              >
                <ArrowRightIcon />
              </div>
            )}
          </div>
        </div>
      </div>

      {/* MOBILE BOTTOM SHEET */}
      {open && (
        <div className="fixed inset-0 z-50 sm:hidden" role="dialog" aria-modal="true">
          <div
            className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
            onClick={() => setOpen(false)}
          />
          <div className="absolute inset-x-0 bottom-0 rounded-t-3xl bg-white p-5 pb-8 shadow-2xl animate-in slide-in-from-bottom duration-200">
            <div className="mx-auto mb-4 h-1.5 w-12 rounded-full bg-slate-200" />
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-lg font-semibold">Filters</h3>
              {activeCount > 0 && (
                <button
                  onClick={() => {
                    clearAll();
                  }}
                  className="text-sm font-medium text-brand"
                >
                  Clear all
                </button>
              )}
            </div>

            <ChipGroup
              label="Gender"
              value={gender}
              options={GENDERS}
              onChange={(v) => update("gender", v)}
            />
            <ChipGroup
              label="Max price"
              value={max}
              options={PRICES}
              onChange={(v) => update("max", v)}
            />
            <ChipGroup
              label="Room type"
              value={room}
              options={ROOMS}
              onChange={(v) => update("room", v)}
            />

            <button
              onClick={() => setOpen(false)}
              className="mt-2 w-full rounded-xl bg-brand px-5 py-3.5 text-base font-semibold text-white shadow-sm active:bg-brand-dark"
            >
              Show results
            </button>
          </div>
        </div>
      )}
    </>
  );
}

function Divider() {
  return <span className="h-8 w-px bg-slate-200" aria-hidden="true" />;
}

function SelectField({
  label,
  value,
  onChange,
  options
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  options: { value: string; label: string }[];
}) {
  return (
    <div className="flex flex-1 flex-col px-5 py-1">
      <label className="text-[11px] font-bold uppercase tracking-wide text-slate-900">
        {label}
      </label>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="mt-0.5 w-full cursor-pointer appearance-none bg-transparent text-sm text-slate-500 outline-none"
        aria-label={label}
      >
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </div>
  );
}

function ChipGroup({
  label,
  value,
  options,
  onChange
}: {
  label: string;
  value: string;
  options: { value: string; label: string }[];
  onChange: (v: string) => void;
}) {
  return (
    <div className="mb-5">
      <div className="mb-2 text-xs font-bold uppercase tracking-wide text-slate-500">
        {label}
      </div>
      <div className="flex flex-wrap gap-2">
        {options.map((o) => {
          const selected = value === o.value;
          return (
            <button
              key={o.value || "_any"}
              onClick={() => onChange(o.value)}
              className={`rounded-full border px-4 py-2 text-sm font-medium transition active:scale-95 ${
                selected
                  ? "border-brand bg-brand text-white"
                  : "border-slate-200 bg-white text-slate-700"
              }`}
            >
              {o.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}

function CloseIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
      strokeWidth={2}
      stroke="currentColor"
      className="h-5 w-5"
    >
      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
    </svg>
  );
}

function ArrowRightIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
      strokeWidth={2.5}
      stroke="currentColor"
      className="h-5 w-5"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M13.5 4.5 21 12m0 0-7.5 7.5M21 12H3"
      />
    </svg>
  );
}
