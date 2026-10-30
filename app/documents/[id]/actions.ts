"use server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/session";
import { addComment, canAccessDocument, recordRecentAction, logActivity } from "@/lib/data";
import { queryOne } from "@/lib/db";

export async function addCommentForm(documentId: number, formData: FormData) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const allowed = await canAccessDocument(documentId, user.id, user.isAdmin);
  if (!allowed) throw new Error("No access to this document");

  const body = (formData.get("body") as string)?.trim();
  if (!body) return;

  const doc = await queryOne<{ title: string }>("SELECT title FROM documents WHERE id = $1", [documentId]);
  await addComment(documentId, user.id, body);
  await recordRecentAction(user.id, documentId, "commented");
  await logActivity(user.id, "ti-message", `<b>${user.name}</b> commented on <b>${doc?.title}</b>`, "document");

  revalidatePath(`/documents/${documentId}`);
  revalidatePath("/documents");
}
