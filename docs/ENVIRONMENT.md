# ENVIRONMENT.md — Aura Pay Variable Mapping

This file is the single reference for environment variables across local development and deployment.

## 1) Required now (current MVP)

| Variable | Scope | Required | Description |
|---|---|---:|---|
| `SUPABASE_URL` | Server | Yes | Supabase project URL for API route access |
| `SUPABASE_KEY` | Server | Yes | Supabase service-role key used by server-side routes |
| `NEXT_PUBLIC_SUPABASE_URL` | Client+Server | Yes | Public Supabase URL used by frontend |
| `NEXT_PUBLIC_SUPABASE_KEY` | Client+Server | Yes | Supabase anon/public key used by frontend |
| `ADMIN_READ_TOKEN` | Server | Yes | Bearer token for read-only admin product access |
| `ADMIN_WRITE_TOKEN` | Server | Yes | Bearer token for product mutations (admin role) |
| `ACCESS_API_TOKEN` | Server | Yes (if `/api/access` exposed) | Dedicated service token for downstream access-check API |
| `ACCESS_API_RATE_LIMIT_PER_MIN` | Server | Optional | Rate limit for `/api/access` per token+ip (default 120) |

## 2) Paddle phase (partially wired: webhook signature + event mapping live)

| Variable | Scope | Required | Description |
|---|---|---:|---|
| `PADDLE_API_KEY` | Server | Soon | Paddle API authentication key |
| `PADDLE_WEBHOOK_SECRET` | Server | Yes (for webhook endpoint) | Signature verification secret for Paddle webhooks |
| `PADDLE_ENV` | Server | Soon | `sandbox` or `production` |
| `PADDLE_DEFAULT_CURRENCY` | Server | Soon | Fallback currency for prices/checkouts |
| `NEXT_PUBLIC_APP_URL` | Client+Server | Soon | Public app URL for redirects/callback composition |

## 3) Local development

1. Copy template:
   ```bash
   cp .env.example .env.local
   ```
2. Fill required MVP vars first.
3. Keep Paddle vars as placeholders until Paddle adapter tasks begin.
4. For `/admin`, paste `ADMIN_READ_TOKEN` or `ADMIN_WRITE_TOKEN` in the token box (stored in browser localStorage only on that device).

## 4) Vercel mapping

Set the same variable names in Vercel Project Settings → Environment Variables:

- Development: for preview/local-like behavior
- Preview: for PR validation
- Production: for live environment

Recommended baseline:
- `PADDLE_ENV=sandbox` in Development/Preview
- `PADDLE_ENV=production` only in Production

## 5) Security notes

- Never expose server-only keys (`SUPABASE_KEY`, `PADDLE_API_KEY`, `PADDLE_WEBHOOK_SECRET`) in client code.
- Rotate keys immediately if accidentally committed.
- Keep `.env.local` gitignored.
