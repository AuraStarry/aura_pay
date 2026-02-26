import { NextRequest } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { HttpError, handleApiError, ok, requireNumber, requireString, safeJson } from '@/lib/api-contract';

const supabase = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_KEY!);

type CheckoutBody = {
  product_id?: unknown;
  quantity?: unknown;
  customer_email?: unknown;
  metadata?: unknown;
};

/** POST /api/checkout */
export async function POST(request: NextRequest) {
  try {
    const body = await safeJson<CheckoutBody>(request);

    const productId = requireString(body.product_id, 'product_id');
    const customerEmail = requireString(body.customer_email, 'customer_email');
    const quantity = body.quantity === undefined ? 1 : requireNumber(body.quantity, 'quantity');

    if (quantity <= 0) {
      throw new HttpError(400, 'validation_error', 'Field `quantity` must be greater than 0');
    }

    const { data: product, error: productError } = await supabase
      .from('products')
      .select('*')
      .eq('id', productId)
      .single();

    if (productError || !product) {
      throw new HttpError(404, 'not_found', 'Product not found');
    }

    const { data: order, error: orderError } = await supabase
      .from('orders')
      .insert({
        product_id: productId,
        quantity,
        customer_email: customerEmail,
        amount: product.price * quantity,
        status: 'pending',
        metadata: body.metadata,
      })
      .select()
      .single();

    if (orderError) throw orderError;

    return ok({
      order_id: order.id,
      amount: order.amount,
      currency: product.currency || 'USD',
      status: 'pending',
    });
  } catch (error) {
    return handleApiError(error, 'Failed to create checkout');
  }
}
