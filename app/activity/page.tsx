import Link from "next/link";
import { getActivity } from "@/lib/data";

const TABS = [
  { id: "all", label: "All activity" },
  { id: "document", label: "Documents" },
  { id: "member", label: "Members" },
  { id: "announcement", label: "Announcements" },
];

export default async function ActivityPage({ searchParams }: { searchParams: { type?: string } }) {
  const type = searchParams.type ?? "all";
  const entries = await getActivity(type) as any[];

  return (
    <div>
      <h1 className="font-display text-2xl font-bold text-navy mb-1">Activity log</h1>
      <p className="text-sm text-black/50 mb-6">A record of uploads, access changes, approvals, and notifications.</p>

      <div className="flex gap-2 mb-5 text-sm">
        {TABS.map(t => (
          <Link key={t.id} href={`/activity?type=${t.id}`} className={`px-3 py-1.5 rounded-full border ${type === t.id ? "bg-navy text-white border-navy" : "border-black/10 bg-white"}`}>
            {t.label}
          </Link>
        ))}
      </div>

      <div className="bg-white rounded-xl border border-black/10 overflow-hidden">
        {entries.map(e => (
          <div key={e.id} className="px-4 py-3 border-b border-black/5 last:border-0 text-sm">
            <span dangerouslySetInnerHTML={{ __html: e.text }} />
            <div className="text-xs text-black/40 mt-0.5">{new Date(e.created_at).toLocaleString()}</div>
          </div>
        ))}
        {entries.length === 0 && <div className="p-6 text-center text-sm text-black/40">No activity yet.</div>}
      </div>
    </div>
  );
}
