import { NextRequest } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { HttpError, handleApiError, ok, requireNumber, requireString, safeJson } from '@/lib/api-contract';
import { getRequestId, log } from '@/lib/logger';

const supabase = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_KEY!);

type CheckoutBody = {
  product_price_id?: unknown;
  quantity?: unknown;
  customer_email?: unknown;
  customer_name?: unknown;
  metadata?: unknown;
};

/** POST /api/checkout */
export async function POST(request: NextRequest) {
  const startedAt = Date.now();
  const requestId = getRequestId(request.headers);
  try {
    const body = await safeJson<CheckoutBody>(request);

    const productPriceId = requireNumber(body.product_price_id, 'product_price_id');
    const customerEmail = requireString(body.customer_email, 'customer_email');
    const customerName = body.customer_name === undefined ? null : requireString(body.customer_name, 'customer_name');
    const quantity = body.quantity === undefined ? 1 : requireNumber(body.quantity, 'quantity');

    if (quantity <= 0) {
      throw new HttpError(400, 'validation_error', 'Field `quantity` must be greater than 0');
    }

    const { data: price, error: priceError } = await supabase
      .from('product_prices')
      .select('id,product_id,billing_type,unit_amount,currency')
      .eq('id', productPriceId)
      .eq('active', true)
      .single();

    if (priceError || !price) {
      throw new HttpError(404, 'not_found', 'Product price not found');
    }

    const { data: customer, error: customerError } = await supabase
      .from('customers')
      .upsert(
        { email: customerEmail, name: customerName },
        { onConflict: 'email' }
      )
      .select('id,email')
      .single();

    if (customerError || !customer) throw customerError || new Error('Failed to upsert customer');

    const orderType = price.billing_type === 'subscription' ? 'subscription_initial' : 'one_time';
    const amount = Number(price.unit_amount) * quantity;

    const { data: order, error: orderError } = await supabase
      .from('orders')
      .insert({
        customer_id: customer.id,
        customer_email: customerEmail,
        product_id: price.product_id,
        product_price_id: price.id,
        quantity,
        amount,
        currency: price.currency,
        order_type: orderType,
        status: 'pending',
        metadata: body.metadata,
      })
      .select()
      .single();

    if (orderError) throw orderError;

    log('info', 'api.checkout.post.success', 'Created checkout order', {
      requestId,
      route: '/api/checkout',
      durationMs: Date.now() - startedAt,
      context: { orderId: order.id, productPriceId, quantity, orderType },
    });

    return ok({
      order_id: order.id,
      amount: order.amount,
      currency: order.currency || price.currency || 'USD',
      status: 'pending',
      order_type: orderType,
    });
  } catch (error) {
    return handleApiError(error, 'Failed to create checkout', {
      requestId,
      route: '/api/checkout',
      startedAt,
    });
  }
}
