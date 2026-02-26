import { beforeEach, describe, expect, it, vi } from 'vitest';

const chain = {
  select: vi.fn(),
  insert: vi.fn(),
  update: vi.fn(),
  delete: vi.fn(),
  eq: vi.fn(),
  single: vi.fn(),
};

const from = vi.fn();

vi.mock('@supabase/supabase-js', () => ({
  createClient: () => ({
    from,
  }),
}));

beforeEach(() => {
  vi.clearAllMocks();
  process.env.SUPABASE_URL = 'http://localhost:54321';
  process.env.SUPABASE_KEY = 'test-key';

  chain.select.mockReturnValue(chain);
  chain.insert.mockReturnValue(chain);
  chain.update.mockReturnValue(chain);
  chain.delete.mockReturnValue(chain);
  chain.eq.mockReturnValue(chain);
  from.mockReturnValue(chain);
});

describe('/api/products POST', () => {
  it('returns validation error when required fields missing', async () => {
    const { POST } = await import('@/app/api/products/route');

    const req = new Request('http://localhost/api/products', {
      method: 'POST',
      body: JSON.stringify({}),
      headers: { 'content-type': 'application/json' },
    });

    const res = await POST(req as any);
    const body = await res.json();

    expect(res.status).toBe(400);
    expect(body.ok).toBe(false);
    expect(body.error.code).toBe('validation_error');
  });

  it('creates product and returns unified success shape', async () => {
    const { POST } = await import('@/app/api/products/route');

    chain.single.mockResolvedValueOnce({
      data: { id: 'p1', name: 'Pro', sku: 'pro', price: 10, currency: 'USD', active: true },
      error: null,
    });

    const req = new Request('http://localhost/api/products', {
      method: 'POST',
      body: JSON.stringify({ name: 'Pro', sku: 'pro', price: 10 }),
      headers: { 'content-type': 'application/json' },
    });

    const res = await POST(req as any);
    const body = await res.json();

    expect(res.status).toBe(201);
    expect(body.ok).toBe(true);
    expect(body.data.product.id).toBe('p1');
  });
});
