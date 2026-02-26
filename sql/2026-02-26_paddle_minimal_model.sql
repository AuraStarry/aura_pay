-- Incremental migration for existing Aura Pay projects

create extension if not exists pgcrypto;

alter table public.products
  add column if not exists slug text;

alter table public.products
  add column if not exists sku text;

do $$ begin
  if not exists (
    select 1 from pg_constraint where conname = 'products_slug_key'
  ) then
    alter table public.products add constraint products_slug_key unique (slug);
  end if;
end $$;

do $$ begin
  if not exists (
    select 1 from pg_constraint where conname = 'products_sku_key'
  ) then
    alter table public.products add constraint products_sku_key unique (sku);
  end if;
end $$;

create table if not exists public.product_prices (
  id bigserial primary key,
  product_id bigint not null references public.products(id) on delete cascade,
  name text not null,
  billing_type text not null check (billing_type in ('one_time', 'subscription')),
  unit_amount decimal(10, 2) not null,
  currency text not null default 'USD',
  interval text check (interval in ('day', 'week', 'month', 'year')),
  interval_count integer,
  trial_days integer,
  active boolean not null default true,
  paddle_price_id text unique,
  metadata jsonb,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  constraint product_prices_subscription_interval_check check (
    (billing_type = 'one_time' and interval is null and interval_count is null)
    or
    (billing_type = 'subscription' and interval is not null and interval_count is not null and interval_count > 0)
  )
);

create table if not exists public.customers (
  id uuid primary key default gen_random_uuid(),
  email text not null unique,
  name text,
  paddle_customer_id text unique,
  metadata jsonb,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table public.orders add column if not exists customer_id uuid references public.customers(id);
alter table public.orders add column if not exists product_price_id bigint references public.product_prices(id);
alter table public.orders add column if not exists currency text default 'USD';
alter table public.orders add column if not exists order_type text default 'one_time';
alter table public.orders add column if not exists paddle_transaction_id text;
alter table public.orders add column if not exists paddle_checkout_id text;
alter table public.orders add column if not exists paid_at timestamptz;

alter table public.orders
  drop constraint if exists orders_order_type_check;
alter table public.orders
  add constraint orders_order_type_check check (order_type in ('one_time', 'subscription_initial', 'subscription_renewal'));

alter table public.orders
  drop constraint if exists orders_status_check;
alter table public.orders
  add constraint orders_status_check check (status in ('pending', 'paid', 'failed', 'refunded', 'canceled'));

create unique index if not exists idx_orders_paddle_transaction_id_unique on public.orders(paddle_transaction_id) where paddle_transaction_id is not null;

create table if not exists public.subscriptions (
  id uuid primary key default gen_random_uuid(),
  customer_id uuid not null references public.customers(id),
  product_id bigint not null references public.products(id),
  product_price_id bigint not null references public.product_prices(id),
  status text not null check (status in ('trialing', 'active', 'past_due', 'paused', 'canceled')),
  current_period_start timestamptz,
  current_period_end timestamptz,
  cancel_at_period_end boolean default false,
  canceled_at timestamptz,
  paddle_subscription_id text unique,
  metadata jsonb,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists public.webhook_events (
  id uuid primary key default gen_random_uuid(),
  provider text not null default 'paddle',
  event_id text not null,
  event_type text not null,
  payload jsonb not null,
  processed boolean not null default false,
  processed_at timestamptz,
  error_message text,
  created_at timestamptz default now(),
  unique(provider, event_id)
);

create index if not exists idx_product_prices_product_id on public.product_prices(product_id);
create index if not exists idx_product_prices_active on public.product_prices(active);
create index if not exists idx_orders_customer_id on public.orders(customer_id);
create index if not exists idx_orders_product_price_id on public.orders(product_price_id);
create index if not exists idx_subscriptions_status on public.subscriptions(status);
create index if not exists idx_subscriptions_customer_id on public.subscriptions(customer_id);
create index if not exists idx_webhook_events_processed on public.webhook_events(processed);

alter table public.product_prices enable row level security;
alter table public.customers enable row level security;
alter table public.subscriptions enable row level security;
alter table public.webhook_events enable row level security;

create policy if not exists "Public active product prices are viewable by everyone"
  on public.product_prices for select
  using (active = true);

create policy if not exists "Customers are only accessible via service key"
  on public.customers for all
  using (false);

create policy if not exists "Subscriptions are only accessible via service key"
  on public.subscriptions for all
  using (false);

create policy if not exists "Webhook events are only accessible via service key"
  on public.webhook_events for all
  using (false);
