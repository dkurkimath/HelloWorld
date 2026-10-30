import Link from "next/link";
import { getCurrentUser } from "@/lib/session";
import { getDocuments, getCategories, canAccessDocument, getRecentActions } from "@/lib/data";
import { starAction } from "./actions";
import OpenLink from "@/components/OpenLink";

const TYPE_LABEL: Record<string, string> = { pdf: "PDF", doc: "Doc", xls: "Sheet", img: "Image" };
const ACTION_LABEL: Record<string, string> = {
  downloaded: "Opened", access_updated: "Access updated", commented: "Commented", approved: "Approved", notified: "Notified",
};

export default async function DocumentsPage({ searchParams }: { searchParams: { cat?: string } }) {
  const user = await getCurrentUser();
  if (!user) return null;
  const [docs, categories, recent] = await Promise.all([
    getDocuments(user.id),
    getCategories(),
    getRecentActions(user.id, 6),
  ]);

  const visible = [];
  for (const d of docs) {
    const allowed = await canAccessDocument(d.id, user.id, user.isAdmin);
    if (allowed) visible.push(d);
  }
  const filtered = searchParams.cat ? visible.filter(d => d.category_id === searchParams.cat) : visible;
  const catLabel = (id: string) => categories.find(c => c.id === id)?.label ?? id;
  const recentlyAdded = searchParams.cat ? [] : visible.slice(0, 6);

  return (
    <div>
      <div className="flex items-baseline justify-between mb-6">
        <div>
          <h1 className="font-display text-2xl font-bold text-navy">Documents</h1>
          <p className="text-sm text-black/50">{visible.length} documents you have access to.</p>
        </div>
      </div>

      {!searchParams.cat && recent.length > 0 && (
        <div className="mb-6">
          <h2 className="text-xs font-semibold uppercase text-black/40 mb-2">Recently worked on</h2>
          <div className="flex gap-3 overflow-x-auto pb-1">
            {recent.map((r: any) => (
              <Link key={r.id} href={`/documents/${r.id}`} className="shrink-0 w-44 bg-white rounded-xl border border-black/10 p-3 hover:border-navy/30">
                <div className="text-sm font-medium truncate">{r.title}</div>
                <div className="text-xs text-black/40 mt-1">{ACTION_LABEL[r.action] ?? r.action} · {new Date(r.occurred_at).toLocaleDateString()}</div>
              </Link>
            ))}
          </div>
        </div>
      )}

      {!searchParams.cat && recentlyAdded.length > 0 && (
        <div className="mb-6">
          <h2 className="text-xs font-semibold uppercase text-black/40 mb-2">Recently added</h2>
          <div className="flex gap-3 overflow-x-auto pb-1">
            {recentlyAdded.map(d => (
              <Link key={d.id} href={`/documents/${d.id}`} className="shrink-0 w-44 bg-white rounded-xl border border-black/10 p-3 hover:border-navy/30">
                <div className="text-sm font-medium truncate">{d.title}</div>
                <div className="text-xs text-black/40 mt-1">{catLabel(d.category_id)}</div>
              </Link>
            ))}
          </div>
        </div>
      )}

      <div className="flex gap-2 mb-5 flex-wrap text-sm">
        <Link href="/documents" className={`px-3 py-1.5 rounded-full border ${!searchParams.cat ? "bg-navy text-white border-navy" : "border-black/10 bg-white"}`}>All</Link>
        {categories.map(c => (
          <Link key={c.id} href={`/documents?cat=${c.id}`} className={`px-3 py-1.5 rounded-full border ${searchParams.cat === c.id ? "bg-navy text-white border-navy" : "border-black/10 bg-white"}`}>
            {c.label}
          </Link>
        ))}
      </div>

      <div className="bg-white rounded-xl border border-black/10 overflow-hidden">
        {filtered.map(d => (
          <div key={d.id} className="flex items-center gap-3 px-4 py-3 border-b border-black/5 last:border-0">
            <form action={starAction.bind(null, d.id)}>
              <button className={`text-lg ${d.starred ? "text-gold" : "text-black/20"}`} title="Star">★</button>
            </form>
            <Link href={`/documents/${d.id}`} className="flex-1 min-w-0">
              <div className="text-sm font-medium truncate">{d.title}</div>
              <div className="text-xs text-black/40">{catLabel(d.category_id)} · {TYPE_LABEL[d.doc_type] ?? d.doc_type} · {d.uploader_name ?? "—"}</div>
            </Link>
            {d.status === "review" && <span className="tag bg-amber-bg text-amber-status">Pending review</span>}
            {d.visibility === "custom" && <span className="tag bg-blue-bg text-blue-status">Restricted</span>}
            {d.drive_url && <OpenLink documentId={d.id} driveUrl={d.drive_url} />}
            {user.isAdmin && (
              <Link href={`/documents/${d.id}/access`} className="text-sm text-black/40 hover:text-navy">Access</Link>
            )}
          </div>
        ))}
        {filtered.length === 0 && <div className="p-8 text-center text-sm text-black/40">No documents in this category yet.</div>}
      </div>
    </div>
  );
}
