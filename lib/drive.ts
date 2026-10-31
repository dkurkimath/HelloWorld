import { createSign } from "crypto";
import { query, queryOne } from "./db";

// Reads files from Google Drive folders using a service account — no member
// has to sign in with Drive access. The folder (or Shared Drive) must be shared
// with the service account's email address as a Viewer.

type DriveFile = { id: string; name: string; mimeType: string; webViewLink?: string };
type FetchFn = typeof fetch;

export function driveConfigured(): boolean {
  return !!process.env.GOOGLE_SERVICE_ACCOUNT_JSON;
}

export function serviceAccountEmail(): string | null {
  try {
    return JSON.parse(process.env.GOOGLE_SERVICE_ACCOUNT_JSON || "").client_email ?? null;
  } catch {
    return null;
  }
}

const b64url = (b: Buffer | string) => Buffer.from(b).toString("base64url");

export function signServiceAccountJwt(sa: { client_email: string; private_key: string }, nowSec = Math.floor(Date.now() / 1000)): string {
  const header = b64url(JSON.stringify({ alg: "RS256", typ: "JWT" }));
  const claims = b64url(JSON.stringify({
    iss: sa.client_email,
    scope: "https://www.googleapis.com/auth/drive.readonly",
    aud: "https://oauth2.googleapis.com/token",
    iat: nowSec,
    exp: nowSec + 3600,
  }));
  const signer = createSign("RSA-SHA256");
  signer.update(`${header}.${claims}`);
  return `${header}.${claims}.${b64url(signer.sign(sa.private_key))}`;
}

async function getAccessToken(f: FetchFn): Promise<string> {
  const sa = JSON.parse(process.env.GOOGLE_SERVICE_ACCOUNT_JSON!);
  const res = await f("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer",
      assertion: signServiceAccountJwt(sa),
    }),
  });
  if (!res.ok) throw new Error(`Google token request failed (${res.status})`);
  return (await res.json()).access_token;
}

async function listFolder(folderId: string, token: string, f: FetchFn): Promise<DriveFile[]> {
  const files: DriveFile[] = [];
  let pageToken: string | undefined;
  do {
    const params = new URLSearchParams({
      q: `'${folderId.replace(/'/g, "")}' in parents and trashed = false`,
      fields: "nextPageToken, files(id, name, mimeType, webViewLink)",
      pageSize: "100",
      supportsAllDrives: "true",
      includeItemsFromAllDrives: "true",
    });
    if (pageToken) params.set("pageToken", pageToken);
    const res = await f(`https://www.googleapis.com/drive/v3/files?${params}`, { headers: { Authorization: `Bearer ${token}` } });
    if (!res.ok) throw new Error(`Drive listing failed for folder ${folderId} (${res.status}) — is it shared with ${serviceAccountEmail() ?? "the service account"}?`);
    const body = await res.json();
    files.push(...(body.files ?? []));
    pageToken = body.nextPageToken;
  } while (pageToken);
  return files;
}

export function docTypeFor(mimeType: string): "pdf" | "xls" | "img" | "doc" {
  if (mimeType === "application/pdf") return "pdf";
  if (mimeType.includes("spreadsheet") || mimeType.includes("excel")) return "xls";
  if (mimeType.startsWith("image/")) return "img";
  return "doc";
}

export type SyncResult = { added: number; updated: number; folders: number; errors: string[] };

// Imports every file in each category's Drive folder. New files become documents
// (visible to all, category taken from the folder); files already imported keep
// their category, status and access settings and only get a fresh title/link.
export async function syncDriveFolders(importedBy: string, f: FetchFn = fetch): Promise<SyncResult> {
  const result: SyncResult = { added: 0, updated: 0, folders: 0, errors: [] };
  const token = await getAccessToken(f);
  const cats = await query<{ id: string; label: string; drive_folder_id: string }>(
    "SELECT id, label, drive_folder_id FROM categories WHERE drive_folder_id IS NOT NULL"
  );
  for (const cat of cats) {
    try {
      const files = (await listFolder(cat.drive_folder_id, token, f)).filter(x => x.mimeType !== "application/vnd.google-apps.folder");
      result.folders++;
      for (const file of files) {
        const row = await queryOne<{ inserted: boolean; id: number }>(
          `INSERT INTO documents (title, category_id, doc_type, drive_url, status, uploaded_by, drive_file_id)
           VALUES ($1, $2, $3, $4, 'current', $5, $6)
           ON CONFLICT (drive_file_id) WHERE drive_file_id IS NOT NULL
           DO UPDATE SET title = EXCLUDED.title, drive_url = EXCLUDED.drive_url, doc_type = EXCLUDED.doc_type, updated_at = now()
           RETURNING id, (xmax = 0) AS inserted`,
          [file.name, cat.id, docTypeFor(file.mimeType), file.webViewLink ?? `https://drive.google.com/file/d/${file.id}/view`, importedBy, file.id]
        );
        if (row!.inserted) {
          result.added++;
          await query("INSERT INTO document_visibility (document_id, visibility) VALUES ($1, 'all') ON CONFLICT DO NOTHING", [row!.id]);
        } else {
          result.updated++;
        }
      }
    } catch (e: any) {
      result.errors.push(`${cat.label}: ${e.message}`);
    }
  }
  return result;
}
