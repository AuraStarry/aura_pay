import { HttpError } from '@/lib/api-contract';

export function requireServiceToken(headers: Headers, envKey: 'ACCESS_API_TOKEN') {
  const configured = process.env[envKey];
  if (!configured) {
    throw new HttpError(500, 'internal_error', `Missing ${envKey}`);
  }

  const auth = headers.get('authorization') || '';
  if (!auth.toLowerCase().startsWith('bearer ')) {
    throw new HttpError(401, 'bad_request', 'Missing bearer token');
  }

  const provided = auth.slice(7).trim();
  if (!provided || provided !== configured) {
    throw new HttpError(403, 'bad_request', 'Forbidden: invalid service token');
  }

  return provided;
}
