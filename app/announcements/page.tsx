import { getCurrentUser } from "@/lib/session";
import { getMemberAnnouncements } from "@/lib/data";
import { markReadAction } from "./actions";

export default async function AnnouncementsPage() {
  const user = await getCurrentUser();
  if (!user) return null;
  const all = await getMemberAnnouncements(user.id) as any[];
  const inbox = all.filter(a => !a.read_at);
  const archive = all.filter(a => a.read_at);

  const Row = ({ a }: { a: any }) => (
    <div className="flex items-start gap-3 px-4 py-3 border-b border-black/5 last:border-0">
      <div className="flex-1">
        <div className="text-sm font-medium">{a.subject}</div>
        <div className="text-sm text-black/60 mt-0.5">{a.message}</div>
        {a.doc_title && <div className="text-xs text-black/40 mt-1">Re: {a.doc_title}</div>}
        <div className="text-xs text-black/40 mt-1">From {a.sender_name ?? "Admin"} · {new Date(a.created_at).toLocaleDateString()}</div>
      </div>
      {!a.read_at && (
        <form action={markReadAction.bind(null, a.id)}>
          <button className="text-xs text-navy underline whitespace-nowrap">Mark read</button>
        </form>
      )}
    </div>
  );

  return (
    <div>
      <h1 className="font-display text-2xl font-bold text-navy mb-1">Announcements</h1>
      <p className="text-sm text-black/50 mb-6">Updates admins have sent you.</p>

      <h2 className="text-sm font-semibold text-black/60 mb-2">Inbox ({inbox.length})</h2>
      <div className="bg-white rounded-xl border border-black/10 overflow-hidden mb-6">
        {inbox.map(a => <Row key={a.id} a={a} />)}
        {inbox.length === 0 && <div className="p-6 text-center text-sm text-black/40">Nothing unread — you're all caught up.</div>}
      </div>

      <h2 className="text-sm font-semibold text-black/60 mb-2">Archive ({archive.length})</h2>
      <div className="bg-white rounded-xl border border-black/10 overflow-hidden">
        {archive.map(a => <Row key={a.id} a={a} />)}
        {archive.length === 0 && <div className="p-6 text-center text-sm text-black/40">Nothing archived yet.</div>}
      </div>
    </div>
  );
}
