import { getCurrentUser } from "@/lib/session";
import { getAllMembers } from "@/lib/data";

const ORDER: Record<string, number> = { Chair: 0, Treasurer: 1, Secretary: 2, "Board Liaison": 3, Member: 4, Staff: 5 };

export default async function MembersPage() {
  const user = await getCurrentUser();
  if (!user) return null;
  const members = await getAllMembers();
  const sorted = [...members].sort((a, b) => (ORDER[a.role] ?? 9) - (ORDER[b.role] ?? 9));

  return (
    <div>
      <h1 className="font-display text-2xl font-bold text-navy mb-1">Member directory</h1>
      <p className="text-sm text-black/50 mb-6">Board and staff contact info, committee seats, and terms.</p>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {sorted.map(m => {
          const initials = m.name.split(" ").map(w => w[0]).join("").slice(0, 2).toUpperCase();
          return (
            <div key={m.id} className="bg-white rounded-xl border border-black/10 p-4">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-full bg-gold-light text-[#8A4413] flex items-center justify-center text-sm font-semibold">{initials}</div>
                <div>
                  <div className="font-display font-semibold text-sm">{m.name}</div>
                  <div className="text-xs text-gold font-semibold">{m.role}{m.title && m.title !== m.role ? ` · ${m.title}` : ""}</div>
                </div>
              </div>
              {m.employer && <div className="text-xs text-black/50 mb-1">{m.employer}</div>}
              {m.city && <div className="text-xs text-black/50 mb-1">{m.city}</div>}
              {m.email
                ? <a href={`mailto:${m.email}`} className="text-xs text-black/60 underline block mb-1">{m.email}</a>
                : <div className="text-xs text-black/40 italic mb-1">Email not on file</div>}
              {m.phone && <div className="text-xs text-black/50 mb-1">{m.phone}</div>}
              {m.linkedin && <a href={m.linkedin} target="_blank" rel="noopener" className="text-xs text-black/60 underline block mb-1">LinkedIn profile</a>}
              <div className="flex flex-wrap gap-1 mt-2">
                {(m.committees ?? []).map(c => <span key={c} className="tag bg-blue-bg text-blue-status">{c}</span>)}
                {user.isAdmin && m.commitment_signed !== null && (
                  <span className={`tag ${m.commitment_signed ? "bg-green-bg text-green-status" : "bg-amber-bg text-amber-status"}`}>
                    {m.commitment_signed ? "2026 form signed" : "2026 form not signed"}
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
