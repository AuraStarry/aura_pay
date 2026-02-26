import { NextResponse } from 'next/server';
import { log, normalizeError } from '@/lib/logger';

export type ApiErrorCode =
  | 'bad_request'
  | 'not_found'
  | 'validation_error'
  | 'internal_error';

export type ApiErrorBody = {
  ok: false;
  error: {
    code: ApiErrorCode;
    message: string;
    details?: unknown;
  };
};

export type ApiSuccessBody<T> = {
  ok: true;
  data: T;
};

export class HttpError extends Error {
  status: number;
  code: ApiErrorCode;
  details?: unknown;

  constructor(status: number, code: ApiErrorCode, message: string, details?: unknown) {
    super(message);
    this.status = status;
    this.code = code;
    this.details = details;
  }
}

export function ok<T>(data: T, status = 200) {
  return NextResponse.json<ApiSuccessBody<T>>({ ok: true, data }, { status });
}

export function fail(status: number, code: ApiErrorCode, message: string, details?: unknown) {
  return NextResponse.json<ApiErrorBody>(
    {
      ok: false,
      error: {
        code,
        message,
        ...(details !== undefined ? { details } : {}),
      },
    },
    { status }
  );
}

export function handleApiError(
  error: unknown,
  fallbackMessage: string,
  meta?: { requestId?: string; route?: string; startedAt?: number }
) {
  const durationMs = meta?.startedAt ? Date.now() - meta.startedAt : undefined;

  if (error instanceof HttpError) {
    log('warn', 'api.validation_or_http_error', error.message, {
      requestId: meta?.requestId,
      route: meta?.route,
      durationMs,
      context: { code: error.code, status: error.status, details: error.details },
    });
    return fail(error.status, error.code, error.message, error.details);
  }

  log('error', 'api.unhandled_error', fallbackMessage, {
    requestId: meta?.requestId,
    route: meta?.route,
    durationMs,
    error: normalizeError(error),
  });

  return fail(500, 'internal_error', fallbackMessage);
}

export async function safeJson<T>(request: Request): Promise<T> {
  try {
    return (await request.json()) as T;
  } catch {
    throw new HttpError(400, 'bad_request', 'Invalid JSON body');
  }
}

export function requireString(value: unknown, field: string) {
  if (typeof value !== 'string' || value.trim() === '') {
    throw new HttpError(400, 'validation_error', `Field \`${field}\` must be a non-empty string`);
  }
  return value.trim();
}

export function requireNumber(value: unknown, field: string) {
  if (typeof value !== 'number' || Number.isNaN(value)) {
    throw new HttpError(400, 'validation_error', `Field \`${field}\` must be a valid number`);
  }
  return value;
}

export function optionalBoolean(value: unknown, field: string) {
  if (value === undefined) return undefined;
  if (typeof value !== 'boolean') {
    throw new HttpError(400, 'validation_error', `Field \`${field}\` must be boolean`);
  }
  return value;
}
