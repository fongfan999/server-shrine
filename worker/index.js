/**
 * Cloudflare Worker.
 * - /api/status  → JSON status for anyone who wants to poll the meditation.
 * - /api/health  → 200 OK
 * - everything else → static assets from ./dist (built by Vite) with
 *   security + cache headers added.
 */

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

    // Serve the static site.
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
