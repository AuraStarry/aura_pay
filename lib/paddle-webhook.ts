import crypto from 'crypto';
import { HttpError } from '@/lib/api-contract';

export function verifyPaddleSignature(rawBody: string, signatureHeader: string | null, secret: string | undefined) {
  if (!secret) {
    throw new HttpError(500, 'internal_error', 'Missing PADDLE_WEBHOOK_SECRET');
  }
  if (!signatureHeader) {
    throw new HttpError(401, 'bad_request', 'Missing Paddle-Signature header');
  }

  const parts = Object.fromEntries(
    signatureHeader
      .split(';')
      .map((p) => p.trim())
      .filter(Boolean)
      .map((p) => {
        const idx = p.indexOf('=');
        return [p.slice(0, idx), p.slice(idx + 1)];
      })
  ) as Record<string, string>;

  const ts = parts.ts;
  const h1 = parts.h1;
  if (!ts || !h1) {
    throw new HttpError(401, 'bad_request', 'Invalid Paddle-Signature header');
  }

  const signedPayload = `${ts}:${rawBody}`;
  const digest = crypto.createHmac('sha256', secret).update(signedPayload, 'utf8').digest('hex');

  const expected = Buffer.from(digest, 'utf8');
  const received = Buffer.from(h1, 'utf8');
  const valid = expected.length === received.length && crypto.timingSafeEqual(expected, received);

  if (!valid) {
    throw new HttpError(401, 'bad_request', 'Invalid Paddle webhook signature');
  }
}

export function mapPaddleOrderStatus(eventType: string): 'paid' | 'failed' | 'refunded' | 'canceled' | null {
  const map: Record<string, 'paid' | 'failed' | 'refunded' | 'canceled'> = {
    'transaction.paid': 'paid',
    'transaction.completed': 'paid',
    'transaction.payment_failed': 'failed',
    'transaction.refunded': 'refunded',
    'transaction.canceled': 'canceled',
  };
  return map[eventType] ?? null;
}

export function mapPaddleSubscriptionStatus(eventType: string): 'trialing' | 'active' | 'past_due' | 'paused' | 'canceled' | null {
  const map: Record<string, 'trialing' | 'active' | 'past_due' | 'paused' | 'canceled'> = {
    'subscription.created': 'trialing',
    'subscription.activated': 'active',
    'subscription.trialing': 'trialing',
    'subscription.past_due': 'past_due',
    'subscription.paused': 'paused',
    'subscription.resumed': 'active',
    'subscription.canceled': 'canceled',
  };
  return map[eventType] ?? null;
}
