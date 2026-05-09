"use server";

import { randomUUID } from "crypto";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { isAdminAuthed } from "@/lib/admin-session";
import { supabaseAdmin } from "@/lib/supabase-admin";
import type { Amenities, Gender, RoomTypeEntry } from "@/lib/types";

const BUCKET = "pg-photos";
const MAX_PHOTO_BYTES = 8 * 1024 * 1024;
const ALLOWED_PHOTO_TYPES = new Set(["image/jpeg", "image/png", "image/webp"]);

const AMENITY_KEYS: (keyof Amenities)[] = [
  "wifi",
  "food",
  "laundry",
  "parking",
  "cctv",
  "ac",
  "ro_water",
  "warden"
];

export type PgFormState = {
  ok: boolean;
  error?: string;
};

export type PhotoUploadResult =
  | { ok: true; url: string }
  | { ok: false; error: string };

async function requireAdmin(): Promise<void> {
  if (!(await isAdminAuthed())) {
    redirect("/admin/login");
  }
}

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

function parseRoomTypes(raw: string): RoomTypeEntry[] | null {
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    return null;
  }
  if (!Array.isArray(parsed) || parsed.length === 0) return null;

  const out: RoomTypeEntry[] = [];
  for (const r of parsed) {
    if (!r || typeof r !== "object") return null;
    const row = r as Record<string, unknown>;
    const type = row.type;
    const price = Number(row.price);
    const ac = Boolean(row.ac);
    const available = Number(row.available);
    if (type !== "single" && type !== "double" && type !== "triple") return null;
    if (!Number.isFinite(price) || price < 0) return null;
    if (!Number.isFinite(available) || available < 0) return null;
    out.push({ type, price: Math.round(price), ac, available: Math.round(available) });
  }
  return out;
}

function parsePhotoUrls(raw: string): string[] | null {
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    return null;
  }
  if (!Array.isArray(parsed)) return null;
  const out: string[] = [];
  for (const u of parsed) {
    if (typeof u !== "string") return null;
    if (!/^https?:\/\//.test(u)) return null;
    out.push(u);
  }
  return out;
}

function readAmenities(form: FormData): Amenities {
  const out: Amenities = {};
  for (const key of AMENITY_KEYS) {
    if (form.get(`amenity_${key}`) === "on") out[key] = true;
  }

  const rawCustom = String(form.get("custom_amenities") ?? "");
  if (rawCustom) {
    let parsed: unknown;
    try {
      parsed = JSON.parse(rawCustom);
    } catch {
      parsed = null;
    }
    if (Array.isArray(parsed)) {
      const reserved = new Set<string>(AMENITY_KEYS as string[]);
      const seen = new Set<string>();
      for (const v of parsed) {
        if (typeof v !== "string") continue;
        const label = v.trim().slice(0, 40);
        if (!label) continue;
        const dedupeKey = label.toLowerCase();
        if (reserved.has(dedupeKey) || seen.has(dedupeKey)) continue;
        seen.add(dedupeKey);
        out[label] = true;
      }
    }
  }

  return out;
}

function readGender(value: unknown): Gender | null {
  if (value === "boys" || value === "girls" || value === "both") return value;
  return null;
}

function extractStoragePath(publicUrl: string): string | null {
  const marker = `/storage/v1/object/public/${BUCKET}/`;
  const i = publicUrl.indexOf(marker);
  if (i === -1) return null;
  return publicUrl.slice(i + marker.length);
}

function buildPgPayload(form: FormData): { payload: Record<string, unknown> | null; error?: string } {
  const name = String(form.get("name") ?? "").trim();
  if (!name) return { payload: null, error: "Name is required." };

  const slugInput = String(form.get("slug") ?? "").trim();
  const slug = slugify(slugInput || name);
  if (!slug) return { payload: null, error: "Could not generate a valid slug." };

  const address = String(form.get("address") ?? "").trim();
  if (!address) return { payload: null, error: "Address is required." };

  const gender = readGender(form.get("gender"));
  if (!gender) return { payload: null, error: "Gender must be boys, girls, or both." };

  const startingPriceRaw = Number(form.get("starting_price"));
  if (!Number.isFinite(startingPriceRaw) || startingPriceRaw <= 0) {
    return { payload: null, error: "Starting price must be a positive number." };
  }

  const distanceRaw = String(form.get("distance_km") ?? "").trim();
  const distance_km = distanceRaw === "" ? null : Number(distanceRaw);
  if (distance_km != null && (!Number.isFinite(distance_km) || distance_km < 0)) {
    return { payload: null, error: "Distance must be a non-negative number." };
  }

  const description = String(form.get("description") ?? "").trim() || null;
  const area = String(form.get("area") ?? "").trim() || null;
  const owner_name = String(form.get("owner_name") ?? "").trim() || null;
  const owner_phone = String(form.get("owner_phone") ?? "").trim() || null;

  if (owner_phone && !/^\d{10,15}$/.test(owner_phone)) {
    return { payload: null, error: "Owner phone must be 10–15 digits, no + or spaces." };
  }

  const room_types = parseRoomTypes(String(form.get("room_types") ?? ""));
  if (!room_types) return { payload: null, error: "Add at least one valid room type." };

  const photos = parsePhotoUrls(String(form.get("photos") ?? "[]"));
  if (!photos) return { payload: null, error: "Photo list is malformed." };

  const amenities = readAmenities(form);
  const is_active = form.get("is_active") === "on";

  return {
    payload: {
      slug,
      name,
      description,
      address,
      area,
      distance_km,
      gender,
      starting_price: Math.round(startingPriceRaw),
      owner_name,
      owner_phone,
      amenities,
      room_types,
      photos,
      is_active
    }
  };
}

export async function uploadPgPhoto(formData: FormData): Promise<PhotoUploadResult> {
  await requireAdmin();

  const file = formData.get("file");
  if (!(file instanceof File)) return { ok: false, error: "No file received." };
  if (file.size === 0) return { ok: false, error: "File is empty." };
  if (file.size > MAX_PHOTO_BYTES) {
    return { ok: false, error: `Photo too large (max ${MAX_PHOTO_BYTES / 1024 / 1024} MB).` };
  }
  if (!ALLOWED_PHOTO_TYPES.has(file.type)) {
    return { ok: false, error: "Only JPG, PNG, or WebP images allowed." };
  }

  const ext = file.type === "image/png" ? "png" : file.type === "image/webp" ? "webp" : "jpg";
  const path = `${new Date().getUTCFullYear()}/${randomUUID()}.${ext}`;

  const buf = Buffer.from(await file.arrayBuffer());

  const { error: uploadError } = await supabaseAdmin.storage
    .from(BUCKET)
    .upload(path, buf, {
      contentType: file.type,
      cacheControl: "31536000",
      upsert: false
    });

  if (uploadError) {
    console.error("[uploadPgPhoto] storage error:", uploadError.message);
    return { ok: false, error: "Upload failed. Try again." };
  }

  const { data } = supabaseAdmin.storage.from(BUCKET).getPublicUrl(path);
  return { ok: true, url: data.publicUrl };
}

export async function deletePgPhotoFile(formData: FormData): Promise<{ ok: boolean }> {
  await requireAdmin();
  const url = String(formData.get("url") ?? "");
  const path = extractStoragePath(url);
  if (!path) return { ok: false };
  const { error } = await supabaseAdmin.storage.from(BUCKET).remove([path]);
  if (error) console.error("[deletePgPhotoFile] storage error:", error.message);
  return { ok: !error };
}

export async function createPg(_prev: PgFormState, formData: FormData): Promise<PgFormState> {
  await requireAdmin();

  const { payload, error } = buildPgPayload(formData);
  if (!payload) return { ok: false, error };

  const { error: insertError } = await supabaseAdmin.from("pgs").insert(payload);

  if (insertError) {
    if (insertError.code === "23505") {
      return { ok: false, error: "That slug is already used. Pick a different one." };
    }
    console.error("[createPg] insert error:", insertError.message);
    return { ok: false, error: "Could not create PG. Check the fields and try again." };
  }

  revalidatePath("/admin/pgs");
  revalidatePath("/");
  redirect("/admin/pgs?created=1");
}

export async function updatePg(_prev: PgFormState, formData: FormData): Promise<PgFormState> {
  await requireAdmin();

  const id = String(formData.get("id") ?? "");
  if (!id) return { ok: false, error: "Missing PG id." };

  const { payload, error } = buildPgPayload(formData);
  if (!payload) return { ok: false, error };

  const { error: updateError } = await supabaseAdmin.from("pgs").update(payload).eq("id", id);

  if (updateError) {
    if (updateError.code === "23505") {
      return { ok: false, error: "That slug is already used. Pick a different one." };
    }
    console.error("[updatePg] update error:", updateError.message);
    return { ok: false, error: "Could not save changes." };
  }

  revalidatePath("/admin/pgs");
  revalidatePath(`/admin/pgs/${id}/edit`);
  revalidatePath(`/pg/${payload.slug as string}`);
  revalidatePath("/");
  redirect("/admin/pgs?updated=1");
}

export async function togglePgActive(formData: FormData): Promise<void> {
  await requireAdmin();
  const id = String(formData.get("id") ?? "");
  const next = String(formData.get("next") ?? "") === "true";
  if (!id) return;

  const { error } = await supabaseAdmin.from("pgs").update({ is_active: next }).eq("id", id);
  if (error) {
    console.error("[togglePgActive] update error:", error.message);
    throw new Error("Could not toggle active state.");
  }

  revalidatePath("/admin/pgs");
  revalidatePath("/");
}

export async function deletePg(formData: FormData): Promise<void> {
  await requireAdmin();
  const id = String(formData.get("id") ?? "");
  if (!id) return;

  const { data: existing } = await supabaseAdmin
    .from("pgs")
    .select("photos, slug")
    .eq("id", id)
    .maybeSingle();

  const photos = (existing?.photos as string[] | null) ?? [];
  const paths = photos.map(extractStoragePath).filter((p): p is string => !!p);

  const { error: deleteError } = await supabaseAdmin.from("pgs").delete().eq("id", id);
  if (deleteError) {
    console.error("[deletePg] delete error:", deleteError.message);
    throw new Error("Could not delete PG.");
  }

  if (paths.length > 0) {
    const { error: storageError } = await supabaseAdmin.storage.from(BUCKET).remove(paths);
    if (storageError) console.error("[deletePg] storage cleanup:", storageError.message);
  }

  revalidatePath("/admin/pgs");
  if (existing?.slug) revalidatePath(`/pg/${existing.slug as string}`);
  revalidatePath("/");
  redirect("/admin/pgs?deleted=1");
}
