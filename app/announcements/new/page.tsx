import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/session";
import { getAllMembers } from "@/lib/data";
import { query } from "@/lib/db";
import { sendAnnouncementForm } from "../actions";

export default async function NewAnnouncementPage() {
  const user = await getCurrentUser();
  if (!user?.isAdmin) redirect("/announcements");

  const members = await getAllMembers();
  const docs = await query<{ id: number; title: string }>("SELECT id, title FROM documents ORDER BY title");

  return (
    <div className="max-w-xl">
      <h1 className="font-display text-2xl font-bold text-navy mb-1">New announcement</h1>
      <p className="text-sm text-black/50 mb-6">Sends a real email to each recipient's sophiaway.org inbox, and keeps it unread in the portal until they open it.</p>

      <form action={sendAnnouncementForm} className="bg-white rounded-xl border border-black/10 p-5 space-y-4">
        <div>
          <label className="text-xs font-medium text-black/60">Subject</label>
          <input name="subject" required className="w-full border border-black/10 rounded-lg px-3 py-2 text-sm mt-1" />
        </div>
        <div>
          <label className="text-xs font-medium text-black/60">Message</label>
          <textarea name="message" required rows={4} className="w-full border border-black/10 rounded-lg px-3 py-2 text-sm mt-1" />
        </div>
        <div>
          <label className="text-xs font-medium text-black/60">Related document (optional)</label>
          <select name="documentId" className="w-full border border-black/10 rounded-lg px-3 py-2 text-sm mt-1">
            <option value="">None</option>
            {docs.map(d => <option key={d.id} value={d.id}>{d.title}</option>)}
          </select>
        </div>
        <div>
          <label className="text-xs font-medium text-black/60 block mb-2">Recipients</label>
          <div className="space-y-1 max-h-56 overflow-y-auto border border-black/5 rounded-lg p-3">
            {members.map(m => (
              <label key={m.id} className="flex items-center gap-2 text-sm">
                <input type="checkbox" name="recipients" value={m.id} />
                {m.name} <span className="text-black/40">({m.email})</span>
              </label>
            ))}
          </div>
        </div>
        <button className="bg-navy text-white rounded-lg px-4 py-2 text-sm font-medium">Send announcement</button>
      </form>
    </div>
  );
}
