import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/session";
import { getPendingDocuments } from "@/lib/data";
import { reviewDocumentForm } from "./actions";

export default async function ApprovalsPage() {
  const user = await getCurrentUser();
  if (!user?.isAdmin) redirect("/documents");
  const pending = await getPendingDocuments();
  return (
    <div className="max-w-2xl">
      <h1 className="font-display text-2xl font-bold text-navy mb-1">Pending approvals</h1>
      <p className="text-sm text-black/50 mb-6">{pending.length} document{pending.length === 1 ? "" : "s"} waiting for review.</p>
      <div className="space-y-3">
        {pending.map((d: any) => (
          <form key={d.id} action={reviewDocumentForm.bind(null, d.id)} className="bg-white rounded-xl border border-black/10 p-4">
            <div className="text-sm font-medium">{d.title}</div>
            <div className="text-xs text-black/40 mb-2">
              {d.category_label} · submitted by {d.uploader_name ?? "unknown"} · {new Date(d.created_at).toLocaleDateString()}
              {d.drive_url && <> · <a href={d.drive_url} target="_blank" rel="noopener" className="underline text-navy">open file</a></>}
            </div>
            <input name="note" placeholder="Note to the submitter (optional)" className="w-full border border-black/10 rounded-lg px-3 py-2 text-sm mb-2" />
            <div className="flex gap-2">
              <button name="decision" value="approved" className="bg-navy text-white rounded-lg px-3 py-1.5 text-xs font-medium">Approve</button>
              <button name="decision" value="rejected" className="border border-red-300 text-red-600 rounded-lg px-3 py-1.5 text-xs font-medium">Reject</button>
            </div>
          </form>
        ))}
        {pending.length === 0 && <div className="bg-white rounded-xl border border-black/10 p-8 text-center text-sm text-black/40">Nothing waiting. 🎉</div>}
      </div>
    </div>
  );
}
