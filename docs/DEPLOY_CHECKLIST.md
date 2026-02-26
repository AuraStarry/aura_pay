# DEPLOY_CHECKLIST.md — Aura Pay (Staging → Production)

## 0) Pre-flight
- [ ] `git status` clean, branch synced with remote
- [ ] `npm test` pass
- [ ] `npm run build` pass
- [ ] DB migration applied on target environment

## 1) Environment Variables

### Required
- [ ] `SUPABASE_URL`
- [ ] `SUPABASE_KEY`
- [ ] `NEXT_PUBLIC_SUPABASE_URL`
- [ ] `NEXT_PUBLIC_SUPABASE_KEY`
- [ ] `ADMIN_READ_TOKEN`
- [ ] `ADMIN_WRITE_TOKEN`

### Paddle phase
- [ ] `PADDLE_API_KEY`
- [ ] `PADDLE_WEBHOOK_SECRET`
- [ ] `PADDLE_ENV` (`sandbox` on staging / `production` on prod)
- [ ] `PADDLE_DEFAULT_CURRENCY`
- [ ] `NEXT_PUBLIC_APP_URL`

## 2) Database Gates
- [ ] Core tables exist: `products`, `product_prices`, `customers`, `orders`, `subscriptions`, `webhook_events`
- [ ] RLS enabled on sensitive tables
- [ ] Policies applied (public read only for active catalog; service-key only for internal tables)
- [ ] At least one product + active price for smoke test

## 3) API Gates (Staging)
- [ ] `/api/products?all=true` works with admin/viewer token
- [ ] `/api/product-prices?all=true` works with admin/viewer token
- [ ] `/api/checkout` creates pending order with `product_price_id`
- [ ] `/api/webhook` idempotency works (`event_id` duplicate returns duplicate path)

## 4) Admin UI Gates
- [ ] Admin token login works
- [ ] Can create product + default price in one flow
- [ ] Product list renders associated prices
- [ ] Edit/toggle/delete product works as expected

## 5) Observability & Safety
- [ ] Structured logs visible (`event`, `requestId`, `route`, `durationMs`)
- [ ] No secrets printed in logs
- [ ] Error paths produce unified API error shape

## 6) Production Promotion Gate
- [ ] Staging smoke tests all green
- [ ] Production env vars rechecked (no sandbox leakage)
- [ ] Production DB migration status confirmed
- [ ] Rollback plan prepared (previous deployment + DB-safe fallback)

## 7) Post-Deploy Verification
- [ ] Health check endpoints respond
- [ ] Checkout flow successful with real product_price
- [ ] Webhook event persisted and marked processed
- [ ] No error spike in first 30 minutes

---

## Quick Smoke Commands (optional)

```bash
npm test
npm run build
```

For API smoke tests, use bearer tokens (`ADMIN_READ_TOKEN` / `ADMIN_WRITE_TOKEN`) in headers.
