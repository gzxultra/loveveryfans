-- Loveveryfans Promotion Alerts — D1 Schema
-- ============================================
-- Run with: wrangler d1 execute loveveryfans-alerts-db --file=./schema.sql

-- Subscribers table
CREATE TABLE IF NOT EXISTS subscribers (
  id            INTEGER PRIMARY KEY AUTOINCREMENT,
  email         TEXT    NOT NULL UNIQUE,
  language      TEXT    NOT NULL DEFAULT 'en' CHECK (language IN ('en', 'zh')),
  subscribed_at TEXT    NOT NULL DEFAULT (datetime('now')),
  unsubscribed_at TEXT  DEFAULT NULL
);

CREATE INDEX IF NOT EXISTS idx_subscribers_email ON subscribers(email);
CREATE INDEX IF NOT EXISTS idx_subscribers_active ON subscribers(unsubscribed_at);

-- Promotions table
CREATE TABLE IF NOT EXISTS promotions (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  title       TEXT    NOT NULL,
  description TEXT    NOT NULL DEFAULT '',
  url         TEXT    NOT NULL DEFAULT '',
  detected_at TEXT    NOT NULL DEFAULT (datetime('now')),
  notified_at TEXT    DEFAULT NULL
);

CREATE INDEX IF NOT EXISTS idx_promotions_detected ON promotions(detected_at);

-- Page snapshots table (for diff-based promotion detection)
CREATE TABLE IF NOT EXISTS page_snapshots (
  url          TEXT NOT NULL UNIQUE,
  content_hash TEXT NOT NULL,
  checked_at   TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_page_snapshots_url ON page_snapshots(url);

-- Submissions table (user article submissions)
CREATE TABLE IF NOT EXISTS submissions (
  id            INTEGER PRIMARY KEY AUTOINCREMENT,
  kit_id        TEXT    NOT NULL,
  url           TEXT    NOT NULL,
  title         TEXT    DEFAULT NULL,
  description   TEXT    DEFAULT NULL,
  author_name   TEXT    DEFAULT NULL,
  status        TEXT    NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  submitted_at  TEXT    NOT NULL DEFAULT (datetime('now')),
  reviewed_at   TEXT    DEFAULT NULL
);
CREATE INDEX IF NOT EXISTS idx_submissions_kit_id ON submissions(kit_id);
CREATE INDEX IF NOT EXISTS idx_submissions_status ON submissions(status);
CREATE INDEX IF NOT EXISTS idx_submissions_kit_status ON submissions(kit_id, status);
