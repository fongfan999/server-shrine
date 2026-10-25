/**
 * Cloudflare Worker.
 * - /api/status  → JSON status for anyone who wants to poll the meditation.
 * - /api/health  → 200 OK
 * - /new         → redirects to a freshly named prayer room
 * - /api/rooms/:room/ws → WebSocket into that room's Shrine Durable Object
 * - /r/:room     → the page itself (the client notices it is in a room)
 * - everything else → static assets from ./dist (built by Vite) with
 *   security + cache headers added.
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
      return Response.redirect(`${url.origin}/r/${roomName()}${url.search}`, 302);
    }

    const ws = url.pathname.match(/^\/api\/rooms\/([^/]+)\/ws$/);
    if (ws) {
      const room = ws[1].toLowerCase();
      if (!ROOM_RE.test(room)) return json({ error: 'bad room name' }, { status: 400 });
      if (request.headers.get('Upgrade') !== 'websocket') return json({ error: 'expected a WebSocket' }, { status: 426 });
      return env.SHRINE.get(env.SHRINE.idFromName(room)).fetch(request);
    }

    // Serve the static site (unknown paths such as /r/:room get index.html).
    const res = await env.ASSETS.fetch(request);
    const headers = new Headers(res.headers);
    for (const [k, v] of Object.entries(SECURITY_HEADERS)) headers.set(k, v);

    // Hashed Vite bundles can be cached forever; everything else briefly.
    if (/\/assets\/.*-[a-zA-Z0-9_-]{8,}\.(js|css)$/.test(url.pathname)) {
      headers.set('Cache-Control', 'public, max-age=31536000, immutable');
    } else if (/\.(png|jpg|svg|mp3|webp)$/.test(url.pathname)) {
      headers.set('Cache-Control', 'public, max-age=86400');
    } else {
      headers.set('Cache-Control', 'public, max-age=60');
    }

    return new Response(res.body, { status: res.status, statusText: res.statusText, headers });
  },
};
