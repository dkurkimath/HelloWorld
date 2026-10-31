"use server";
import { revalidatePath } from "next/cache";
import { getCurrentUser } from "@/lib/session";
import { query, queryOne } from "@/lib/db";
import { logActivity, setMemberEmail } from "@/lib/data";

export async function updateMemberForm(memberId: string, formData: FormData) {
  const user = await getCurrentUser();
  if (!user?.isAdmin) throw new Error("Admin only");
  const role = formData.get("role") as string;
  const isAdmin = formData.get("isAdmin") === "on";
  const member = await queryOne<{ name: string }>("SELECT name FROM members WHERE id = $1", [memberId]);
  await query("UPDATE members SET role = $1, is_admin = $2 WHERE id = $3", [role, isAdmin, memberId]);
  await logActivity(user.id, "ti-user-edit", `<b>${user.name}</b> updated ${member?.name}'s role to ${role}`, "member");
  revalidatePath("/admin/members");
}

export async function removeMemberAction(memberId: string) {
  const user = await getCurrentUser();
  if (!user?.isAdmin) throw new Error("Admin only");
  const member = await queryOne<{ name: string }>("SELECT name FROM members WHERE id = $1", [memberId]);
  await query("DELETE FROM members WHERE id = $1", [memberId]);
  await logActivity(user.id, "ti-user-minus", `<b>${user.name}</b> removed ${member?.name} from the portal`, "member");
  revalidatePath("/admin/members");
}

export async function addMemberForm(formData: FormData) {
  const user = await getCurrentUser();
  if (!user?.isAdmin) throw new Error("Admin only");
  const name = formData.get("name") as string;
  const email = formData.get("email") as string;
  const role = (formData.get("role") as string) || "Member";
  if (!name || !email) return;
  const id = "m" + Date.now();
  await query("INSERT INTO members (id, name, email, role) VALUES ($1, $2, $3, $4)", [id, name, email, role]);
  await logActivity(user.id, "ti-user-plus", `<b>${user.name}</b> added ${name} (${role})`, "member");
  revalidatePath("/admin/members");
}

export async function setEmailForm(memberId: string, formData: FormData) {
  const user = await getCurrentUser();
  if (!user?.isAdmin) throw new Error("Admin only");
  const email = (formData.get("email") as string)?.trim().toLowerCase();
  if (!email || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) throw new Error("Enter a valid email");
  const member = await queryOne<{ name: string }>("SELECT name FROM members WHERE id = $1", [memberId]);
  await setMemberEmail(memberId, email);
  await logActivity(user.id, "ti-mail", `<b>${user.name}</b> set an email for ${member?.name}`, "member");
  revalidatePath("/admin/members");
}
