import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/session";
import { getAllMembers } from "@/lib/data";
import { saveProfileForm } from "./actions";

export default async function ProfilePage({ searchParams }: { searchParams: { saved?: string } }) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  const me = (await getAllMembers()).find(m => m.id === user.id);
  if (!me) redirect("/documents");
  const input = "w-full border border-black/10 rounded-lg px-3 py-2 text-sm mt-1";
  const field = (name: string, label: string, value: string | null, type = "text") => (
    <div>
      <label className="text-xs font-medium text-black/60">{label}</label>
      <input name={name} type={type} defaultValue={value ?? ""} className={input} />
    </div>
  );
  return (
    <div className="max-w-xl">
      <h1 className="font-display text-2xl font-bold text-navy mb-1">My profile</h1>
      <p className="text-sm text-black/50 mb-6">This is what other members see in the directory. Your name, email, and role are managed by an admin.</p>
      {searchParams.saved && <div className="mb-4 rounded-lg bg-blue-bg text-blue-status text-sm px-4 py-2">Profile saved.</div>}
      <form action={saveProfileForm} className="bg-white rounded-xl border border-black/10 p-5 space-y-4">
        <div className="text-sm"><span className="font-medium">{me.name}</span> <span className="text-black/40">· {me.email} · {me.role}</span></div>
        {field("title", "Title", me.title)}
        {field("employer", "Employer", me.employer)}
        {field("city", "City", me.city)}
        {field("phone", "Phone", me.phone, "tel")}
        {field("linkedin", "LinkedIn URL", me.linkedin, "url")}
        <button className="bg-navy text-white rounded-lg px-4 py-2 text-sm font-medium">Save</button>
      </form>
    </div>
  );
}
