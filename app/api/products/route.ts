import { NextRequest } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import {
  HttpError,
  handleApiError,
  ok,
  optionalBoolean,
  requireNumber,
  requireString,
  safeJson,
} from '@/lib/api-contract';
import { getRequestId, log } from '@/lib/logger';

const supabase = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_KEY!);

type ProductCreateBody = {
  name?: unknown;
  sku?: unknown;
  price?: unknown;
  currency?: unknown;
  active?: unknown;
  description?: unknown;
  metadata?: unknown;
};

type ProductUpdateBody = {
  id?: unknown;
  name?: unknown;
  sku?: unknown;
  price?: unknown;
  currency?: unknown;
  active?: unknown;
  description?: unknown;
  metadata?: unknown;
};

type ProductDeleteBody = { id?: unknown };

/** GET /api/products */
export async function GET(request: NextRequest) {
  const startedAt = Date.now();
  const requestId = getRequestId(request.headers);
  try {
    const { searchParams } = new URL(request.url);
    const showAll = searchParams.get('all') === 'true';

    let query = supabase.from('products').select('*');
    if (!showAll) query = query.eq('active', true);

    const { data, error } = await query;
    if (error) throw error;

    const durationMs = Date.now() - startedAt;
    log('info', 'api.products.get.success', 'Fetched products', {
      requestId,
      route: '/api/products',
      durationMs,
      context: { count: (data ?? []).length },
    });

    return ok({ products: data ?? [] });
  } catch (error) {
    return handleApiError(error, 'Failed to fetch products', {
      requestId,
      route: '/api/products',
      startedAt,
    });
  }
}

/** POST /api/products */
export async function POST(request: NextRequest) {
  const startedAt = Date.now();
  const requestId = getRequestId(request.headers);
  try {
    const body = await safeJson<ProductCreateBody>(request);

    const name = requireString(body.name, 'name');
    const sku = requireString(body.sku, 'sku');
    const price = requireNumber(body.price, 'price');
    const currency = body.currency === undefined ? 'USD' : requireString(body.currency, 'currency');
    const active = body.active === undefined ? true : optionalBoolean(body.active, 'active');

    const { data, error } = await supabase
      .from('products')
      .insert({
        name,
        sku,
        price,
        currency,
        active,
        description: body.description,
        metadata: body.metadata,
      })
      .select()
      .single();

    if (error) throw error;

    log('info', 'api.products.post.success', 'Created product', {
      requestId,
      route: '/api/products',
      durationMs: Date.now() - startedAt,
      context: { productId: data.id, sku: data.sku },
    });

    return ok({ product: data }, 201);
  } catch (error) {
    return handleApiError(error, 'Failed to create product', {
      requestId,
      route: '/api/products',
      startedAt,
    });
  }
}

/** PATCH /api/products */
export async function PATCH(request: NextRequest) {
  const startedAt = Date.now();
  const requestId = getRequestId(request.headers);
  try {
    const body = await safeJson<ProductUpdateBody>(request);
    const id = requireString(body.id, 'id');

    const updates: Record<string, unknown> = {};

    if (body.name !== undefined) updates.name = requireString(body.name, 'name');
    if (body.sku !== undefined) updates.sku = requireString(body.sku, 'sku');
    if (body.price !== undefined) updates.price = requireNumber(body.price, 'price');
    if (body.currency !== undefined) updates.currency = requireString(body.currency, 'currency');
    if (body.active !== undefined) updates.active = optionalBoolean(body.active, 'active');
    if (body.description !== undefined) updates.description = body.description;
    if (body.metadata !== undefined) updates.metadata = body.metadata;

    if (Object.keys(updates).length === 0) {
      throw new HttpError(400, 'validation_error', 'No updates provided');
    }

    const { data, error } = await supabase
      .from('products')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;

    log('info', 'api.products.patch.success', 'Updated product', {
      requestId,
      route: '/api/products',
      durationMs: Date.now() - startedAt,
      context: { productId: data.id },
    });

    return ok({ product: data });
  } catch (error) {
    return handleApiError(error, 'Failed to update product', {
      requestId,
      route: '/api/products',
      startedAt,
    });
  }
}

/** DELETE /api/products */
export async function DELETE(request: NextRequest) {
  const startedAt = Date.now();
  const requestId = getRequestId(request.headers);
  try {
    const body = await safeJson<ProductDeleteBody>(request);
    const id = requireString(body.id, 'id');

    const { error } = await supabase.from('products').delete().eq('id', id);
    if (error) throw error;

    log('info', 'api.products.delete.success', 'Deleted product', {
      requestId,
      route: '/api/products',
      durationMs: Date.now() - startedAt,
      context: { productId: id },
    });

    return ok({ success: true });
  } catch (error) {
    return handleApiError(error, 'Failed to delete product', {
      requestId,
      route: '/api/products',
      startedAt,
    });
  }
}
