-- Sophia Way Member Portal — database schema (PostgreSQL)

CREATE TABLE IF NOT EXISTS members (
  id            TEXT PRIMARY KEY,
  name          TEXT NOT NULL,
  email         TEXT NOT NULL UNIQUE,
  role          TEXT NOT NULL,          -- Chair | Treasurer | Secretary | Board Liaison | Member | Staff
  title         TEXT,
  employer      TEXT,
  city          TEXT,
  phone         TEXT,
  linkedin      TEXT,
  committees    TEXT[] DEFAULT '{}',
  commitment_signed BOOLEAN,            -- NULL = not applicable (staff)
  is_admin      BOOLEAN NOT NULL DEFAULT FALSE,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS categories (
  id              TEXT PRIMARY KEY,
  label           TEXT NOT NULL,
  icon            TEXT NOT NULL,
  drive_folder_id TEXT,
  sort_order      INT NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS documents (
  id            SERIAL PRIMARY KEY,
  title         TEXT NOT NULL,
  category_id   TEXT REFERENCES categories(id),
  doc_type      TEXT NOT NULL DEFAULT 'doc',  -- pdf | doc | xls | img
  drive_url     TEXT,
  status        TEXT NOT NULL DEFAULT 'current', -- current | review
  uploaded_by   TEXT REFERENCES members(id),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- per-document, per-member access overrides. visibility='all' on the document
-- means everyone can view; a row here grants/narrows access for one member.
CREATE TABLE IF NOT EXISTS document_access (
  document_id   INT REFERENCES documents(id) ON DELETE CASCADE,
  member_id     TEXT REFERENCES members(id) ON DELETE CASCADE,
  permission    TEXT NOT NULL,  -- view | edit
  PRIMARY KEY (document_id, member_id)
);

CREATE TABLE IF NOT EXISTS document_visibility (
  document_id   INT PRIMARY KEY REFERENCES documents(id) ON DELETE CASCADE,
  visibility    TEXT NOT NULL DEFAULT 'all'  -- all | custom
);

CREATE TABLE IF NOT EXISTS stars (
  member_id     TEXT REFERENCES members(id) ON DELETE CASCADE,
  document_id   INT REFERENCES documents(id) ON DELETE CASCADE,
  PRIMARY KEY (member_id, document_id)
);

CREATE TABLE IF NOT EXISTS comments (
  id            SERIAL PRIMARY KEY,
  document_id   INT REFERENCES documents(id) ON DELETE CASCADE,
  author_id     TEXT REFERENCES members(id),
  body          TEXT NOT NULL,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS announcements (
  id            SERIAL PRIMARY KEY,
  subject       TEXT NOT NULL,
  message       TEXT NOT NULL,
  document_id   INT REFERENCES documents(id),
  sent_by       TEXT REFERENCES members(id),
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS announcement_recipients (
  announcement_id INT REFERENCES announcements(id) ON DELETE CASCADE,
  member_id       TEXT REFERENCES members(id) ON DELETE CASCADE,
  read_at         TIMESTAMPTZ,  -- NULL = unread/active; set = archived for that member
  emailed_at      TIMESTAMPTZ,  -- when the real email alert was sent
  PRIMARY KEY (announcement_id, member_id)
);

CREATE TABLE IF NOT EXISTS activity_log (
  id            SERIAL PRIMARY KEY,
  actor_id      TEXT REFERENCES members(id),
  icon          TEXT NOT NULL,
  text          TEXT NOT NULL,       -- pre-rendered HTML snippet, e.g. "<b>Jola</b> uploaded ..."
  log_type      TEXT NOT NULL,       -- document | member | announcement
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- recently-worked-on tracking (per member, per role context)
CREATE TABLE IF NOT EXISTS recent_views (
  member_id     TEXT REFERENCES members(id) ON DELETE CASCADE,
  document_id   INT REFERENCES documents(id) ON DELETE CASCADE,
  action        TEXT NOT NULL,   -- viewed | downloaded | approved | access_updated | notified | commented
  occurred_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (member_id, document_id)
);

CREATE INDEX IF NOT EXISTS idx_documents_category ON documents(category_id);
CREATE INDEX IF NOT EXISTS idx_activity_created ON activity_log(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_recent_views_member ON recent_views(member_id, occurred_at DESC);
