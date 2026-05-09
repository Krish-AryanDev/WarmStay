"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

interface Props {
  photos: string[];
  videos?: string[];
  pgName: string;
}

type MediaItem = { type: "photo" | "video"; url: string };

export default function PhotoGallery({ photos, videos = [], pgName }: Props) {
  const media = useMemo<MediaItem[]>(
    () => [
      ...photos.map((url) => ({ type: "photo" as const, url })),
      ...videos.map((url) => ({ type: "video" as const, url }))
    ],
    [photos, videos]
  );

  const [openAt, setOpenAt] = useState<number | null>(null);
  const isOpen = openAt !== null;

  const close = useCallback(() => setOpenAt(null), []);
  const next = useCallback(
    () => setOpenAt((i) => (i === null ? null : (i + 1) % media.length)),
    [media.length]
  );
  const prev = useCallback(
    () => setOpenAt((i) => (i === null ? null : (i - 1 + media.length) % media.length)),
    [media.length]
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

  if (media.length === 0) {
    return (
      <div className="grid aspect-[16/9] place-items-center rounded-2xl bg-slate-100 text-slate-400">
        No photos or videos yet
      </div>
    );
  }

  const remaining = media.length - 5;
  const activeItem = openAt !== null ? media[openAt] : null;

  return (
    <>
      {/* MOBILE: horizontal scroll */}
      <div className="scrollbar-hide -mx-4 flex snap-x snap-mandatory gap-2 overflow-x-auto px-4 sm:hidden">
        {media.map((item, i) => (
          <Thumb
            key={i}
            item={item}
            label={`${pgName} ${item.type} ${i + 1}`}
            onClick={() => setOpenAt(i)}
            className="aspect-[4/3] w-[88%] flex-none snap-center rounded-2xl"
          />
        ))}
      </div>

      {/* DESKTOP: Airbnb-style hero — 1 large + up to 4 thumbs */}
      <div className="relative hidden h-[420px] grid-cols-4 grid-rows-2 gap-2 overflow-hidden rounded-2xl sm:grid lg:h-[480px]">
        <Thumb
          item={media[0]}
          label={`${pgName} ${media[0].type} 1`}
          onClick={() => setOpenAt(0)}
          className="col-span-2 row-span-2"
        />
        {media.slice(1, 5).map((item, i) => (
          <Thumb
            key={i}
            item={item}
            label={`${pgName} ${item.type} ${i + 2}`}
            onClick={() => setOpenAt(i + 1)}
          />
        ))}
        {remaining > 0 && (
          <button
            type="button"
            onClick={() => setOpenAt(5)}
            className="absolute bottom-4 right-4 rounded-full bg-white/95 px-4 py-2 text-sm font-semibold text-slate-900 shadow-md backdrop-blur transition hover:bg-white"
          >
            + {remaining} more
          </button>
        )}
      </div>

      {/* LIGHTBOX */}
      {isOpen && activeItem && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-sm"
          role="dialog"
          aria-modal="true"
          aria-label={`${pgName} media viewer`}
          onClick={close}
        >
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

          <div className="absolute left-1/2 top-4 z-10 -translate-x-1/2 rounded-full bg-white/10 px-3 py-1.5 text-xs font-medium text-white backdrop-blur">
            {openAt + 1} / {media.length}
          </div>

          {media.length > 1 && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                prev();
              }}
              aria-label="Previous"
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

          {media.length > 1 && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                next();
              }}
              aria-label="Next"
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

          {activeItem.type === "photo" ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              key={activeItem.url}
              src={activeItem.url}
              alt={`${pgName} photo ${openAt + 1}`}
              onClick={(e) => e.stopPropagation()}
              className="max-h-[92vh] max-w-[94vw] cursor-default rounded-lg object-contain shadow-2xl"
            />
          ) : (
            <video
              key={activeItem.url}
              src={activeItem.url}
              controls
              autoPlay
              playsInline
              onClick={(e) => e.stopPropagation()}
              className="max-h-[92vh] max-w-[94vw] cursor-default rounded-lg shadow-2xl"
            />
          )}
        </div>
      )}
    </>
  );
}

function Thumb({
  item,
  label,
  onClick,
  className = ""
}: {
  item: MediaItem;
  label: string;
  onClick: () => void;
  className?: string;
}) {
  const baseClass = `relative h-full w-full cursor-pointer overflow-hidden ${className}`;

  if (item.type === "photo") {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={item.url}
        alt={label}
        onClick={onClick}
        className={`${baseClass} object-cover transition hover:brightness-95`}
      />
    );
  }

  return (
    <div onClick={onClick} className={`${baseClass} bg-slate-900 transition hover:brightness-95`}>
      <video
        src={item.url}
        muted
        playsInline
        preload="metadata"
        className="h-full w-full object-cover"
      />
      <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-black/60 backdrop-blur-sm ring-2 ring-white/80">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="white"
            className="ml-0.5 h-6 w-6"
          >
            <path d="M8 5.14v13.72a1 1 0 0 0 1.55.83l11-6.86a1 1 0 0 0 0-1.66l-11-6.86A1 1 0 0 0 8 5.14Z" />
          </svg>
        </div>
      </div>
    </div>
  );
}
