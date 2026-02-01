# Aura Pay Dashboard

Multi-product payment dashboard powered by Next.js 15 + Supabase.

## Features

- 💰 Real-time payment dashboard
- 📊 Revenue analytics & stats
- 🔍 Filter orders by status & email
- 🛠️ Product management admin panel
- 📦 Create/edit/delete service products
- ⚡ Serverless API routes (Vercel-ready)
- 🎨 Modern UI with Tailwind CSS

## Tech Stack

- **Framework:** Next.js 15 (App Router)
- **Language:** TypeScript
- **Styling:** Tailwind CSS
- **Database:** Supabase
- **Deployment:** Vercel

## Project Structure

```
aura_pay/
├── app/
│   ├── api/              # Serverless API routes
│   │   ├── route.ts      # Health check
│   │   ├── products/     # CRUD products
│   │   ├── checkout/     # POST create order
│   │   └── webhook/      # POST payment callback
│   ├── admin/            # Admin panel
│   │   └── page.tsx      # Product management UI
│   ├── layout.tsx        # Root layout
│   ├── page.tsx          # Dashboard UI
│   └── globals.css       # Tailwind styles
├── public/
│   └── old-dashboard.html  # Legacy dashboard (archived)
├── schema.sql            # Database schema
├── .env.local            # Environment variables (gitignored)
└── .env.example          # Example env config

```

## Setup

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Configure environment:**
   ```bash
   cp .env.example .env.local
   # Edit .env.local with your Supabase credentials
   ```

3. **Run development server:**
   ```bash
   npm run dev
   ```
   Open http://localhost:3000

4. **Build for production:**
   ```bash
   npm run build
   npm start
   ```

## API Endpoints

### `GET /api`
Health check endpoint.

**Response:**
```json
{
  "status": "ok",
  "service": "Aura Pay API",
  "version": "2.0.0",
  "timestamp": "2026-02-01T19:00:00.000Z"
}
```

### `GET /api/products`
Get all active products.

**Query Parameters:**
- `all=true` - Include inactive products (for admin)

**Response:**
```json
{
  "products": [
    {
      "id": "uuid",
      "name": "Product Name",
      "sku": "PLAN-PREMIUM-001",
      "price": 99.99,
      "currency": "USD",
      "active": true,
      "description": "Premium plan features",
      "metadata": {}
    }
  ]
}
```

### `POST /api/products`
Create a new product.

**Request Body:**
```json
{
  "name": "Premium Plan",
  "sku": "PLAN-PREMIUM-001",
  "price": 99.99,
  "currency": "USD",
  "active": true,
  "description": "Premium plan features",
  "metadata": {}
}
```

**Response:**
```json
{
  "product": { ... }
}
```

### `PATCH /api/products`
Update an existing product.

**Request Body:**
```json
{
  "id": "uuid",
  "price": 89.99,
  "active": false
}
```

### `DELETE /api/products`
Delete a product.

**Request Body:**
```json
{
  "id": "uuid"
}
```

### `POST /api/checkout`
Create a new payment order.

**Request Body:**
```json
{
  "product_id": "uuid",
  "quantity": 1,
  "customer_email": "user@example.com",
  "metadata": {}
}
```

**Response:**
```json
{
  "order_id": "uuid",
  "amount": 99.99,
  "currency": "USD",
  "status": "pending"
}
```

### `POST /api/webhook`
Payment gateway webhook callback.

**Request Body:**
```json
{
  "order_id": "uuid",
  "status": "completed",
  "transaction_id": "txn_123",
  "payment_method": "card"
}
```

**Response:**
```json
{
  "success": true,
  "order": { ... }
}
```

## Deployment

### Vercel (Recommended)

1. Push to GitHub
2. Import project on Vercel
3. Add environment variables:
   - `SUPABASE_URL`
   - `SUPABASE_KEY`
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_KEY`
4. Deploy

## Database Schema

See `schema.sql` for the Supabase database setup.

## Migration from v1

The old dashboard (`dashboard.html`) has been archived to `public/old-dashboard.html`.
The legacy `/api/*.js` files have been migrated to Next.js App Router format.

## Version History

- **v2.0.0** (2026-02-01): Next.js + TypeScript rewrite
- **v1.0.0**: Initial HTML + Vercel Serverless version

## License

MIT

---

Built with ✨ by Aura
