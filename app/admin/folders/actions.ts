"use server";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { getCurrentUser } from "@/lib/session";
import { queryOne } from "@/lib/db";
import { createFolder, renameFolder, deleteFolderIfEmpty, logActivity } from "@/lib/data";

async function requireAdmin() {
  const user = await getCurrentUser();
  if (!user?.isAdmin) throw new Error("Admin only");
  return user;
}

export async function createFolderForm(formData: FormData) {
  const user = await requireAdmin();
  const label = (formData.get("label") as string)?.trim();
  const parentId = (formData.get("parentId") as string) || null;
  if (!label) return;
  if (parentId && !(await queryOne("SELECT 1 FROM categories WHERE id = $1", [parentId]))) throw new Error("Parent folder not found");
  await createFolder(label, parentId);
  await logActivity(user.id, "ti-folder-plus", `<b>${user.name}</b> created the folder <b>${label}</b>`, "document");
  revalidatePath("/admin/folders");
  revalidatePath("/documents");
}

export async function renameFolderForm(folderId: string, formData: FormData) {
  const user = await requireAdmin();
  const label = (formData.get("label") as string)?.trim();
  if (!label) return;
  await renameFolder(folderId, label);
  await logActivity(user.id, "ti-folder", `<b>${user.name}</b> renamed a folder to <b>${label}</b>`, "document");
  revalidatePath("/admin/folders");
  revalidatePath("/documents");
}

export async function deleteFolderForm(folderId: string) {
  const user = await requireAdmin();
  const folder = await queryOne<{ label: string }>("SELECT label FROM categories WHERE id = $1", [folderId]);
  const deleted = await deleteFolderIfEmpty(folderId);
  if (!deleted) redirect("/admin/folders?error=" + encodeURIComponent(`"${folder?.label}" isn't empty — move its documents and subfolders out first.`));
  await logActivity(user.id, "ti-folder-minus", `<b>${user.name}</b> deleted the folder <b>${folder?.label}</b>`, "document");
  revalidatePath("/admin/folders");
  revalidatePath("/documents");
}
