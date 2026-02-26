import { NextRequest } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { HttpError, handleApiError, ok, optionalBoolean, requireNumber, requireString, safeJson } from '@/lib/api-contract';
import { requireRole } from '@/lib/admin-auth';
import { getRequestId, log } from '@/lib/logger';

const supabase = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_KEY!);

type CreateBody = {
  product_id?: unknown;
  name?: unknown;
  billing_type?: unknown;
  unit_amount?: unknown;
  currency?: unknown;
  interval?: unknown;
  interval_count?: unknown;
  trial_days?: unknown;
  active?: unknown;
  metadata?: unknown;
};

type UpdateBody = CreateBody & { id?: unknown };
type DeleteBody = { id?: unknown };

export async function GET(request: NextRequest) {
  const startedAt = Date.now();
  const requestId = getRequestId(request.headers);
  try {
    requireRole(request.headers, ['viewer', 'admin']);
    const { searchParams } = new URL(request.url);
    const showAll = searchParams.get('all') === 'true';
    const productId = searchParams.get('product_id');

    let query = supabase.from('product_prices').select('*');
    if (!showAll) query = query.eq('active', true);
    if (productId) query = query.eq('product_id', Number(productId));

    const { data, error } = await query;
    if (error) throw error;

    log('info', 'api.product_prices.get.success', 'Fetched product prices', {
      requestId,
      route: '/api/product-prices',
      durationMs: Date.now() - startedAt,
      context: { count: (data ?? []).length },
    });

    return ok({ prices: data ?? [] });
  } catch (error) {
    return handleApiError(error, 'Failed to fetch product prices', { requestId, route: '/api/product-prices', startedAt });
  }
}

export async function POST(request: NextRequest) {
  const startedAt = Date.now();
  const requestId = getRequestId(request.headers);
  try {
    requireRole(request.headers, ['admin']);
    const body = await safeJson<CreateBody>(request);

    const productId = requireNumber(body.product_id, 'product_id');
    const name = requireString(body.name, 'name');
    const billingType = requireString(body.billing_type, 'billing_type');
    const unitAmount = requireNumber(body.unit_amount, 'unit_amount');
    const currency = body.currency === undefined ? 'USD' : requireString(body.currency, 'currency');
    const active = body.active === undefined ? true : optionalBoolean(body.active, 'active');

    if (!['one_time', 'subscription'].includes(billingType)) {
      throw new HttpError(400, 'validation_error', 'Field `billing_type` must be one of: one_time, subscription');
    }

    const payload: Record<string, unknown> = {
      product_id: productId,
      name,
      billing_type: billingType,
      unit_amount: unitAmount,
      currency,
      active,
      metadata: body.metadata,
    };

    if (billingType === 'subscription') {
      payload.interval = body.interval === undefined ? 'month' : requireString(body.interval, 'interval');
      payload.interval_count = body.interval_count === undefined ? 1 : requireNumber(body.interval_count, 'interval_count');
      if (body.trial_days !== undefined) payload.trial_days = requireNumber(body.trial_days, 'trial_days');
    }

    const { data, error } = await supabase.from('product_prices').insert(payload).select().single();
    if (error) throw error;

    log('info', 'api.product_prices.post.success', 'Created product price', {
      requestId,
      route: '/api/product-prices',
      durationMs: Date.now() - startedAt,
      context: { priceId: data.id, productId },
    });

    return ok({ price: data }, 201);
  } catch (error) {
    return handleApiError(error, 'Failed to create product price', { requestId, route: '/api/product-prices', startedAt });
  }
}

export async function PATCH(request: NextRequest) {
  const startedAt = Date.now();
  const requestId = getRequestId(request.headers);
  try {
    requireRole(request.headers, ['admin']);
    const body = await safeJson<UpdateBody>(request);
    const id = requireNumber(body.id, 'id');

    const updates: Record<string, unknown> = {};
    if (body.name !== undefined) updates.name = requireString(body.name, 'name');
    if (body.unit_amount !== undefined) updates.unit_amount = requireNumber(body.unit_amount, 'unit_amount');
    if (body.currency !== undefined) updates.currency = requireString(body.currency, 'currency');
    if (body.active !== undefined) updates.active = optionalBoolean(body.active, 'active');

    if (Object.keys(updates).length === 0) throw new HttpError(400, 'validation_error', 'No updates provided');

    const { data, error } = await supabase.from('product_prices').update(updates).eq('id', id).select().single();
    if (error) throw error;

    return ok({ price: data });
  } catch (error) {
    return handleApiError(error, 'Failed to update product price', { requestId, route: '/api/product-prices', startedAt });
  }
}

export async function DELETE(request: NextRequest) {
  const startedAt = Date.now();
  const requestId = getRequestId(request.headers);
  try {
    requireRole(request.headers, ['admin']);
    const body = await safeJson<DeleteBody>(request);
    const id = requireNumber(body.id, 'id');
    const { error } = await supabase.from('product_prices').delete().eq('id', id);
    if (error) throw error;
    return ok({ success: true });
  } catch (error) {
    return handleApiError(error, 'Failed to delete product price', { requestId, route: '/api/product-prices', startedAt });
  }
}
