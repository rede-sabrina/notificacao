import crypto from 'crypto';

const SECRET = process.env.AUTH_SECRET || 'dev-secret-change-me';
const COOKIE_NAME = 'notif_auth';

function base64url(input: Buffer | string) {
  const buf = Buffer.isBuffer(input) ? input : Buffer.from(String(input));
  return buf.toString('base64').replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_');
}

export function createToken(user: string, expiresInSec = 60 * 60 * 24) {
  const exp = Math.floor(Date.now() / 1000) + expiresInSec;
  const payload = `${user}:${exp}`;
  const mac = crypto.createHmac('sha256', SECRET).update(payload).digest();
  return `${base64url(payload)}.${base64url(mac)}`;
}

export function verifyTokenFromCookie(cookieHeader?: string | null) {
  if (!cookieHeader) return null;
  const match = cookieHeader.split(';').map(s => s.trim()).find(s => s.startsWith(COOKIE_NAME + '='));
  if (!match) return null;
  const token = match.split('=')[1];
  if (!token) return null;
  const parts = token.split('.');
  if (parts.length !== 2) return null;
  try {
    const payload = Buffer.from(parts[0].replace(/-/g, '+').replace(/_/g, '/'), 'base64').toString();
    const mac = Buffer.from(parts[1].replace(/-/g, '+').replace(/_/g, '/'), 'base64');
    const expected = crypto.createHmac('sha256', SECRET).update(payload).digest();
    if (!crypto.timingSafeEqual(expected, mac)) return null;
    const [user, expStr] = payload.split(':');
    const exp = Number(expStr || 0);
    if (Date.now() / 1000 > exp) return null;
    return { user };
  } catch (e) {
    return null;
  }
}

export function makeAuthCookie(token: string, maxAgeSec = 60 * 60 * 24) {
  const secure = process.env.NODE_ENV === 'production' ? 'Secure; ' : '';
  return `${COOKIE_NAME}=${token}; HttpOnly; ${secure}Path=/; Max-Age=${maxAgeSec}; SameSite=Lax`;
}

export function clearAuthCookie() {
  return `${COOKIE_NAME}=; HttpOnly; Path=/; Max-Age=0; SameSite=Lax`;
}

export { COOKIE_NAME };
