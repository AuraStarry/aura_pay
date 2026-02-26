export type LogLevel = 'debug' | 'info' | 'warn' | 'error';

type LogPayload = {
  level: LogLevel;
  event: string;
  message: string;
  requestId?: string;
  route?: string;
  durationMs?: number;
  context?: Record<string, unknown>;
  error?: {
    name?: string;
    message: string;
    stack?: string;
  };
  timestamp: string;
};

function emit(payload: LogPayload) {
  const line = JSON.stringify(payload);
  if (payload.level === 'error' || payload.level === 'warn') {
    console.error(line);
    return;
  }
  console.log(line);
}

export function log(level: LogLevel, event: string, message: string, extra?: Omit<LogPayload, 'level' | 'event' | 'message' | 'timestamp'>) {
  emit({
    level,
    event,
    message,
    timestamp: new Date().toISOString(),
    ...extra,
  });
}

export function normalizeError(error: unknown) {
  if (error instanceof Error) {
    return {
      name: error.name,
      message: error.message,
      stack: error.stack,
    };
  }
  return {
    message: typeof error === 'string' ? error : 'Unknown error',
  };
}

export function getRequestId(headers: Headers) {
  return headers.get('x-request-id') || crypto.randomUUID();
}
