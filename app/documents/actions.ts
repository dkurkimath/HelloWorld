"use server";
import { revalidatePath } from "next/cache";
import { getCurrentUser } from "@/lib/session";
import { toggleStar, recordRecentAction, logActivity, canAccessDocument, setDocumentAccess } from "@/lib/data";

export async function starAction(documentId: number) {
  const user = await getCurrentUser();
  if (!user) return;
  await toggleStar(user.id, documentId);
  revalidatePath("/documents");
}

export async function openDocAction(documentId: number, driveUrl: string | null) {
  const user = await getCurrentUser();
  if (!user || !driveUrl) return;
  const allowed = await canAccessDocument(documentId, user.id, user.isAdmin);
  if (!allowed) return;
  await recordRecentAction(user.id, documentId, "downloaded");
  revalidatePath("/documents");
}

export async function updateAccessAction(documentId: number, docTitle: string, visibility: "all" | "custom", permissions: Record<string, "view" | "edit">) {
  const user = await getCurrentUser();
  if (!user?.isAdmin) throw new Error("Admin only");
  await setDocumentAccess(documentId, visibility, permissions);
  await recordRecentAction(user.id, documentId, "access_updated");
  await logActivity(user.id, "ti-lock", `<b>${user.name}</b> updated access on <b>${docTitle}</b>`, "document");
  revalidatePath("/documents");
  revalidatePath(`/documents/${documentId}/access`);
}
