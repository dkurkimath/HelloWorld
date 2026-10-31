import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/session";
import { getCategories } from "@/lib/data";
import { folderOptions } from "@/lib/folders";
import { submitDocumentForm } from "./actions";

export default async function NewDocumentPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  const categories = await getCategories();
  const input = "w-full border border-black/10 rounded-lg px-3 py-2 text-sm mt-1";
  return (
    <div className="max-w-xl">
      <h1 className="font-display text-2xl font-bold text-navy mb-1">Add a document</h1>
      <p className="text-sm text-black/50 mb-6">
        {user.isAdmin
          ? "Admin submissions are published immediately."
          : "Your document will be reviewed by an admin before other members can see it."}
      </p>
      <form action={submitDocumentForm} className="bg-white rounded-xl border border-black/10 p-5 space-y-4">
        <div>
          <label className="text-xs font-medium text-black/60">Title</label>
          <input name="title" required className={input} />
        </div>
        <div>
          <label className="text-xs font-medium text-black/60">Folder</label>
          <select name="categoryId" required className={input}>
            {folderOptions(categories).map(f => <option key={f.id} value={f.id}>{f.label}</option>)}
          </select>
        </div>
        <div>
          <label className="text-xs font-medium text-black/60">Type</label>
          <select name="docType" className={input}>
            <option value="doc">Doc</option>
            <option value="pdf">PDF</option>
            <option value="xls">Sheet</option>
            <option value="img">Image</option>
          </select>
        </div>
        <div>
          <label className="text-xs font-medium text-black/60">Link to the file (Google Drive, etc.)</label>
          <input name="driveUrl" type="url" placeholder="https://drive.google.com/..." className={input} />
        </div>
        <button className="bg-navy text-white rounded-lg px-4 py-2 text-sm font-medium">Submit</button>
      </form>
    </div>
  );
}
