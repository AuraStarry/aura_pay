# Aura Pay

Multi-product payment API powered by Supabase + Vercel Serverless.

## 功能

- ✅ 產品管理
- ✅ 訂單建立
- ✅ Webhook 回調處理
- 🔄 支援多種支付方式（擴充中）

## API Endpoints

### `GET /api`
健康檢查

### `GET /api/products`
取得所有啟用的產品

### `POST /api/checkout`
建立支付訂單
```json
{
  "product_id": 1,
  "quantity": 1,
  "customer_email": "user@example.com",
  "metadata": {}
}
```

### `POST /api/webhook`
接收支付回調
```json
{
  "order_id": "uuid",
  "status": "completed",
  "transaction_id": "txn_123",
  "payment_method": "credit_card"
}
```

## 環境變數

```env
SUPABASE_URL=your_supabase_url
SUPABASE_KEY=your_supabase_key
```

## 部署

```bash
npm install
vercel --prod
```

## Supabase Schema

見 `schema.sql` 建立所需資料表。

---

Built by Aura ✨
