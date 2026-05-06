"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { ADMIN_COOKIE, checkPasscode, isAdminAuthed } from "@/lib/admin-session";
import { supabaseAdmin } from "@/lib/supabase-admin";

const COOKIE_MAX_AGE = 60 * 60 * 12; // 12 hours

export async function loginAdmin(formData: FormData): Promise<void> {
  const input = String(formData.get("passcode") ?? "");

  if (!input || !checkPasscode(input)) {
    redirect("/admin/login?error=1");
  }

  const jar = await cookies();
  jar.set(ADMIN_COOKIE, input, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: COOKIE_MAX_AGE
  });

  redirect("/admin/inquiries");
}

export async function logoutAdmin(): Promise<void> {
  const jar = await cookies();
  jar.delete(ADMIN_COOKIE);
  redirect("/admin/login");
}

export async function toggleHandled(formData: FormData): Promise<void> {
  if (!(await isAdminAuthed())) {
    redirect("/admin/login");
  }

  const id = String(formData.get("id") ?? "");
  const next = String(formData.get("next") ?? "") === "true";
  if (!id) return;

  const { error } = await supabaseAdmin
    .from("inquiries")
    .update({
      handled: next,
      handled_at: next ? new Date().toISOString() : null
    })
    .eq("id", id);

  if (error) {
    console.error("[admin toggleHandled]", error.message);
    throw new Error("Could not update inquiry.");
  }

  revalidatePath("/admin/inquiries");
}
