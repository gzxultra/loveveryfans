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
