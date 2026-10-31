import { redirect } from "next/navigation";
import Link from "next/link";
import { getCurrentUser } from "@/lib/session";
import { getCategories, getDocuments } from "@/lib/data";
import { folderOptions } from "@/lib/folders";
import { createFolderForm, renameFolderForm, deleteFolderForm } from "./actions";

export default async function FoldersPage({ searchParams }: { searchParams: { error?: string } }) {
  const user = await getCurrentUser();
  if (!user?.isAdmin) redirect("/documents");
  const [categories, docs] = await Promise.all([getCategories(), getDocuments(user.id)]);
  const options = folderOptions(categories);
  const docCount = (id: string) => docs.filter(d => d.category_id === id).length;
  const input = "border border-black/10 rounded-lg px-3 py-2 text-sm";
  return (
    <div className="max-w-2xl">
      <h1 className="font-display text-2xl font-bold text-navy mb-1">Manage folders</h1>
      <p className="text-sm text-black/50 mb-6">Organize documents into big folders and subfolders. Move a document from its own page. Only empty folders can be deleted.</p>
      {searchParams.error && <div className="mb-4 rounded-lg bg-amber-bg text-amber-status text-sm px-4 py-2">{searchParams.error}</div>}

      <div className="bg-white rounded-xl border border-black/10 overflow-hidden mb-6">
        {options.map(f => (
          <form key={f.id} action={renameFolderForm.bind(null, f.id)} className="flex items-center gap-2 px-4 py-2 border-b border-black/5 last:border-0" style={{ paddingLeft: 16 + f.depth * 24 }}>
            <span className="text-sm">{f.depth === 0 ? "📁" : "└"}</span>
            <input name="label" defaultValue={f.label.split(" / ").pop()} className="flex-1 border border-transparent hover:border-black/10 rounded px-2 py-1 text-sm" />
            <Link href={`/documents?cat=${f.id}`} className="text-xs text-black/40 hover:text-navy">{docCount(f.id)} docs</Link>
            <button className="text-xs text-navy underline">Rename</button>
            <button formAction={deleteFolderForm.bind(null, f.id)} className="text-xs text-red-500 hover:underline">Delete</button>
          </form>
        ))}
        {options.length === 0 && <div className="p-6 text-center text-sm text-black/40">No folders yet.</div>}
      </div>

      <h2 className="font-semibold text-sm text-black/60 mb-2">Add a folder</h2>
      <form action={createFolderForm} className="bg-white rounded-xl border border-black/10 p-4 flex flex-wrap gap-3 items-end">
        <input name="label" placeholder="Folder name" required className={input} />
        <select name="parentId" className={input}>
          <option value="">Top level (big folder)</option>
          {options.map(f => <option key={f.id} value={f.id}>Inside: {f.label}</option>)}
        </select>
        <button className="bg-navy text-white rounded-lg px-4 py-2 text-sm font-medium">Add folder</button>
      </form>
    </div>
  );
}
