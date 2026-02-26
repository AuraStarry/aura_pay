import { NextRequest } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { handleApiError, ok, requireString, safeJson } from '@/lib/api-contract';
import { getRequestId, log } from '@/lib/logger';

const supabase = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_KEY!);

type WebhookBody = {
  order_id?: unknown;
  status?: unknown;
  transaction_id?: unknown;
  payment_method?: unknown;
};

/** POST /api/webhook */
export async function POST(request: NextRequest) {
  const startedAt = Date.now();
  const requestId = getRequestId(request.headers);
  try {
    const body = await safeJson<WebhookBody>(request);

    const orderId = requireString(body.order_id, 'order_id');
    const status = requireString(body.status, 'status');

    const { data, error } = await supabase
      .from('orders')
      .update({
        status,
        transaction_id: body.transaction_id,
        payment_method: body.payment_method,
        updated_at: new Date().toISOString(),
      })
      .eq('id', orderId)
      .select()
      .single();

    if (error) throw error;

    log('info', 'api.webhook.post.success', 'Processed payment webhook', {
      requestId,
      route: '/api/webhook',
      durationMs: Date.now() - startedAt,
      context: { orderId, status },
    });

    return ok({ success: true, order: data });
  } catch (error) {
    return handleApiError(error, 'Failed to process webhook', {
      requestId,
      route: '/api/webhook',
      startedAt,
    });
  }
}
