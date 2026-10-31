"use server";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { getCurrentUser } from "@/lib/session";
import { updateOwnProfile } from "@/lib/data";

const clean = (v: FormDataEntryValue | null) => ((v as string | null)?.trim() || null);

export async function saveProfileForm(formData: FormData) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  const linkedin = clean(formData.get("linkedin"));
  if (linkedin && !/^https?:\/\//i.test(linkedin)) throw new Error("LinkedIn must be a full link starting with https://");
  // Always writes to the signed-in member's own row — never a client-supplied id.
  await updateOwnProfile(user.id, {
    title: clean(formData.get("title")),
    employer: clean(formData.get("employer")),
    city: clean(formData.get("city")),
    phone: clean(formData.get("phone")),
    linkedin,
  });
  revalidatePath("/members");
  redirect("/profile?saved=1");
}
