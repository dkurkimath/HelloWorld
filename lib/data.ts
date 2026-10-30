import { query, queryOne, pool } from "./db";

export type Member = {
  id: string; name: string; email: string | null; role: string; title: string | null;
  employer: string | null; city: string | null; phone: string | null; linkedin: string | null;
  committees: string[]; commitment_signed: boolean | null; is_admin: boolean;
};

export type Category = { id: string; label: string; icon: string; drive_folder_id: string | null; sort_order: number };

export type DocRow = {
  id: number; title: string; category_id: string; doc_type: string; drive_url: string | null;
  status: string; uploaded_by: string | null; updated_at: string; created_at: string;
  visibility: string; uploader_name: string | null; starred: boolean;
};

export async function getMemberByEmail(email: string): Promise<Member | null> {
  return queryOne<Member>("SELECT * FROM members WHERE email = $1", [email]);
}

export async function getAllMembers(): Promise<Member[]> {
  return query<Member>("SELECT * FROM members ORDER BY name");
}

export async function getCategories(): Promise<Category[]> {
  return query<Category>("SELECT * FROM categories ORDER BY sort_order");
}

export async function getDocuments(forMemberId: string): Promise<DocRow[]> {
  return query<DocRow>(
    `SELECT d.*, v.visibility,
            u.name AS uploader_name,
            (s.member_id IS NOT NULL) AS starred
       FROM documents d
       LEFT JOIN document_visibility v ON v.document_id = d.id
       LEFT JOIN members u ON u.id = d.uploaded_by
       LEFT JOIN stars s ON s.document_id = d.id AND s.member_id = $1
      ORDER BY d.created_at DESC`,
    [forMemberId]
  );
}

// Returns true if this member can view the given document, given the
// visibility ('all' | 'custom') and any per-member access override.
export async function canAccessDocument(documentId: number, memberId: string, isAdmin: boolean): Promise<boolean> {
  if (isAdmin) return true;
  const vis = await queryOne<{ visibility: string }>(
    "SELECT visibility FROM document_visibility WHERE document_id = $1",
    [documentId]
  );
  if (!vis || vis.visibility === "all") return true;
  const access = await queryOne(
    "SELECT 1 FROM document_access WHERE document_id = $1 AND member_id = $2",
    [documentId, memberId]
  );
  return !!access;
}

export async function setDocumentAccess(documentId: number, visibility: "all" | "custom", permissions: Record<string, "view" | "edit">) {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    await client.query(
      `INSERT INTO document_visibility (document_id, visibility) VALUES ($1, $2)
       ON CONFLICT (document_id) DO UPDATE SET visibility = $2`,
      [documentId, visibility]
    );
    await client.query("DELETE FROM document_access WHERE document_id = $1", [documentId]);
    for (const [memberId, perm] of Object.entries(permissions)) {
      await client.query(
        "INSERT INTO document_access (document_id, member_id, permission) VALUES ($1, $2, $3)",
        [documentId, memberId, perm]
      );
    }
    await client.query("COMMIT");
  } catch (e) {
    await client.query("ROLLBACK");
    throw e;
  } finally {
    client.release();
  }
}

export async function toggleStar(memberId: string, documentId: number): Promise<boolean> {
  const existing = await queryOne("SELECT 1 FROM stars WHERE member_id = $1 AND document_id = $2", [memberId, documentId]);
  if (existing) {
    await query("DELETE FROM stars WHERE member_id = $1 AND document_id = $2", [memberId, documentId]);
    return false;
  }
  await query("INSERT INTO stars (member_id, document_id) VALUES ($1, $2)", [memberId, documentId]);
  return true;
}

export async function recordRecentAction(memberId: string, documentId: number, action: string) {
  await query(
    `INSERT INTO recent_views (member_id, document_id, action, occurred_at) VALUES ($1, $2, $3, now())
     ON CONFLICT (member_id, document_id) DO UPDATE SET action = $3, occurred_at = now()`,
    [memberId, documentId, action]
  );
}

export async function getRecentActions(memberId: string, limit = 8) {
  return query(
    `SELECT rv.action, rv.occurred_at, d.id, d.title, d.doc_type
       FROM recent_views rv JOIN documents d ON d.id = rv.document_id
      WHERE rv.member_id = $1
      ORDER BY rv.occurred_at DESC LIMIT $2`,
    [memberId, limit]
  );
}

export async function logActivity(actorId: string | null, icon: string, text: string, logType: string) {
  await query(
    "INSERT INTO activity_log (actor_id, icon, text, log_type) VALUES ($1, $2, $3, $4)",
    [actorId, icon, text, logType]
  );
}

export async function getActivity(logType?: string, limit = 100) {
  if (logType && logType !== "all") {
    return query(
      `SELECT a.*, m.name AS actor_name FROM activity_log a LEFT JOIN members m ON m.id = a.actor_id
       WHERE a.log_type = $1 ORDER BY a.created_at DESC LIMIT $2`,
      [logType, limit]
    );
  }
  return query(
    `SELECT a.*, m.name AS actor_name FROM activity_log a LEFT JOIN members m ON m.id = a.actor_id
     ORDER BY a.created_at DESC LIMIT $1`,
    [limit]
  );
}

export async function createAnnouncement(subject: string, message: string, documentId: number | null, sentBy: string, recipientIds: string[]) {
  const ann = await queryOne<{ id: number }>(
    "INSERT INTO announcements (subject, message, document_id, sent_by) VALUES ($1, $2, $3, $4) RETURNING id",
    [subject, message, documentId, sentBy]
  );
  const annId = ann!.id;
  for (const memberId of recipientIds) {
    await query(
      "INSERT INTO announcement_recipients (announcement_id, member_id) VALUES ($1, $2)",
      [annId, memberId]
    );
  }
  return annId;
}

export async function markAnnouncementEmailed(announcementId: number, memberId: string) {
  await query(
    "UPDATE announcement_recipients SET emailed_at = now() WHERE announcement_id = $1 AND member_id = $2",
    [announcementId, memberId]
  );
}

export async function getMemberAnnouncements(memberId: string) {
  return query(
    `SELECT an.*, ar.read_at, d.title AS doc_title, sender.name AS sender_name
       FROM announcement_recipients ar
       JOIN announcements an ON an.id = ar.announcement_id
       LEFT JOIN documents d ON d.id = an.document_id
       LEFT JOIN members sender ON sender.id = an.sent_by
      WHERE ar.member_id = $1
      ORDER BY an.created_at DESC`,
    [memberId]
  );
}

export async function markAnnouncementRead(announcementId: number, memberId: string) {
  await query(
    "UPDATE announcement_recipients SET read_at = now() WHERE announcement_id = $1 AND member_id = $2 AND read_at IS NULL",
    [announcementId, memberId]
  );
}

export async function getAllAnnouncementsForAdmin() {
  return query(
    `SELECT an.*, sender.name AS sender_name, d.title AS doc_title,
            COUNT(ar.member_id) AS recipient_count,
            COUNT(ar.read_at) AS read_count
       FROM announcements an
       LEFT JOIN members sender ON sender.id = an.sent_by
       LEFT JOIN documents d ON d.id = an.document_id
       LEFT JOIN announcement_recipients ar ON ar.announcement_id = an.id
      GROUP BY an.id, sender.name, d.title
      ORDER BY an.created_at DESC`
  );
}
