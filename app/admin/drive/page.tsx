import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/session";
import { driveConfigured, serviceAccountEmail } from "@/lib/drive";
import { syncDriveAction } from "./actions";

export default async function DriveSyncPage({ searchParams }: { searchParams: { added?: string; updated?: string; folders?: string; error?: string } }) {
  const user = await getCurrentUser();
  if (!user?.isAdmin) redirect("/documents");
  const configured = driveConfigured();
  const email = serviceAccountEmail();
  return (
    <div className="max-w-xl">
      <h1 className="font-display text-2xl font-bold text-navy mb-1">Google Drive sync</h1>
      <p className="text-sm text-black/50 mb-6">Imports the files in each category's Drive folder as documents. Existing documents keep their access settings.</p>

      {searchParams.added !== undefined && (
        <div className="mb-4 rounded-lg bg-blue-bg text-blue-status text-sm px-4 py-2">
          Scanned {searchParams.folders} Drive folders: {searchParams.added} new documents, {searchParams.updated} updated.
        </div>
      )}
      {searchParams.error && <div className="mb-4 rounded-lg bg-amber-bg text-amber-status text-sm px-4 py-2">{searchParams.error}</div>}

      {configured ? (
        <form action={syncDriveAction} className="bg-white rounded-xl border border-black/10 p-5">
          <p className="text-sm mb-1">Connected as <span className="font-mono text-xs">{email ?? "service account"}</span></p>
          <p className="text-xs text-black/40 mb-4">Each category's Drive folder must be shared with that address (Viewer is enough).</p>
          <button className="bg-navy text-white rounded-lg px-4 py-2 text-sm font-medium">Sync now</button>
        </form>
      ) : (
        <div className="bg-white rounded-xl border border-black/10 p-5 text-sm space-y-2">
          <p className="font-medium">One-time setup</p>
          <ol className="list-decimal pl-5 space-y-1 text-black/70">
            <li>In Google Cloud Console, enable the <b>Google Drive API</b> for your project.</li>
            <li>Create a <b>Service Account</b> (IAM &amp; Admin → Service Accounts) and add a <b>JSON key</b>.</li>
            <li>Share each Drive folder (or the whole Shared Drive) with the service account's email as a Viewer.</li>
            <li>In Vercel, add an environment variable <span className="font-mono text-xs">GOOGLE_SERVICE_ACCOUNT_JSON</span> containing the full JSON key, then redeploy.</li>
          </ol>
        </div>
      )}
    </div>
  );
}
