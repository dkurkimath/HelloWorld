"use server";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { getCurrentUser } from "@/lib/session";
import { logActivity } from "@/lib/data";
import { driveConfigured, syncDriveFolders } from "@/lib/drive";

export async function syncDriveAction() {
  const user = await getCurrentUser();
  if (!user?.isAdmin) throw new Error("Admin only");
  if (!driveConfigured()) redirect("/admin/drive?error=" + encodeURIComponent("Drive isn't configured yet."));
  let qs: string;
  try {
    const r = await syncDriveFolders(user.id);
    await logActivity(user.id, "ti-brand-google-drive", `<b>${user.name}</b> synced Google Drive (${r.added} new, ${r.updated} updated)`, "document");
    qs = `added=${r.added}&updated=${r.updated}&folders=${r.folders}` + (r.errors.length ? `&error=${encodeURIComponent(r.errors.join(" | "))}` : "");
  } catch (e: any) {
    qs = "error=" + encodeURIComponent(e.message);
  }
  revalidatePath("/documents");
  redirect(`/admin/drive?${qs}`);
}
