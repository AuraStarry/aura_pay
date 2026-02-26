# INTEGRATION_API.md — Aura Pay Integration Guide

> Integration Contract Version: v2026.02.26-2
> 給其他產品串接 Aura Pay 的單一入口文件。

## 1) Authentication

All protected routes require Bearer token:

- Read-only: `ADMIN_READ_TOKEN`
- Write: `ADMIN_WRITE_TOKEN`

Example header:

```http
Authorization: Bearer <ADMIN_READ_TOKEN or ADMIN_WRITE_TOKEN>
Content-Type: application/json
```

## 2) Response Contract (Unified)

Success:
```json
{ "ok": true, "data": { "...": "..." } }
```

Error:
```json
{ "ok": false, "error": { "code": "validation_error", "message": "...", "details": {} } }
```

Common error codes:
- `validation_error`
- `bad_request`
- `not_found`
- `internal_error`

## 3) Core API Endpoints

## 3.1 Products

### GET `/api/products?all=true|false`
- Role: viewer/admin
- Returns product catalog

### POST `/api/products`
- Role: admin
- Body:
```json
{
  "name": "Life Hiker",
  "slug": "life-hiker",
  "sku": "LH-001",
  "description": "...",
  "active": true,
  "metadata": {}
}
```

### PATCH `/api/products`
- Role: admin
- Body must include `id` plus fields to update.

### DELETE `/api/products`
- Role: admin
- Body:
```json
{ "id": "1" }
```

## 3.2 Product Prices

### GET `/api/product-prices?all=true|false&product_id=<id>`
- Role: viewer/admin
- Returns active/all prices

### POST `/api/product-prices`
- Role: admin
- One-time body example:
```json
{
  "product_id": 1,
  "name": "One-time License",
  "billing_type": "one_time",
  "unit_amount": 990,
  "currency": "TWD"
}
```
- Subscription body example:
```json
{
  "product_id": 1,
  "name": "Pro Monthly",
  "billing_type": "subscription",
  "unit_amount": 300,
  "currency": "TWD",
  "interval": "month",
  "interval_count": 1,
  "trial_days": 7
}
```

### PATCH `/api/product-prices`
- Role: admin
- Body requires `id`

### DELETE `/api/product-prices`
- Role: admin
- Body:
```json
{ "id": 1 }
```

## 3.3 Checkout

### POST `/api/checkout`
- Role: public (server route), token depends on your integration architecture
- Purpose: create pending order by `product_price_id`
- Body:
```json
{
  "product_price_id": 12,
  "customer_email": "user@example.com",
  "customer_name": "User",
  "quantity": 1,
  "metadata": {}
}
```
- Returns:
```json
{
  "ok": true,
  "data": {
    "order_id": "uuid",
    "amount": 300,
    "currency": "TWD",
    "status": "pending",
    "order_type": "subscription_initial"
  }
}
```

## 3.4 Webhook

### POST `/api/webhook`
- Used by Paddle event ingestion layer
- Signature required: `Paddle-Signature` header (validated with `PADDLE_WEBHOOK_SECRET`)
- Supports event idempotency via `event_id`
- Body (Paddle envelope expected):
```json
{
  "event_id": "evt_123",
  "event_type": "transaction.paid",
  "data": {
    "order_id": "uuid",
    "transaction_id": "txn_123",
    "payment_method": "card",
    "subscription_id": "sub_123",
    "current_period_start": "2026-02-01T00:00:00Z",
    "current_period_end": "2026-03-01T00:00:00Z",
    "cancel_at_period_end": false,
    "canceled_at": null
  }
}
```

## 4) Webhook Event Mapping (current)

Order status mapping:
- `transaction.paid` / `transaction.completed` → `orders.status = paid`
- `transaction.payment_failed` → `orders.status = failed`
- `transaction.refunded` → `orders.status = refunded`
- `transaction.canceled` → `orders.status = canceled`

Subscription status mapping:
- `subscription.created` / `subscription.trialing` → `subscriptions.status = trialing`
- `subscription.activated` / `subscription.resumed` → `subscriptions.status = active`
- `subscription.past_due` → `subscriptions.status = past_due`
- `subscription.paused` → `subscriptions.status = paused`
- `subscription.canceled` → `subscriptions.status = canceled`

## 5) Recommended Integration Flow

1. Fetch active products + prices (`/api/products`, `/api/product-prices`)
2. User selects a price plan
3. Call `/api/checkout` to create pending order
4. Payment provider callback -> `/api/webhook`
5. Your product checks order/subscription state before granting access

## 6) Data Model Entities (for integrators)

- `products`: catalog metadata
- `product_prices`: plan-level pricing (`one_time` or `subscription`)
- `customers`: deduplicated buyers
- `orders`: purchase records
- `subscriptions`: active subscription state
- `webhook_events`: idempotency and audit trail

## 7) Notes

- Do not rely on undocumented fields.
- Treat this document as canonical integration contract.
- For deployment gates: `docs/DEPLOY_CHECKLIST.md`
