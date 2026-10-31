"use server";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { getCurrentUser } from "@/lib/session";
import { createDocument, logActivity } from "@/lib/data";

const TYPES = ["doc", "pdf", "xls", "img"];

export async function submitDocumentForm(formData: FormData) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  const title = (formData.get("title") as string)?.trim();
  const categoryId = formData.get("categoryId") as string;
  const docType = TYPES.includes(formData.get("docType") as string) ? (formData.get("docType") as string) : "doc";
  const driveUrl = (formData.get("driveUrl") as string)?.trim() || null;
  if (!title || !categoryId) throw new Error("Title and category are required");
  if (driveUrl && !/^https?:\/\//i.test(driveUrl)) throw new Error("Link must start with http(s)://");

  const status = user.isAdmin ? "current" : "review";
  const id = await createDocument({ title, categoryId, docType, driveUrl, uploadedBy: user.id, status });
  await logActivity(
    user.id, "ti-file-plus",
    status === "review"
      ? `<b>${user.name}</b> submitted <b>${title}</b> for review`
      : `<b>${user.name}</b> added <b>${title}</b>`,
    "document"
  );
  revalidatePath("/documents");
  revalidatePath("/admin/approvals");
  redirect(status === "review" ? "/documents?submitted=1" : `/documents/${id}`);
}
