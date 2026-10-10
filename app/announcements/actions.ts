"use server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/session";
import { createAnnouncement, markAnnouncementRead, markAnnouncementEmailed, logActivity, getAllMembers } from "@/lib/data";
import { sendAnnouncementEmail } from "@/lib/mail";

export async function markReadAction(announcementId: number) {
  const user = await getCurrentUser();
  if (!user) return;
  await markAnnouncementRead(announcementId, user.id);
  revalidatePath("/announcements");
}

export async function sendAnnouncementForm(formData: FormData) {
  const user = await getCurrentUser();
  if (!user?.isAdmin) throw new Error("Admin only");

  const subject = formData.get("subject") as string;
  const message = formData.get("message") as string;
  const documentId = formData.get("documentId") ? Number(formData.get("documentId")) : null;
  const recipientIds = formData.getAll("recipients") as string[];
  if (!subject || !message || recipientIds.length === 0) {
    throw new Error("Subject, message, and at least one recipient are required");
  }

  const annId = await createAnnouncement(subject, message, documentId, user.id, recipientIds);
  await logActivity(user.id, "ti-speakerphone", `<b>${user.name}</b> sent an announcement: <b>${subject}</b>`, "announcement");

  const members = await getAllMembers();
  const byId = Object.fromEntries(members.map(m => [m.id, m]));
  for (const memberId of recipientIds) {
    const member = byId[memberId];
    if (!member) continue;
    await sendAnnouncementEmail(member.email, subject, message, user.name);
    await markAnnouncementEmailed(annId, memberId);
  }

  redirect("/announcements");
}
