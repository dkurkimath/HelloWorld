import Link from "next/link";
import { getCurrentUser } from "@/lib/session";
import { getDocuments, getCategories, type DocRow, canAccessDocument, getRecentActions, searchDocumentIds } from "@/lib/data";
import { childrenOf, pathTo, subtreeIds } from "@/lib/folders";
import { starAction } from "./actions";
import OpenLink from "@/components/OpenLink";

const TYPE_LABEL: Record<string, string> = { pdf: "PDF", doc: "Doc", xls: "Sheet", img: "Image" };
const ACTION_LABEL: Record<string, string> = {
  downloaded: "Opened", access_updated: "Access updated", commented: "Commented", approved: "Approved", rejected: "Rejected", notified: "Notified",
};

export default async function DocumentsPage({ searchParams }: { searchParams: { cat?: string; q?: string; submitted?: string } }) {
  const user = await getCurrentUser();
  if (!user) return null;
  const [docs, categories, recent] = await Promise.all([
    getDocuments(user.id),
    getCategories(),
    getRecentActions(user.id, 6),
  ]);

  const visible: DocRow[] = [];
  for (const d of docs) {
    const allowed = await canAccessDocument(d.id, user.id, user.isAdmin);
    if (allowed) visible.push(d);
  }

  const q = searchParams.q?.trim() ?? "";
  const currentId = categories.some(c => c.id === searchParams.cat) ? searchParams.cat! : null;
  const trail = currentId ? pathTo(categories, currentId) : [];
  const current = trail[trail.length - 1] ?? null;
  const folderLabel = (id: string) => pathTo(categories, id).map(f => f.label).join(" / ") || id;

  // Folder cards: the subfolders of where we are (or the top-level folders at the root).
  // Counts only include documents this member can see, so nothing restricted leaks.
  const subfolders = childrenOf(categories, currentId).map(f => {
    const ids = subtreeIds(categories, f.id);
    return {
      ...f,
      docCount: visible.filter(d => ids.has(d.category_id)).length,
      childCount: childrenOf(categories, f.id).length,
    };
  });

  // Documents shown below the folders: the ones directly in this folder, or
  // search matches (within this folder and everything under it, or everywhere at the root).
  let listed: typeof visible;
  if (q) {
    const matchIds = new Set(await searchDocumentIds(q));
    const scope = currentId ? subtreeIds(categories, currentId) : null;
    listed = visible.filter(d => matchIds.has(d.id) && (!scope || scope.has(d.category_id)));
  } else {
    listed = currentId ? visible.filter(d => d.category_id === currentId) : [];
  }

  const atRoot = !currentId && !q;
  const recentlyAdded = atRoot ? visible.filter(d => d.status === "current").slice(0, 6) : [];
  const here = currentId ? `/documents?cat=${currentId}` : "/documents";

  return (
    <div>
      <div className="flex items-baseline justify-between mb-4">
        <div>
          <h1 className="font-display text-2xl font-bold text-navy">Documents</h1>
          <p className="text-sm text-black/50">{visible.length} documents you have access to.</p>
        </div>
        <div className="flex gap-3 text-sm">
          {user.isAdmin && <Link href="/admin/folders" className="text-navy underline">Manage folders</Link>}
          {user.isAdmin && <Link href="/admin/approvals" className="text-navy underline">Approvals</Link>}
          <Link href="/documents/new" className="bg-navy text-white rounded-lg px-3 py-1.5 font-medium">Add document</Link>
        </div>
      </div>

      {searchParams.submitted && (
        <div className="mb-4 rounded-lg bg-blue-bg text-blue-status text-sm px-4 py-2">Submitted — an admin will review it before it's visible to other members.</div>
      )}

      <nav className="mb-4 text-sm flex flex-wrap items-center gap-1 text-black/50">
        <Link href="/documents" className={current ? "text-navy underline" : "font-medium text-black/70"}>All folders</Link>
        {trail.map((f, i) => (
          <span key={f.id} className="flex items-center gap-1">
            <span>/</span>
            {i === trail.length - 1
              ? <span className="font-medium text-black/70">{f.label}</span>
              : <Link href={`/documents?cat=${f.id}`} className="text-navy underline">{f.label}</Link>}
          </span>
        ))}
      </nav>

      <form action="/documents" className="mb-5 flex gap-2">
        {currentId && <input type="hidden" name="cat" value={currentId} />}
        <input name="q" defaultValue={q} placeholder={current ? `Search in ${current.label}…` : "Search titles, folders, and comments…"} className="flex-1 border border-black/10 rounded-lg px-3 py-2 text-sm bg-white" />
        <button className="bg-navy text-white rounded-lg px-4 py-2 text-sm font-medium">Search</button>
        {q && <Link href={here} className="self-center text-sm text-black/50 underline">Clear</Link>}
      </form>

      {atRoot && recent.length > 0 && (
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

      {atRoot && recentlyAdded.length > 0 && (
        <div className="mb-6">
          <h2 className="text-xs font-semibold uppercase text-black/40 mb-2">Recently added</h2>
          <div className="flex gap-3 overflow-x-auto pb-1">
            {recentlyAdded.map(d => (
              <Link key={d.id} href={`/documents/${d.id}`} className="shrink-0 w-44 bg-white rounded-xl border border-black/10 p-3 hover:border-navy/30">
                <div className="text-sm font-medium truncate">{d.title}</div>
                <div className="text-xs text-black/40 mt-1 truncate">{folderLabel(d.category_id)}</div>
              </Link>
            ))}
          </div>
        </div>
      )}

      {!q && subfolders.length > 0 && (
        <div className="mb-6">
          <h2 className="text-xs font-semibold uppercase text-black/40 mb-2">{current ? "Subfolders" : "Folders"}</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {subfolders.map(f => (
              <Link key={f.id} href={`/documents?cat=${f.id}`} className="bg-white rounded-xl border border-black/10 p-4 hover:border-navy/30">
                <div className="text-sm font-medium text-navy">📁 {f.label}</div>
                <div className="text-xs text-black/40 mt-1">
                  {f.docCount} document{f.docCount === 1 ? "" : "s"}
                  {f.childCount > 0 && <> · {f.childCount} subfolder{f.childCount === 1 ? "" : "s"}</>}
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}

      {(currentId || q) && (
        <div className="bg-white rounded-xl border border-black/10 overflow-hidden">
          {listed.map(d => (
            <div key={d.id} className="flex items-center gap-3 px-4 py-3 border-b border-black/5 last:border-0">
              <form action={starAction.bind(null, d.id)}>
                <button className={`text-lg ${d.starred ? "text-gold" : "text-black/20"}`} title="Star">★</button>
              </form>
              <Link href={`/documents/${d.id}`} className="flex-1 min-w-0">
                <div className="text-sm font-medium truncate">{d.title}</div>
                <div className="text-xs text-black/40">{folderLabel(d.category_id)} · {TYPE_LABEL[d.doc_type] ?? d.doc_type} · {d.uploader_name ?? "—"}</div>
              </Link>
              {d.status === "review" && <span className="tag bg-amber-bg text-amber-status">Pending review</span>}
              {d.status === "rejected" && <span className="tag bg-amber-bg text-amber-status">Rejected</span>}
              {d.visibility === "custom" && <span className="tag bg-blue-bg text-blue-status">Restricted</span>}
              {d.drive_url && <OpenLink documentId={d.id} driveUrl={d.drive_url} />}
              {user.isAdmin && (
                <Link href={`/documents/${d.id}/access`} className="text-sm text-black/40 hover:text-navy">Access</Link>
              )}
            </div>
          ))}
          {listed.length === 0 && (
            <div className="p-8 text-center text-sm text-black/40">
              {q ? `No documents match “${q}”.` : subfolders.length > 0 ? "No documents directly in this folder — open a subfolder above." : "No documents in this folder yet."}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
