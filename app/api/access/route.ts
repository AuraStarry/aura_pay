import { NextRequest } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { handleApiError, ok, requireNumber, requireString, safeJson } from '@/lib/api-contract';
import { getRequestId, log } from '@/lib/logger';
import { requireServiceToken } from '@/lib/service-auth';
import { enforceRateLimit } from '@/lib/rate-limit';

const supabase = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_KEY!);

type AccessBody = {
  customer_email?: unknown;
  product_id?: unknown;
  product_price_id?: unknown;
};

/** POST /api/access */
export async function POST(request: NextRequest) {
  const startedAt = Date.now();
  const requestId = getRequestId(request.headers);

  try {
    const serviceToken = requireServiceToken(request.headers, 'ACCESS_API_TOKEN');

    const forwardedFor = request.headers.get('x-forwarded-for') || 'unknown';
    const ip = forwardedFor.split(',')[0]?.trim() || 'unknown';
    const rateLimitPerMin = Number(process.env.ACCESS_API_RATE_LIMIT_PER_MIN || 120);

    enforceRateLimit({
      key: `access:${serviceToken}:${ip}`,
      limit: rateLimitPerMin,
      windowMs: 60_000,
    });

    const body = await safeJson<AccessBody>(request);

    const customerEmail = requireString(body.customer_email, 'customer_email');
    const productId = body.product_id === undefined ? undefined : requireNumber(body.product_id, 'product_id');
    const productPriceId = body.product_price_id === undefined ? undefined : requireNumber(body.product_price_id, 'product_price_id');

    const { data: customer, error: customerError } = await supabase
      .from('customers')
      .select('id,email')
      .eq('email', customerEmail)
      .maybeSingle();

    if (customerError) throw customerError;

    if (!customer) {
      return ok({
        has_access: false,
        reason: 'customer_not_found',
        customer_email: customerEmail,
        matched_subscription: null,
        matched_order: null,
      });
    }

    let subQuery = supabase
      .from('subscriptions')
      .select('id,status,product_id,product_price_id,current_period_end')
      .eq('customer_id', customer.id)
      .in('status', ['trialing', 'active']);

    if (productId !== undefined) subQuery = subQuery.eq('product_id', productId);
    if (productPriceId !== undefined) subQuery = subQuery.eq('product_price_id', productPriceId);

    const { data: subscriptions, error: subError } = await subQuery.limit(1);
    if (subError) throw subError;

    let orderQuery = supabase
      .from('orders')
      .select('id,status,product_id,product_price_id,paid_at,order_type')
      .eq('customer_id', customer.id)
      .eq('status', 'paid')
      .order('paid_at', { ascending: false });

    if (productId !== undefined) orderQuery = orderQuery.eq('product_id', productId);
    if (productPriceId !== undefined) orderQuery = orderQuery.eq('product_price_id', productPriceId);

    const { data: orders, error: orderError } = await orderQuery.limit(1);
    if (orderError) throw orderError;

    const matchedSubscription = subscriptions?.[0] ?? null;
    const matchedOrder = orders?.[0] ?? null;

    const hasAccess = Boolean(matchedSubscription || matchedOrder);

    log('info', 'api.access.post.success', 'Evaluated access state', {
      requestId,
      route: '/api/access',
      durationMs: Date.now() - startedAt,
      context: {
        customerEmail,
        productId: productId ?? null,
        productPriceId: productPriceId ?? null,
        hasAccess,
      },
    });

    return ok({
      has_access: hasAccess,
      reason: hasAccess ? 'matched_paid_state' : 'no_paid_or_active_state',
      customer_email: customerEmail,
      matched_subscription: matchedSubscription,
      matched_order: matchedOrder,
    });
  } catch (error) {
    return handleApiError(error, 'Failed to evaluate access', {
      requestId,
      route: '/api/access',
      startedAt,
    });
  }
}
