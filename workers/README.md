# Loveveryfans Promotion Alert Worker

Cloudflare Worker that handles email subscriptions and automated Lovevery promotion detection.

## Features

- **Email Subscription API** — `POST /api/subscribe` and `POST /api/unsubscribe`
- **Cron-based Promotion Detection** — Checks lovevery.com every 6 hours for sales
- **Email Notifications via Resend** — Beautiful HTML emails matching the site's design
- **Email Whitelist** — Control who receives promo emails via `EMAIL_WHITELIST` env var

## Setup

### 1. Create D1 Database

```bash
wrangler d1 create loveveryfans-alerts-db
# Copy the database_id into wrangler.toml
```

### 2. Initialize Schema

```bash
wrangler d1 execute loveveryfans-alerts-db --file=./schema.sql
```

### 3. Set Secrets

```bash
wrangler secret put RESEND_API_KEY
```

### 4. Deploy

```bash
wrangler deploy
```

## Email Whitelist

The `EMAIL_WHITELIST` environment variable controls who receives promotion emails:

- **Specific emails**: `"mygladfinger@gmail.com"` (default)
- **Multiple emails**: `"a@example.com, b@example.com"`
- **All subscribers**: `"*"`

Update via `wrangler.toml` or the Cloudflare dashboard.

## Development

```bash
pnpm install
pnpm test    # Run tests
pnpm dev     # Local dev server
```

## API

### POST /api/subscribe

```json
{ "email": "user@example.com", "language": "en" }
```

### POST /api/unsubscribe

```json
{ "email": "user@example.com" }
```
