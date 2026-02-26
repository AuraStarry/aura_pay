import { HttpError } from '@/lib/api-contract';

type Bucket = { count: number; resetAt: number };

const memoryBuckets = new Map<string, Bucket>();

export function enforceRateLimit(opts: {
  key: string;
  limit: number;
  windowMs: number;
}) {
  const now = Date.now();
  const current = memoryBuckets.get(opts.key);

  if (!current || now >= current.resetAt) {
    memoryBuckets.set(opts.key, { count: 1, resetAt: now + opts.windowMs });
    return;
  }

  if (current.count >= opts.limit) {
    throw new HttpError(429, 'bad_request', 'Rate limit exceeded');
  }

  current.count += 1;
  memoryBuckets.set(opts.key, current);
}
