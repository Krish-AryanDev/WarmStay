import { redirect } from "next/navigation";
import { isAdminAuthed } from "@/lib/admin-session";

export default async function AdminIndex() {
  redirect((await isAdminAuthed()) ? "/admin/pgs" : "/admin/login");
}
