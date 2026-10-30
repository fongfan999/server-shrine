/**
 * Cloudflare Worker.
 * - /api/status  → JSON status for anyone who wants to poll the meditation.
 * - /api/health  → 200 OK
 * - /new         → redirects to a freshly named prayer room
 * - /api/rooms/:room/ws → WebSocket into that room's Shrine Durable Object
 * - /r/:room     → the page itself (the client notices it is in a room)
 * Everything else (the page, /r/:room, bundles) is served by the asset store
 * without running this Worker; its headers live in public/_headers.
 */

import { Shrine } from './shrine.js';

export { Shrine };

let startedAt = 0; // set on first request: Workers freeze the clock until a request arrives

const SECURITY_HEADERS = {
  'X-Content-Type-Options': 'nosniff',
  'X-Frame-Options': 'SAMEORIGIN',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  'Permissions-Policy': 'camera=(), microphone=(), geolocation=()',
};

const MANTRAS = [
  'Clearing cache and karma…',
  'Rebooting chakras…',
  'Turning it off and om again…',
  'Retrying with exponential compassion…',
  'Kubernetes is also just trying its best.',
];

const ROOM_RE = /^[a-z0-9-]{3,48}$/;

const ADJECTIVES = ['quiet', 'sleepy', 'humble', 'patient', 'serene', 'devout', 'stoic', 'mellow', 'eternal', 'golden', 'gentle', 'lucky'];
const NOUNS = ['lotus', 'rack', 'kernel', 'daemon', 'uptime', 'pagoda', 'packet', 'monk', 'cache', 'socket', 'shrine', 'pod'];

function roomName() {
  const pick = (a) => a[Math.floor(Math.random() * a.length)];
  return `${pick(ADJECTIVES)}-${pick(NOUNS)}-${Math.floor(Math.random() * 90 + 10)}`;
}

/** False when this IP has used up its share of `limiter`. Missing binding (e.g. tests) means no limit. */
async function allowed(limiter, request) {
  if (!limiter) return true;
  const ip = request.headers.get('CF-Connecting-IP') ?? 'unknown';
  const { success } = await limiter.limit({ key: ip });
  return success;
}

function tooMany() {
  return new Response('Too many prayers at once. Breathe, then try again.', {
    status: 429,
    headers: { 'Content-Type': 'text/plain', 'Retry-After': '60', 'Cache-Control': 'no-store', ...SECURITY_HEADERS },
  });
}

function json(data, init = {}) {
  return new Response(JSON.stringify(data, null, 2), {
    ...init,
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Cache-Control': 'no-store',
      'Access-Control-Allow-Origin': '*',
      ...SECURITY_HEADERS,
      ...(init.headers || {}),
    },
  });
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    if (!startedAt) startedAt = Date.now();

    if (url.pathname === '/api/health') {
      return new Response('om', { headers: { 'Content-Type': 'text/plain', ...SECURITY_HEADERS } });
    }

    if (url.pathname === '/api/status') {
      return json({
        status: 'meditating',
        mantra: MANTRAS[Math.floor(Math.random() * MANTRAS.length)],
        since: new Date(startedAt).toISOString(),
        colo: request.cf?.colo ?? null,
        country: request.cf?.country ?? null,
        namaste: true,
      });
    }

    if (url.pathname === '/new') {
      if (!(await allowed(env.NEW_ROOM_LIMIT, request))) return tooMany();
      return Response.redirect(`${url.origin}/r/${roomName()}${url.search}`, 302);
    }

    const ws = url.pathname.match(/^\/api\/rooms\/([^/]+)\/ws$/);
    if (ws) {
      const room = ws[1].toLowerCase();
      if (!ROOM_RE.test(room)) return json({ error: 'bad room name' }, { status: 400 });
      if (request.headers.get('Upgrade') !== 'websocket') return json({ error: 'expected a WebSocket' }, { status: 426 });
      if (!(await allowed(env.SOCKET_LIMIT, request))) return json({ error: 'too many connections' }, { status: 429 });
      return env.SHRINE.get(env.SHRINE.idFromName(room)).fetch(request);
    }

    // Only unknown /api/* paths get here: run_worker_first sends nothing else to the Worker.
    return json({ error: 'not found' }, { status: 404 });
  },
};
