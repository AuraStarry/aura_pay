import { beforeEach, describe, expect, it, vi } from 'vitest';

const chain = {
  select: vi.fn(),
  insert: vi.fn(),
  upsert: vi.fn(),
  eq: vi.fn(),
  single: vi.fn(),
};

const from = vi.fn();

vi.mock('@supabase/supabase-js', () => ({
  createClient: () => ({ from }),
}));

beforeEach(() => {
  vi.clearAllMocks();
  process.env.SUPABASE_URL = 'http://localhost:54321';
  process.env.SUPABASE_KEY = 'test-key';

  chain.select.mockReturnValue(chain);
  chain.insert.mockReturnValue(chain);
  chain.upsert.mockReturnValue(chain);
  chain.eq.mockReturnValue(chain);
  from.mockReturnValue(chain);
});

describe('/api/checkout POST', () => {
  it('returns validation_error when quantity <= 0', async () => {
    const { POST } = await import('@/app/api/checkout/route');

    const req = new Request('http://localhost/api/checkout', {
      method: 'POST',
      body: JSON.stringify({ product_price_id: 1, customer_email: 'a@a.com', quantity: 0 }),
      headers: { 'content-type': 'application/json' },
    });

    const res = await POST(req as any);
    const body = await res.json();

    expect(res.status).toBe(400);
    expect(body.ok).toBe(false);
    expect(body.error.code).toBe('validation_error');
  });

  it('returns 404 when product price not found', async () => {
    const { POST } = await import('@/app/api/checkout/route');

    chain.single.mockResolvedValueOnce({ data: null, error: { message: 'not found' } });

    const req = new Request('http://localhost/api/checkout', {
      method: 'POST',
      body: JSON.stringify({ product_price_id: 1, customer_email: 'a@a.com' }),
      headers: { 'content-type': 'application/json' },
    });

    const res = await POST(req as any);
    const body = await res.json();

    expect(res.status).toBe(404);
    expect(body.ok).toBe(false);
    expect(body.error.code).toBe('not_found');
  });

  it('creates order and returns success shape', async () => {
    const { POST } = await import('@/app/api/checkout/route');

    chain.single
      .mockResolvedValueOnce({ data: { id: 1, product_id: 10, billing_type: 'one_time', unit_amount: 20, currency: 'USD' }, error: null })
      .mockResolvedValueOnce({ data: { id: 'c1', email: 'a@a.com' }, error: null })
      .mockResolvedValueOnce({ data: { id: 'o1', amount: 40, currency: 'USD' }, error: null });

    const req = new Request('http://localhost/api/checkout', {
      method: 'POST',
      body: JSON.stringify({ product_price_id: 1, customer_email: 'a@a.com', quantity: 2 }),
      headers: { 'content-type': 'application/json' },
    });

    const res = await POST(req as any);
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.ok).toBe(true);
    expect(body.data.order_id).toBe('o1');
    expect(body.data.amount).toBe(40);
  });
});
