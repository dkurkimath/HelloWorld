import Link from "next/link";
import { getCurrentUser } from "@/lib/session";

export default async function Nav() {
  const user = await getCurrentUser();
  if (!user) return null;
  const linkCls = "block px-3 py-2 rounded-lg text-sm hover:bg-white/10";
  return (
    <aside className="w-60 shrink-0 bg-navy text-white min-h-screen p-4 flex flex-col gap-1">
      <div className="font-display text-lg font-bold mb-1">The Sophia Way</div>
      <div className="text-xs text-white/60 mb-4">Shelter. Safety. Stability.</div>
      <Link className={linkCls} href="/documents">Documents</Link>
      <Link className={linkCls} href="/announcements">Announcements</Link>
      <Link className={linkCls} href="/members">Member directory</Link>
      <Link className={linkCls} href="/activity">Activity log</Link>
      <Link className={linkCls} href="/profile">My profile</Link>
      {user.isAdmin && (
        <>
          <div className="text-xs uppercase text-white/40 mt-4 mb-1 px-3">Admin</div>
          <Link className={linkCls} href="/admin/members">Manage members</Link>
          <Link className={linkCls} href="/admin/approvals">Pending approvals</Link>
          <Link className={linkCls} href="/admin/drive">Google Drive sync</Link>
          <Link className={linkCls} href="/announcements/new">New announcement</Link>
        </>
      )}
      <div className="mt-auto pt-4 border-t border-white/10 text-xs">
        <div className="font-medium">{user.name}</div>
        <div className="text-white/60">{user.email}</div>
        <a href="/api/auth/signout" className="inline-block mt-2 text-gold hover:underline">Sign out</a>
      </div>
    </aside>
  );
}
