import crypto from 'node:crypto';

export class HttpError extends Error {
  constructor(status, message, extra = {}) {
    super(message);
    this.status = status;
    this.extra = extra;
  }
}

export const env = (k, d = '') => {
  try {
    // eslint-disable-next-line no-undef
    const v = typeof Netlify !== 'undefined' && Netlify.env?.get ? Netlify.env.get(k) : undefined;
    if (v) return v;
  } catch {}
  return process.env[k] || d;
};

export const json = (data, status = 200) =>
  new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' },
  });

// ---------- Sesi admin (token HMAC, tiada pangkalan data) ----------
const key = () => {
  const pw = env('ADMIN_PASSWORD');
  if (!pw) throw new HttpError(500, 'ADMIN_PASSWORD belum ditetapkan dalam Netlify (Site configuration → Environment variables).');
  return crypto.createHash('sha256').update(`pps-admin:${pw}:${env('ADMIN_SECRET')}`).digest();
};
const b64u = (buf) => Buffer.from(buf).toString('base64url');

export function checkPassword(input) {
  const pw = env('ADMIN_PASSWORD');
  if (!pw) throw new HttpError(500, 'ADMIN_PASSWORD belum ditetapkan dalam Netlify. Tetapkan dahulu, kemudian deploy semula.');
  const a = crypto.createHash('sha256').update(String(input || '')).digest();
  const b = crypto.createHash('sha256').update(pw).digest();
  return crypto.timingSafeEqual(a, b);
}

export function issueToken(hours = 12) {
  const payload = b64u(JSON.stringify({ exp: Date.now() + hours * 3600_000 }));
  const sig = b64u(crypto.createHmac('sha256', key()).update(payload).digest());
  return `${payload}.${sig}`;
}

export function requireAuth(req) {
  const h = req.headers.get('authorization') || '';
  const token = h.replace(/^Bearer\s+/i, '');
  const [payload, sig] = token.split('.');
  if (!payload || !sig) throw new HttpError(401, 'Sila log masuk semula.');
  const expect = b64u(crypto.createHmac('sha256', key()).update(payload).digest());
  if (expect.length !== sig.length || !crypto.timingSafeEqual(Buffer.from(expect), Buffer.from(sig)))
    throw new HttpError(401, 'Sesi tidak sah. Sila log masuk semula.');
  const { exp } = JSON.parse(Buffer.from(payload, 'base64url').toString());
  if (Date.now() > exp) throw new HttpError(401, 'Sesi telah tamat. Sila log masuk semula.');
}

export const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
