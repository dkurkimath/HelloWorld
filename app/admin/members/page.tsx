import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/session";
import { getAllMembers } from "@/lib/data";
import { updateMemberForm, removeMemberAction, addMemberForm, setEmailForm } from "./actions";

const ROLES = ["Chair", "Treasurer", "Secretary", "Board Liaison", "Member", "Staff"];

export default async function AdminMembersPage() {
  const user = await getCurrentUser();
  if (!user?.isAdmin) redirect("/documents");
  const members = await getAllMembers();

  return (
    <div>
      <h1 className="font-display text-2xl font-bold text-navy mb-1">Manage members</h1>
      <p className="text-sm text-black/50 mb-6">Add or remove members, set roles, and grant portal-admin access.</p>

      <div className="bg-white rounded-xl border border-black/10 overflow-hidden mb-6">
        {members.map(m => (
          <form
            key={m.id}
            action={updateMemberForm.bind(null, m.id)}
            className="flex items-center gap-3 px-4 py-3 border-b border-black/5 last:border-0"
          >
            <div className="flex-1 min-w-0">
              <div className="text-sm font-medium">{m.name}</div>
              {m.email ? (
                <div className="text-xs text-black/40">{m.email}</div>
              ) : (
                <div className="flex gap-1 mt-1">
                  <input name="email" type="email" placeholder="add email so they can sign in" className="border border-black/10 rounded px-2 py-1 text-xs w-56" />
                  <button formAction={setEmailForm.bind(null, m.id)} className="text-xs text-navy underline">Set email</button>
                </div>
              )}
            </div>
            <select name="role" defaultValue={m.role} className="border border-black/10 rounded px-2 py-1 text-xs">
              {ROLES.map(r => <option key={r} value={r}>{r}</option>)}
            </select>
            <label className="flex items-center gap-1 text-xs text-black/50">
              <input type="checkbox" name="isAdmin" defaultChecked={m.is_admin} />
              admin
            </label>
            <button className="text-xs text-navy underline">Save</button>
            <button formAction={removeMemberAction.bind(null, m.id)} className="text-xs text-red-500 hover:underline">Remove</button>
          </form>
        ))}
      </div>

      <h2 className="font-semibold text-sm text-black/60 mb-2">Add member</h2>
      <form action={addMemberForm} className="bg-white rounded-xl border border-black/10 p-4 flex flex-wrap gap-3 items-end">
        <input name="name" placeholder="Full name" required className="border border-black/10 rounded-lg px-3 py-2 text-sm" />
        <input name="email" type="email" placeholder="name@sophiaway.org" required className="border border-black/10 rounded-lg px-3 py-2 text-sm" />
        <select name="role" className="border border-black/10 rounded-lg px-3 py-2 text-sm">
          {ROLES.map(r => <option key={r} value={r}>{r}</option>)}
        </select>
        <button className="bg-navy text-white rounded-lg px-4 py-2 text-sm font-medium">Add member</button>
      </form>
    </div>
  );
}
