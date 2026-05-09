"use client";

import { useCallback, useEffect, useState } from "react";

interface Props {
  photos: string[];
  pgName: string;
}

export default function PhotoGallery({ photos, pgName }: Props) {
  const [openAt, setOpenAt] = useState<number | null>(null);
  const isOpen = openAt !== null;

  const close = useCallback(() => setOpenAt(null), []);
  const next = useCallback(
    () => setOpenAt((i) => (i === null ? null : (i + 1) % photos.length)),
    [photos.length]
  );
  const prev = useCallback(
    () => setOpenAt((i) => (i === null ? null : (i - 1 + photos.length) % photos.length)),
    [photos.length]
  );

  useEffect(() => {
    if (!isOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") close();
      else if (e.key === "ArrowRight") next();
      else if (e.key === "ArrowLeft") prev();
    };
    document.addEventListener("keydown", onKey);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prevOverflow;
    };
  }, [isOpen, close, next, prev]);

  if (photos.length === 0) {
    return (
      <div className="grid aspect-[16/9] place-items-center rounded-2xl bg-slate-100 text-slate-400">
        No photos yet
      </div>
    );
  }

  return (
    <>
      {/* MOBILE: horizontal scroll */}
      <div className="scrollbar-hide -mx-4 flex snap-x snap-mandatory gap-2 overflow-x-auto px-4 sm:hidden">
        {photos.map((url, i) => (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            key={i}
            src={url}
            alt={`${pgName} photo ${i + 1}`}
            onClick={() => setOpenAt(i)}
            className="aspect-[4/3] w-[88%] flex-none cursor-pointer snap-center rounded-2xl object-cover"
          />
        ))}
      </div>

      {/* DESKTOP: Airbnb-style hero gallery — 1 large + up to 4 thumbs */}
      <div className="relative hidden h-[420px] grid-cols-4 grid-rows-2 gap-2 overflow-hidden rounded-2xl sm:grid lg:h-[480px]">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={photos[0]}
          alt={`${pgName} photo 1`}
          onClick={() => setOpenAt(0)}
          className="col-span-2 row-span-2 h-full w-full cursor-pointer object-cover transition hover:brightness-95"
        />
        {photos.slice(1, 5).map((url, i) => (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            key={i}
            src={url}
            alt={`${pgName} photo ${i + 2}`}
            onClick={() => setOpenAt(i + 1)}
            className="h-full w-full cursor-pointer object-cover transition hover:brightness-95"
          />
        ))}
        {photos.length > 5 && (
          <button
            type="button"
            onClick={() => setOpenAt(5)}
            className="absolute bottom-4 right-4 rounded-full bg-white/95 px-4 py-2 text-sm font-semibold text-slate-900 shadow-md backdrop-blur transition hover:bg-white"
          >
            + {photos.length - 5} photos
          </button>
        )}
      </div>

      {/* LIGHTBOX */}
      {isOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-sm"
          role="dialog"
          aria-modal="true"
          aria-label={`${pgName} photo viewer`}
          onClick={close}
        >
          {/* Close */}
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              close();
            }}
            aria-label="Close"
            className="absolute right-4 top-4 z-10 flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-white transition hover:bg-white/20"
          >
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
          </button>

          {/* Counter */}
          <div className="absolute left-1/2 top-4 z-10 -translate-x-1/2 rounded-full bg-white/10 px-3 py-1.5 text-xs font-medium text-white backdrop-blur">
            {openAt + 1} / {photos.length}
          </div>

          {/* Prev */}
          {photos.length > 1 && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                prev();
              }}
              aria-label="Previous photo"
              className="absolute left-2 z-10 flex h-12 w-12 items-center justify-center rounded-full bg-white/10 text-white transition hover:bg-white/20 sm:left-6"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={2.2}
                stroke="currentColor"
                className="h-6 w-6"
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5 8.25 12l7.5-7.5" />
              </svg>
            </button>
          )}

          {/* Next */}
          {photos.length > 1 && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                next();
              }}
              aria-label="Next photo"
              className="absolute right-2 z-10 flex h-12 w-12 items-center justify-center rounded-full bg-white/10 text-white transition hover:bg-white/20 sm:right-6"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={2.2}
                stroke="currentColor"
                className="h-6 w-6"
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="m8.25 4.5 7.5 7.5-7.5 7.5" />
              </svg>
            </button>
          )}

          {/* Active image */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={photos[openAt]}
            alt={`${pgName} photo ${openAt + 1}`}
            onClick={(e) => e.stopPropagation()}
            className="max-h-[92vh] max-w-[94vw] cursor-default rounded-lg object-contain shadow-2xl"
          />
        </div>
      )}
    </>
  );
}
