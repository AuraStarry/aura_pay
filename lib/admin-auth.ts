import { HttpError } from '@/lib/api-contract';

export type AdminRole = 'viewer' | 'admin';

function readBearerToken(headers: Headers) {
  const auth = headers.get('authorization') || '';
  if (!auth.toLowerCase().startsWith('bearer ')) return null;
  return auth.slice(7).trim();
}

export function resolveAdminRole(headers: Headers): AdminRole | null {
  const token = readBearerToken(headers);
  if (!token) return null;

  const adminToken = process.env.ADMIN_WRITE_TOKEN;
  const viewerToken = process.env.ADMIN_READ_TOKEN;

  if (adminToken && token === adminToken) return 'admin';
  if (viewerToken && token === viewerToken) return 'viewer';
  return null;
}

export function requireRole(headers: Headers, allowed: AdminRole[]) {
  const role = resolveAdminRole(headers);
  if (!role) {
    throw new HttpError(401, 'bad_request', 'Unauthorized: missing or invalid admin token');
  }

  if (!allowed.includes(role)) {
    throw new HttpError(403, 'bad_request', 'Forbidden: insufficient role');
  }

  return role;
}
