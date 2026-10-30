import { redirect } from "next/navigation";
import Link from "next/link";
import { getCurrentUser } from "@/lib/session";
import { getComments, canAccessDocument } from "@/lib/data";
import { queryOne } from "@/lib/db";
import { addCommentForm } from "./actions";

export default async function DocumentDetailPage({ params }: { params: { id: string } }) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const docId = Number(params.id);
  const doc = await queryOne<{ id: number; title: string; drive_url: string | null; status: string; category_id: string }>(
    "SELECT id, title, drive_url, status, category_id FROM documents WHERE id = $1",
    [docId]
  );
  if (!doc) redirect("/documents");

  const allowed = await canAccessDocument(docId, user.id, user.isAdmin);
  if (!allowed) {
    return (
      <div>
        <Link href="/documents" className="text-sm text-navy underline">&larr; Back to documents</Link>
        <p className="mt-4 text-sm text-black/50">You don't have access to this document.</p>
      </div>
    );
  }

  const comments = await getComments(docId);

  return (
    <div className="max-w-xl">
      <Link href="/documents" className="text-sm text-navy underline">&larr; Back to documents</Link>
      <h1 className="font-display text-2xl font-bold text-navy mt-3 mb-1">{doc.title}</h1>
      {doc.drive_url && (
        <a href={doc.drive_url} target="_blank" rel="noopener" className="text-sm text-navy underline">Open in Drive</a>
      )}

      <div className="mt-8">
        <h2 className="text-sm font-semibold text-black/60 mb-2">Comments ({comments.length})</h2>
        <div className="bg-white rounded-xl border border-black/10 overflow-hidden mb-4">
          {comments.map(c => (
            <div key={c.id} className="px-4 py-3 border-b border-black/5 last:border-0">
              <div className="text-sm">{c.body}</div>
              <div className="text-xs text-black/40 mt-1">{c.author_name ?? "Unknown"} · {new Date(c.created_at).toLocaleString()}</div>
            </div>
          ))}
          {comments.length === 0 && <div className="p-6 text-center text-sm text-black/40">No comments yet.</div>}
        </div>
        <form action={addCommentForm.bind(null, docId)} className="flex gap-2">
          <textarea name="body" required rows={2} placeholder="Add a comment…" className="flex-1 border border-black/10 rounded-lg px-3 py-2 text-sm" />
          <button className="bg-navy text-white rounded-lg px-4 py-2 text-sm font-medium self-start">Post</button>
        </form>
      </div>
    </div>
  );
}
