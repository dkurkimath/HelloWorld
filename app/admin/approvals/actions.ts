"use server";
import { revalidatePath } from "next/cache";
import { getCurrentUser } from "@/lib/session";
import { reviewDocument, logActivity, recordRecentAction, getAllMembers } from "@/lib/data";
import { sendAnnouncementEmail } from "@/lib/mail";

export async function reviewDocumentForm(documentId: number, formData: FormData) {
  const user = await getCurrentUser();
  if (!user?.isAdmin) throw new Error("Admin only");
  const decision = formData.get("decision");
  if (decision !== "approved" && decision !== "rejected") throw new Error("Invalid decision");
  const note = (formData.get("note") as string)?.trim() || null;

  const doc = await reviewDocument(documentId, user.id, decision, note);
  if (!doc) return; // already reviewed by someone else

  await recordRecentAction(user.id, documentId, decision === "approved" ? "approved" : "rejected");
  await logActivity(
    user.id, decision === "approved" ? "ti-circle-check" : "ti-circle-x",
    `<b>${user.name}</b> ${decision} <b>${doc.title}</b>`, "document"
  );

  // Let the submitter know (email only if one is on file and mail is configured).
  if (doc.uploaded_by) {
    const members = await getAllMembers();
    const submitter = members.find(m => m.id === doc.uploaded_by);
    if (submitter?.email) {
      await sendAnnouncementEmail(
        submitter.email,
        `Your document "${doc.title}" was ${decision}`,
        note ? `Note from the reviewer: ${note}` : `Your submission was ${decision}.`,
        user.name
      );
    }
  }
  revalidatePath("/admin/approvals");
  revalidatePath("/documents");
}
