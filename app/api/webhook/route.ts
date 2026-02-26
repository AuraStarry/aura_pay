import { NextRequest } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { HttpError, handleApiError, ok } from '@/lib/api-contract';
import { getRequestId, log } from '@/lib/logger';
import { mapPaddleOrderStatus, mapPaddleSubscriptionStatus, verifyPaddleSignature } from '@/lib/paddle-webhook';

const supabase = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_KEY!);

type PaddleEnvelope = {
  event_id?: string;
  event_type?: string;
  data?: any;
};

/** POST /api/webhook */
export async function POST(request: NextRequest) {
  const startedAt = Date.now();
  const requestId = getRequestId(request.headers);

  try {
    const rawBody = await request.text();
    verifyPaddleSignature(rawBody, request.headers.get('paddle-signature'), process.env.PADDLE_WEBHOOK_SECRET);

    const body = JSON.parse(rawBody) as PaddleEnvelope;
    const eventId = body.event_id;
    const eventType = body.event_type;

    if (!eventId || !eventType) {
      throw new HttpError(400, 'validation_error', 'Invalid webhook payload: missing event_id/event_type');
    }

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
        payload: body,
        processed: false,
      });
      if (insertEventError) throw insertEventError;
    }

    const orderStatus = mapPaddleOrderStatus(eventType);
    const subscriptionStatus = mapPaddleSubscriptionStatus(eventType);

    if (orderStatus && body.data?.order_id) {
      const { error } = await supabase
        .from('orders')
        .update({
          status: orderStatus,
          transaction_id: body.data?.transaction_id ?? null,
          payment_method: body.data?.payment_method ?? null,
          paid_at: orderStatus === 'paid' ? new Date().toISOString() : null,
          paddle_transaction_id: body.data?.transaction_id ?? null,
          updated_at: new Date().toISOString(),
        })
        .eq('id', body.data.order_id);
      if (error) throw error;
    }

    if (subscriptionStatus && body.data?.subscription_id) {
      const payload: Record<string, unknown> = {
        status: subscriptionStatus,
        current_period_start: body.data?.current_period_start ?? null,
        current_period_end: body.data?.current_period_end ?? null,
        cancel_at_period_end: body.data?.cancel_at_period_end ?? false,
        canceled_at: body.data?.canceled_at ?? null,
        updated_at: new Date().toISOString(),
      };

      const { error } = await supabase
        .from('subscriptions')
        .update(payload)
        .eq('paddle_subscription_id', body.data.subscription_id);
      if (error) throw error;
    }

    const { error: markProcessedError } = await supabase
      .from('webhook_events')
      .update({ processed: true, processed_at: new Date().toISOString(), error_message: null })
      .eq('provider', 'paddle')
      .eq('event_id', eventId);

    if (markProcessedError) throw markProcessedError;

    log('info', 'api.webhook.post.success', 'Processed paddle webhook', {
      requestId,
      route: '/api/webhook',
      durationMs: Date.now() - startedAt,
      context: { eventId, eventType, orderStatus, subscriptionStatus },
    });

    return ok({ success: true, event_id: eventId, event_type: eventType });
  } catch (error) {
    return handleApiError(error, 'Failed to process webhook', {
      requestId,
      route: '/api/webhook',
      startedAt,
    });
  }
}
