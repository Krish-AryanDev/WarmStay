"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useCallback } from "react";

export default function Filters() {
  const router = useRouter();
  const params = useSearchParams();

  const update = useCallback(
    (key: string, value: string) => {
      const next = new URLSearchParams(params.toString());
      if (value) next.set(key, value);
      else next.delete(key);
      router.replace(`/?${next.toString()}`, { scroll: false });
    },
    [params, router]
  );

  const gender = params.get("gender") ?? "";
  const max = params.get("max") ?? "";
  const room = params.get("room") ?? "";

  return (
    <div className="mx-auto flex flex-col sm:flex-row items-center justify-between gap-4 rounded-3xl bg-white p-3 shadow-xl sm:rounded-full sm:px-8 sm:py-3 border border-slate-100">
      <div className="flex w-full flex-col sm:flex-row items-center divide-y sm:divide-y-0 sm:divide-x divide-slate-200">
        
        <div className="flex flex-1 flex-col py-2 px-4 w-full">
          <label className="text-xs font-bold text-slate-800 uppercase tracking-wide">Gender</label>
          <select
            value={gender}
            onChange={(e) => update("gender", e.target.value)}
            className="mt-1 w-full bg-transparent text-sm text-slate-500 outline-none focus:ring-0 cursor-pointer appearance-none"
            aria-label="Gender"
          >
            <option value="">Any gender</option>
            <option value="boys">Boys</option>
            <option value="girls">Girls</option>
            <option value="both">Co-Living</option>
          </select>
        </div>

        <div className="flex flex-1 flex-col py-2 px-4 w-full">
          <label className="text-xs font-bold text-slate-800 uppercase tracking-wide">Max Price</label>
          <select
            value={max}
            onChange={(e) => update("max", e.target.value)}
            className="mt-1 w-full bg-transparent text-sm text-slate-500 outline-none focus:ring-0 cursor-pointer appearance-none"
            aria-label="Max price"
          >
            <option value="">Any price</option>
            <option value="7000">Under ₹7,000</option>
            <option value="9000">Under ₹9,000</option>
            <option value="12000">Under ₹12,000</option>
            <option value="15000">Under ₹15,000</option>
          </select>
        </div>

        <div className="flex flex-1 flex-col py-2 px-4 w-full">
          <label className="text-xs font-bold text-slate-800 uppercase tracking-wide">Room Type</label>
          <select
            value={room}
            onChange={(e) => update("room", e.target.value)}
            className="mt-1 w-full bg-transparent text-sm text-slate-500 outline-none focus:ring-0 cursor-pointer appearance-none"
            aria-label="Room type"
          >
            <option value="">Any room</option>
            <option value="single">Single</option>
            <option value="double">Double</option>
            <option value="triple">Triple</option>
          </select>
        </div>

      </div>
      
      <div className="flex shrink-0 items-center justify-end px-2 sm:px-0 w-full sm:w-auto pb-2 sm:pb-0">
        {(gender || max || room) ? (
          <button
            onClick={() => router.replace("/", { scroll: false })}
            className="flex h-12 w-12 items-center justify-center rounded-full bg-slate-100 text-slate-600 hover:bg-slate-200 transition-colors"
            title="Clear Filters"
          >
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        ) : (
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-blue-600 text-white shadow-md hover:bg-blue-700 transition cursor-default">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-6 h-6">
              <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5 21 12m0 0-7.5 7.5M21 12H3" />
            </svg>
          </div>
        )}
      </div>
    </div>
  );
}
