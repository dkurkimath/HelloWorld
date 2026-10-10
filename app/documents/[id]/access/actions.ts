"use server";
import { redirect } from "next/navigation";
import { updateAccessAction } from "@/app/documents/actions";

export async function updateAccessForm(docId: number, docTitle: string, formData: FormData) {
  const visibility = (formData.get("visibility") as "all" | "custom") ?? "all";
  const permissions: Record<string, "view" | "edit"> = {};
  Array.from(formData.entries()).forEach(([key, value]) => {
    if (key.startsWith("perm_") && (value === "view" || value === "edit")) {
      permissions[key.replace("perm_", "")] = value;
    }
  });
  await updateAccessAction(docId, docTitle, visibility, permissions);
  redirect("/documents");
}
