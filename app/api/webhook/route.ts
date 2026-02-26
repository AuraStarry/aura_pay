import { NextRequest } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { HttpError, handleApiError, ok, requireString, safeJson } from '@/lib/api-contract';
import { getRequestId, log } from '@/lib/logger';

const supabase = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_KEY!);

type WebhookBody = {
  event_id?: unknown;
  event_type?: unknown;
  order_id?: unknown;
  status?: unknown;
  transaction_id?: unknown;
  payment_method?: unknown;
  payload?: unknown;
};

/** POST /api/webhook */
export async function POST(request: NextRequest) {
  const startedAt = Date.now();
  const requestId = getRequestId(request.headers);
  try {
    const body = await safeJson<WebhookBody>(request);

    const eventId = requireString(body.event_id, 'event_id');
    const eventType = requireString(body.event_type, 'event_type');
    const orderId = requireString(body.order_id, 'order_id');
    const status = requireString(body.status, 'status');

    const { data: existingEvent } = await supabase
      .from('webhook_events')
      .select('id,processed')
      .eq('provider', 'paddle')
      .eq('event_id', eventId)
      .maybeSingle();

    if (existingEvent?.processed) {
      return ok({ success: true, duplicate: true, event_id: eventId });
    }

    if (!existingEvent) {
      const { error: insertEventError } = await supabase.from('webhook_events').insert({
        provider: 'paddle',
        event_id: eventId,
        event_type: eventType,
        payload: body.payload ?? body,
        processed: false,
      });
      if (insertEventError) throw insertEventError;
    }

    const { data, error } = await supabase
      .from('orders')
      .update({
        status,
        transaction_id: body.transaction_id,
        payment_method: body.payment_method,
        paid_at: status === 'paid' ? new Date().toISOString() : null,
        updated_at: new Date().toISOString(),
      })
      .eq('id', orderId)
      .select()
      .single();

    if (error) throw error;

    const { error: markProcessedError } = await supabase
      .from('webhook_events')
      .update({ processed: true, processed_at: new Date().toISOString(), error_message: null })
      .eq('provider', 'paddle')
      .eq('event_id', eventId);

    if (markProcessedError) throw markProcessedError;

    log('info', 'api.webhook.post.success', 'Processed payment webhook', {
      requestId,
      route: '/api/webhook',
      durationMs: Date.now() - startedAt,
      context: { orderId, status, eventId, eventType },
    });

    return ok({ success: true, order: data, event_id: eventId });
  } catch (error) {
    return handleApiError(error, 'Failed to process webhook', {
      requestId,
      route: '/api/webhook',
      startedAt,
    });
  }
}
