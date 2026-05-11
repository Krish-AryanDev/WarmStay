"use client";

import { useActionState, useEffect, useRef, useState, useTransition } from "react";
import type { PG, PgLink, RoomType, RoomTypeEntry } from "@/lib/types";
import { supabase } from "@/lib/supabase";
import {
  createPg,
  createVideoUploadUrl,
  deletePgPhotoFile,
  deletePgVideoFile,
  updatePg,
  uploadPgPhoto,
  type PgFormState
} from "./actions";

const VIDEO_BUCKET = "pg-videos";

interface Props {
  mode: "create" | "edit";
  pg?: PG;
}

interface AmenityField {
  key: string;
  label: string;
}

const AMENITY_FIELDS: AmenityField[] = [
  { key: "wifi", label: "Wi-Fi" },
  { key: "food", label: "Food" },
  { key: "laundry", label: "Laundry" },
  { key: "parking", label: "Parking" },
  { key: "cctv", label: "CCTV" },
  { key: "ac", label: "AC" },
  { key: "ro_water", label: "RO Water" },
  { key: "warden", label: "Warden" }
];

const ROOM_TYPE_OPTIONS: RoomType[] = ["single", "double", "triple"];

const INITIAL_STATE: PgFormState = { ok: false };

function slugify(input: string): string {
  return input
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 80);
}

export default function PGForm({ mode, pg }: Props) {
  const action = mode === "create" ? createPg : updatePg;
  const [state, formAction, isPending] = useActionState(action, INITIAL_STATE);

  const [name, setName] = useState(pg?.name ?? "");
  const [slug, setSlug] = useState(pg?.slug ?? "");
  const [slugTouched, setSlugTouched] = useState(Boolean(pg?.slug));

  const [photos, setPhotos] = useState<string[]>(pg?.photos ?? []);
  const [photoError, setPhotoError] = useState<string | null>(null);
  const [uploading, startUpload] = useTransition();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [videos, setVideos] = useState<string[]>(pg?.videos ?? []);
  const [videoError, setVideoError] = useState<string | null>(null);
  const [videoProgress, setVideoProgress] = useState<number | null>(null);
  const videoInputRef = useRef<HTMLInputElement>(null);

  const [links, setLinks] = useState<PgLink[]>(pg?.links ?? []);

  const [rooms, setRooms] = useState<RoomTypeEntry[]>(
    pg?.room_types?.length
      ? pg.room_types
      : [{ type: "double", price: 0, ac: false }]
  );

  const [amenities, setAmenities] = useState<Record<string, boolean>>(() => {
    const out: Record<string, boolean> = {};
    for (const f of AMENITY_FIELDS) out[f.key] = Boolean(pg?.amenities?.[f.key as keyof typeof pg.amenities]);
    return out;
  });

  const [customAmenities, setCustomAmenities] = useState<string[]>(() => {
    if (!pg?.amenities) return [];
    const known = new Set(AMENITY_FIELDS.map((f) => f.key));
    return Object.entries(pg.amenities)
      .filter(([k, v]) => v === true && !known.has(k))
      .map(([k]) => k);
  });

  useEffect(() => {
    if (!slugTouched) setSlug(slugify(name));
  }, [name, slugTouched]);

  function handlePhotoPick(file: File) {
    setPhotoError(null);
    startUpload(async () => {
      const fd = new FormData();
      fd.append("file", file);
      const result = await uploadPgPhoto(fd);
      if (!result.ok) {
        setPhotoError(result.error);
        return;
      }
      setPhotos((prev) => [...prev, result.url]);
    });
  }

  async function handleRemovePhoto(url: string) {
    setPhotos((prev) => prev.filter((u) => u !== url));
    const fd = new FormData();
    fd.append("url", url);
    void deletePgPhotoFile(fd);
  }

  function movePhoto(idx: number, dir: -1 | 1) {
    setPhotos((prev) => {
      const next = [...prev];
      const target = idx + dir;
      if (target < 0 || target >= next.length) return prev;
      [next[idx], next[target]] = [next[target], next[idx]];
      return next;
    });
  }

  async function handleVideoPick(file: File) {
    setVideoError(null);
    setVideoProgress(0);
    try {
      const fd = new FormData();
      fd.append("mimeType", file.type);
      fd.append("size", String(file.size));
      const issued = await createVideoUploadUrl(fd);
      if (!issued.ok) {
        setVideoError(issued.error);
        setVideoProgress(null);
        return;
      }

      const { error: uploadError } = await supabase.storage
        .from(VIDEO_BUCKET)
        .uploadToSignedUrl(issued.path, issued.token, file, { contentType: file.type });

      if (uploadError) {
        console.error("[handleVideoPick] upload failed:", uploadError.message);
        setVideoError("Upload failed. Try again.");
        setVideoProgress(null);
        return;
      }

      setVideos((prev) => [...prev, issued.publicUrl]);
      setVideoProgress(null);
    } catch (err) {
      console.error("[handleVideoPick] unexpected:", err);
      setVideoError("Something went wrong during upload.");
      setVideoProgress(null);
    }
  }

  async function handleRemoveVideo(url: string) {
    setVideos((prev) => prev.filter((u) => u !== url));
    const fd = new FormData();
    fd.append("url", url);
    void deletePgVideoFile(fd);
  }

  function moveVideo(idx: number, dir: -1 | 1) {
    setVideos((prev) => {
      const next = [...prev];
      const target = idx + dir;
      if (target < 0 || target >= next.length) return prev;
      [next[idx], next[target]] = [next[target], next[idx]];
      return next;
    });
  }

  function addLink() {
    setLinks((prev) => (prev.length >= 10 ? prev : [...prev, { url: "" }]));
  }

  function updateLink(idx: number, patch: Partial<PgLink>) {
    setLinks((prev) => prev.map((l, i) => (i === idx ? { ...l, ...patch } : l)));
  }

  function removeLink(idx: number) {
    setLinks((prev) => prev.filter((_, i) => i !== idx));
  }

  function updateRoom(idx: number, patch: Partial<RoomTypeEntry>) {
    setRooms((prev) => prev.map((r, i) => (i === idx ? { ...r, ...patch } : r)));
  }

  function addRoom() {
    setRooms((prev) => [...prev, { type: "single", price: 0, ac: false }]);
  }

  function removeRoom(idx: number) {
    setRooms((prev) => (prev.length === 1 ? prev : prev.filter((_, i) => i !== idx)));
  }

  function addCustomAmenity() {
    setCustomAmenities((prev) => [...prev, ""]);
  }

  function updateCustomAmenity(idx: number, value: string) {
    setCustomAmenities((prev) => prev.map((v, i) => (i === idx ? value : v)));
  }

  function removeCustomAmenity(idx: number) {
    setCustomAmenities((prev) => prev.filter((_, i) => i !== idx));
  }

  return (
    <form action={formAction} className="space-y-8">
      {pg && <input type="hidden" name="id" value={pg.id} />}
      <input type="hidden" name="photos" value={JSON.stringify(photos)} />
      <input type="hidden" name="videos" value={JSON.stringify(videos)} />
      <input type="hidden" name="links" value={JSON.stringify(links)} />
      <input type="hidden" name="room_types" value={JSON.stringify(rooms)} />
      <input type="hidden" name="custom_amenities" value={JSON.stringify(customAmenities)} />

      {state.error && (
        <div className="rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-700">
          {state.error}
        </div>
      )}

      {/* Basics */}
      <Section title="Basics">
        <Field label="PG name" required>
          <input
            type="text"
            name="name"
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            className={inputClass}
            placeholder="e.g. Sharma Residency"
          />
        </Field>
        <Field
          label="URL slug"
          hint="Lowercase, hyphens only. Auto-generated from name unless you change it."
          required
        >
          <input
            type="text"
            name="slug"
            required
            value={slug}
            onChange={(e) => {
              setSlug(slugify(e.target.value));
              setSlugTouched(true);
            }}
            className={inputClass}
            placeholder="sharma-residency"
          />
        </Field>
        <Field label="Description" hint="Shown on the detail page." className="sm:col-span-2">
          <textarea
            name="description"
            rows={4}
            defaultValue={pg?.description ?? ""}
            className={`${inputClass} h-auto py-2.5`}
            placeholder="What makes this PG a good place to stay?"
          />
        </Field>
      </Section>

      {/* Location */}
      <Section title="Location">
        <Field label="Address" required className="sm:col-span-2">
          <input
            type="text"
            name="address"
            required
            defaultValue={pg?.address ?? ""}
            className={inputClass}
            placeholder="House 12, Sector 5, Dehmi Kalan, Jaipur"
          />
        </Field>
        <Field label="Area" hint="Short locality name (e.g. Dehmi Kalan).">
          <input
            type="text"
            name="area"
            defaultValue={pg?.area ?? ""}
            className={inputClass}
            placeholder="Dehmi Kalan"
          />
        </Field>
        <Field label="Distance from MUJ (km)">
          <input
            type="number"
            name="distance_km"
            min="0"
            step="0.1"
            defaultValue={pg?.distance_km ?? ""}
            className={inputClass}
            placeholder="1.5"
          />
        </Field>
      </Section>

      {/* Pricing & gender */}
      <Section title="Audience & pricing">
        <Field label="Gender" required>
          <div className="flex flex-wrap gap-2">
            {(["boys", "girls", "both"] as const).map((g) => (
              <label
                key={g}
                className="flex cursor-pointer items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 has-[:checked]:border-brand has-[:checked]:bg-brand has-[:checked]:text-white"
              >
                <input
                  type="radio"
                  name="gender"
                  value={g}
                  required
                  defaultChecked={pg?.gender === g || (!pg && g === "boys")}
                  className="sr-only"
                />
                {g === "both" ? "Co-living" : g === "boys" ? "Boys" : "Girls"}
              </label>
            ))}
          </div>
        </Field>
        <Field label="Starting price (₹/year)" required>
          <input
            type="number"
            name="starting_price"
            min="1"
            step="1"
            required
            defaultValue={pg?.starting_price ?? ""}
            className={inputClass}
            placeholder="140000"
          />
        </Field>
      </Section>

      {/* Owner */}
      <Section title="Owner contact (internal)">
        <Field label="Owner name">
          <input
            type="text"
            name="owner_name"
            defaultValue={pg?.owner_name ?? ""}
            className={inputClass}
            placeholder="Mr. Gupta"
          />
        </Field>
        <Field label="Owner phone" hint="International format, no + or spaces. e.g. 919876543210">
          <input
            type="text"
            name="owner_phone"
            inputMode="numeric"
            pattern="\d{10,15}"
            defaultValue={pg?.owner_phone ?? ""}
            className={inputClass}
            placeholder="9876543210"
          />
        </Field>
      </Section>

      {/* Rooms */}
      <Section title="Rooms & pricing" fullWidth>
        <div className="space-y-3">
          {rooms.map((room, idx) => (
            <div
              key={idx}
              className="grid grid-cols-2 gap-3 rounded-2xl border border-slate-200 bg-white p-4 sm:grid-cols-[1fr_1fr_auto_auto]"
            >
              <label className="text-sm">
                <span className="mb-1 block text-xs font-medium text-slate-600">Type</span>
                <select
                  value={room.type}
                  onChange={(e) => updateRoom(idx, { type: e.target.value as RoomType })}
                  className={inputClass}
                >
                  {ROOM_TYPE_OPTIONS.map((t) => (
                    <option key={t} value={t}>
                      {t} sharing
                    </option>
                  ))}
                </select>
              </label>
              <label className="text-sm">
                <span className="mb-1 block text-xs font-medium text-slate-600">Price (₹)</span>
                <input
                  type="number"
                  min="0"
                  step="1"
                  value={room.price || ""}
                  onChange={(e) => updateRoom(idx, { price: Number(e.target.value) || 0 })}
                  className={inputClass}
                  placeholder="140000"
                />
              </label>
              <label className="flex items-end gap-2 pb-1.5 text-sm">
                <input
                  type="checkbox"
                  checked={room.ac}
                  onChange={(e) => updateRoom(idx, { ac: e.target.checked })}
                  className="h-4 w-4 rounded border-slate-300 text-brand focus:ring-brand"
                />
                <span className="text-slate-700">AC</span>
              </label>
              <div className="flex items-end justify-end pb-1">
                <button
                  type="button"
                  onClick={() => removeRoom(idx)}
                  disabled={rooms.length === 1}
                  className="rounded-lg border border-slate-200 px-2.5 py-2 text-xs text-slate-600 hover:border-red-200 hover:text-red-600 disabled:opacity-40"
                >
                  Remove
                </button>
              </div>
            </div>
          ))}
          <button
            type="button"
            onClick={addRoom}
            className="rounded-xl border border-dashed border-slate-300 px-4 py-2.5 text-sm font-medium text-slate-600 hover:border-brand hover:text-brand"
          >
            + Add another room type
          </button>
        </div>
      </Section>

      {/* Amenities */}
      <Section title="Amenities" fullWidth>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
          {AMENITY_FIELDS.map((a) => (
            <label
              key={a.key}
              className="flex cursor-pointer items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm has-[:checked]:border-brand has-[:checked]:bg-brand/5"
            >
              <input
                type="checkbox"
                name={`amenity_${a.key}`}
                checked={Boolean(amenities[a.key])}
                onChange={(e) =>
                  setAmenities((prev) => ({ ...prev, [a.key]: e.target.checked }))
                }
                className="h-4 w-4 rounded border-slate-300 text-brand focus:ring-brand"
              />
              <span className="text-slate-700">{a.label}</span>
            </label>
          ))}
        </div>

        {customAmenities.length > 0 && (
          <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-4">
            {customAmenities.map((label, idx) => (
              <div
                key={idx}
                className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm"
              >
                <input
                  type="text"
                  value={label}
                  onChange={(e) => updateCustomAmenity(idx, e.target.value)}
                  placeholder="e.g. Gym"
                  maxLength={40}
                  className="min-w-0 flex-1 bg-transparent outline-none placeholder:text-slate-400"
                />
                <button
                  type="button"
                  onClick={() => removeCustomAmenity(idx)}
                  className="shrink-0 rounded-md px-1.5 py-0.5 text-xs text-slate-400 hover:bg-red-50 hover:text-red-600"
                  aria-label="Remove amenity"
                >
                  ✕
                </button>
              </div>
            ))}
          </div>
        )}

        <button
          type="button"
          onClick={addCustomAmenity}
          className="mt-3 rounded-xl border border-dashed border-slate-300 px-4 py-2.5 text-sm font-medium text-slate-600 hover:border-brand hover:text-brand"
        >
          + Add another amenity
        </button>
      </Section>

      {/* Photos */}
      <Section title="Photos" fullWidth>
        <p className="mb-3 text-xs text-slate-500">
          First photo is the cover shown on the listing card. Drag to reorder using the arrows.
          JPG / PNG / WebP, up to 8 MB each.
        </p>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          {photos.map((url, idx) => (
            <div
              key={url}
              className="group relative aspect-[4/3] overflow-hidden rounded-xl border border-slate-200 bg-slate-100"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={url} alt={`Photo ${idx + 1}`} className="h-full w-full object-cover" />
              {idx === 0 && (
                <span className="absolute left-2 top-2 rounded-full bg-brand px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-white">
                  Cover
                </span>
              )}
              <div className="absolute inset-x-0 bottom-0 flex items-center justify-between gap-1 bg-gradient-to-t from-black/70 to-transparent p-2 opacity-0 transition group-hover:opacity-100">
                <div className="flex gap-1">
                  <button
                    type="button"
                    onClick={() => movePhoto(idx, -1)}
                    disabled={idx === 0}
                    className="rounded-md bg-white/90 px-1.5 py-0.5 text-xs font-medium text-slate-800 disabled:opacity-40"
                    aria-label="Move left"
                  >
                    ←
                  </button>
                  <button
                    type="button"
                    onClick={() => movePhoto(idx, 1)}
                    disabled={idx === photos.length - 1}
                    className="rounded-md bg-white/90 px-1.5 py-0.5 text-xs font-medium text-slate-800 disabled:opacity-40"
                    aria-label="Move right"
                  >
                    →
                  </button>
                </div>
                <button
                  type="button"
                  onClick={() => handleRemovePhoto(url)}
                  className="rounded-md bg-red-500/95 px-2 py-0.5 text-xs font-semibold text-white"
                >
                  Remove
                </button>
              </div>
            </div>
          ))}

          <label className="flex aspect-[4/3] cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-slate-300 bg-white text-center text-sm text-slate-600 hover:border-brand hover:text-brand">
            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              className="hidden"
              disabled={uploading}
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) handlePhotoPick(file);
                if (fileInputRef.current) fileInputRef.current.value = "";
              }}
            />
            <span className="text-2xl leading-none">+</span>
            <span className="font-medium">{uploading ? "Uploading…" : "Add photo"}</span>
          </label>
        </div>
        {photoError && (
          <p className="mt-2 text-sm text-red-600">{photoError}</p>
        )}
      </Section>

      {/* Videos */}
      <Section title="Videos" fullWidth>
        <p className="mb-3 text-xs text-slate-500">
          Optional walkthrough clips. MP4 / WebM / MOV, up to 100 MB each. Uploads go directly to
          storage so larger files are fine — just slower.
        </p>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          {videos.map((url, idx) => (
            <div
              key={url}
              className="group relative aspect-video overflow-hidden rounded-xl border border-slate-200 bg-slate-900"
            >
              <video
                src={url}
                controls
                playsInline
                preload="metadata"
                className="h-full w-full object-cover"
              />
              <div className="pointer-events-none absolute inset-x-0 bottom-0 flex items-center justify-between gap-1 bg-gradient-to-t from-black/80 to-transparent p-2 opacity-0 transition group-hover:opacity-100 group-hover:[&>*]:pointer-events-auto">
                <div className="flex gap-1">
                  <button
                    type="button"
                    onClick={() => moveVideo(idx, -1)}
                    disabled={idx === 0}
                    className="rounded-md bg-white/90 px-1.5 py-0.5 text-xs font-medium text-slate-800 disabled:opacity-40"
                    aria-label="Move left"
                  >
                    ←
                  </button>
                  <button
                    type="button"
                    onClick={() => moveVideo(idx, 1)}
                    disabled={idx === videos.length - 1}
                    className="rounded-md bg-white/90 px-1.5 py-0.5 text-xs font-medium text-slate-800 disabled:opacity-40"
                    aria-label="Move right"
                  >
                    →
                  </button>
                </div>
                <button
                  type="button"
                  onClick={() => handleRemoveVideo(url)}
                  className="rounded-md bg-red-500/95 px-2 py-0.5 text-xs font-semibold text-white"
                >
                  Remove
                </button>
              </div>
            </div>
          ))}

          <label className="relative flex aspect-video cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-slate-300 bg-white text-center text-sm text-slate-600 hover:border-brand hover:text-brand">
            <input
              ref={videoInputRef}
              type="file"
              accept="video/mp4,video/webm,video/quicktime"
              className="hidden"
              disabled={videoProgress !== null}
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) void handleVideoPick(file);
                if (videoInputRef.current) videoInputRef.current.value = "";
              }}
            />
            <span className="text-2xl leading-none">▶</span>
            <span className="font-medium">
              {videoProgress !== null ? "Uploading…" : "Add video"}
            </span>
          </label>
        </div>
        {videoError && <p className="mt-2 text-sm text-red-600">{videoError}</p>}
      </Section>

      {/* Links */}
      <Section title="Links" fullWidth>
        <p className="mb-3 text-xs text-slate-500">
          Instagram, YouTube tour, Google Maps location, owner website, etc. Platform name is
          auto-detected from the URL; optionally override with a custom label. Up to 10 links.
        </p>
        <div className="space-y-2">
          {links.map((link, idx) => (
            <div
              key={idx}
              className="grid grid-cols-1 gap-2 rounded-2xl border border-slate-200 bg-white p-3 sm:grid-cols-[1fr_220px_auto]"
            >
              <label className="text-sm">
                <span className="mb-1 block text-xs font-medium text-slate-600">URL</span>
                <input
                  type="url"
                  value={link.url}
                  onChange={(e) => updateLink(idx, { url: e.target.value })}
                  placeholder="https://instagram.com/your-pg"
                  className={inputClass}
                  inputMode="url"
                />
              </label>
              <label className="text-sm">
                <span className="mb-1 block text-xs font-medium text-slate-600">
                  Label <span className="text-slate-400">(optional)</span>
                </span>
                <input
                  type="text"
                  value={link.label ?? ""}
                  onChange={(e) => updateLink(idx, { label: e.target.value })}
                  placeholder="e.g. Watch tour"
                  maxLength={30}
                  className={inputClass}
                />
              </label>
              <div className="flex items-end justify-end pb-1">
                <button
                  type="button"
                  onClick={() => removeLink(idx)}
                  className="rounded-lg border border-slate-200 px-2.5 py-2 text-xs text-slate-600 hover:border-red-200 hover:text-red-600"
                >
                  Remove
                </button>
              </div>
            </div>
          ))}

          <button
            type="button"
            onClick={addLink}
            disabled={links.length >= 10}
            className="w-full rounded-xl border border-dashed border-slate-300 px-4 py-2.5 text-sm font-medium text-slate-600 hover:border-brand hover:text-brand disabled:cursor-not-allowed disabled:opacity-50"
          >
            + Add link
          </button>
        </div>
      </Section>

      {/* Publish toggle + submit */}
      <div className="flex flex-col items-stretch gap-3 border-t border-slate-200 pt-6 sm:flex-row sm:items-center sm:justify-between">
        <label className="flex cursor-pointer items-center gap-2 text-sm text-slate-700">
          <input
            type="checkbox"
            name="is_active"
            defaultChecked={pg ? pg.is_active : true}
            className="h-4 w-4 rounded border-slate-300 text-brand focus:ring-brand"
          />
          <span>
            <span className="font-medium">Publish this PG</span>
            <span className="ml-1 text-slate-500">(visible on the homepage)</span>
          </span>
        </label>
        <button
          type="submit"
          disabled={isPending || uploading || videoProgress !== null}
          className="rounded-xl bg-brand px-6 py-3 text-base font-semibold text-white shadow-sm transition hover:bg-brand-dark disabled:opacity-60"
        >
          {isPending
            ? "Saving…"
            : mode === "create"
            ? "Upload PG"
            : "Save changes"}
        </button>
      </div>
    </form>
  );
}

const inputClass =
  "h-11 w-full rounded-xl border border-slate-200 bg-white px-3 outline-none focus:border-brand focus:ring-2 focus:ring-brand/10";

function Section({
  title,
  children,
  fullWidth
}: {
  title: string;
  children: React.ReactNode;
  fullWidth?: boolean;
}) {
  return (
    <div>
      <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-slate-500">
        {title}
      </h2>
      {fullWidth ? (
        <div>{children}</div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">{children}</div>
      )}
    </div>
  );
}

function Field({
  label,
  children,
  hint,
  required,
  className
}: {
  label: string;
  children: React.ReactNode;
  hint?: string;
  required?: boolean;
  className?: string;
}) {
  return (
    <label className={`block text-sm ${className ?? ""}`}>
      <span className="mb-1.5 block font-medium text-slate-700">
        {label}
        {required && <span className="ml-0.5 text-red-500">*</span>}
      </span>
      {children}
      {hint && <span className="mt-1 block text-xs text-slate-500">{hint}</span>}
    </label>
  );
}
