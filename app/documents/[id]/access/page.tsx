import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/session";
import { getAllMembers } from "@/lib/data";
import { query, queryOne } from "@/lib/db";
import { updateAccessForm } from "./actions";

export default async function AccessPage({ params }: { params: { id: string } }) {
  const user = await getCurrentUser();
  if (!user?.isAdmin) redirect("/documents");

  const docId = Number(params.id);
  const doc = await queryOne<{ id: number; title: string }>("SELECT id, title FROM documents WHERE id = $1", [docId]);
  if (!doc) redirect("/documents");

  const visRow = await queryOne<{ visibility: string }>("SELECT visibility FROM document_visibility WHERE document_id = $1", [docId]);
  const members = await getAllMembers();
  const currentAccess = await query<{ member_id: string; permission: string }>(
    "SELECT member_id, permission FROM document_access WHERE document_id = $1", [docId]
  );
  const accessMap = Object.fromEntries(currentAccess.map(a => [a.member_id, a.permission]));

  return (
    <div className="max-w-xl">
      <h1 className="font-display text-2xl font-bold text-navy mb-1">Access — {doc.title}</h1>
      <p className="text-sm text-black/50 mb-6">Choose who can see this document, and whether they can edit it.</p>
      <form action={updateAccessForm.bind(null, docId, doc.title)} className="bg-white rounded-xl border border-black/10 p-5 space-y-4">
        <label className="flex items-center gap-2 text-sm">
          <input type="radio" name="visibility" value="all" defaultChecked={!visRow || visRow.visibility === "all"} />
          Everyone can view
        </label>
        <label className="flex items-center gap-2 text-sm">
          <input type="radio" name="visibility" value="custom" defaultChecked={visRow?.visibility === "custom"} />
          Only specific members
        </label>

        <div className="pt-2 border-t border-black/5 space-y-2">
          {members.map(m => (
            <div key={m.id} className="flex items-center justify-between text-sm">
              <span>{m.name}</span>
              <select name={`perm_${m.id}`} defaultValue={accessMap[m.id] ?? "none"} className="border border-black/10 rounded px-2 py-1 text-xs">
                <option value="none">No access</option>
                <option value="view">View</option>
                <option value="edit">Edit</option>
              </select>
            </div>
          ))}
        </div>

        <button className="bg-navy text-white rounded-lg px-4 py-2 text-sm font-medium">Save access</button>
      </form>
    </div>
  );
}
