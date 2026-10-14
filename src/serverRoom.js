/**
 * The server room, drawn procedurally as SVG with a simple perspective
 * projection: two walls of racks receding to a vanishing point, a back
 * wall of racks facing us, and a few hundred LEDs that blink on their own.
 */
import gsap from 'gsap';

const VW = 1600;
const VH = 900;
const CX = 800;
const CY = 420;
const F = 720;            // focal length
const W = 2.3;            // corridor half-width (world units)
const TOP = -2.6;         // rack top (y, world; negative is up)
const FLOOR = 1.35;       // floor level
const Z0 = 1.15;          // nearest z
const DEPTH = 1.7;        // rack depth along the corridor
const GAP = 0.12;
const RACKS = 7;
const ZEND = Z0 + RACKS * (DEPTH + GAP);

const LED_COLORS = ['#5fd3ff', '#5fd3ff', '#5fd3ff', '#7dffc8', '#7dffc8', '#ffd166', '#ff5d73', '#ffffff'];

const proj = (x, y, z) => [CX + (x * F) / z, CY + (y * F) / z];
const pts = (list) => list.map(([x, y]) => `${x.toFixed(1)},${y.toFixed(1)}`).join(' ');

export function buildServerRoom(host) {
  const parts = [];
  const leds = [];

  parts.push(`<svg class="room" viewBox="0 0 ${VW} ${VH}" preserveAspectRatio="xMidYMid slice" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
  <defs>
    <linearGradient id="rFloor" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#0b1826"/>
      <stop offset="1" stop-color="#03070c"/>
    </linearGradient>
    <linearGradient id="rCeil" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#000"/>
      <stop offset="1" stop-color="#071019"/>
    </linearGradient>
    <linearGradient id="rRackL" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0" stop-color="#15243a"/>
      <stop offset="1" stop-color="#0b1626"/>
    </linearGradient>
    <linearGradient id="rRackR" x1="1" y1="0" x2="0" y2="0">
      <stop offset="0" stop-color="#15243a"/>
      <stop offset="1" stop-color="#0b1626"/>
    </linearGradient>
    <radialGradient id="rVanish" cx="0.5" cy="0.5" r="0.5">
      <stop offset="0" stop-color="#3fb4ff" stop-opacity="0.55"/>
      <stop offset="0.5" stop-color="#1b5a8a" stop-opacity="0.18"/>
      <stop offset="1" stop-color="#000" stop-opacity="0"/>
    </radialGradient>
    <linearGradient id="rReflect" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#3fb4ff" stop-opacity="0.35"/>
      <stop offset="1" stop-color="#3fb4ff" stop-opacity="0"/>
    </linearGradient>
    <filter id="rBlur"><feGaussianBlur stdDeviation="30"/></filter>
    <filter id="rLed" x="-150%" y="-150%" width="400%" height="400%"><feGaussianBlur stdDeviation="1.2" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter>
  </defs>`);

  // ceiling + floor
  const fl = [proj(-W, FLOOR, Z0 * 0.6), proj(W, FLOOR, Z0 * 0.6), proj(W, FLOOR, ZEND), proj(-W, FLOOR, ZEND)];
  const ce = [proj(-W, TOP, Z0 * 0.6), proj(W, TOP, Z0 * 0.6), proj(W, TOP, ZEND), proj(-W, TOP, ZEND)];
  parts.push(`<rect width="${VW}" height="${VH}" fill="#02050a"/>`);
  parts.push(`<polygon points="${pts(ce)}" fill="url(#rCeil)"/>`);
  parts.push(`<polygon points="${pts(fl)}" fill="url(#rFloor)"/>`);

  // vanishing glow
  const [vx, vy] = proj(0, (TOP + FLOOR) / 2, ZEND);
  parts.push(`<ellipse cx="${vx}" cy="${vy}" rx="420" ry="260" fill="url(#rVanish)" filter="url(#rBlur)"/>`);

  // floor reflection streak down the middle
  const rf = [proj(-0.9, FLOOR, ZEND), proj(0.9, FLOOR, ZEND), proj(1.6, FLOOR, Z0 * 0.6), proj(-1.6, FLOOR, Z0 * 0.6)];
  parts.push(`<polygon points="${pts(rf)}" fill="url(#rReflect)" opacity="0.5"/>`);

  // floor tile lines
  for (let z = Z0; z < ZEND; z += 0.6) {
    const [x1, y1] = proj(-W, FLOOR, z); const [x2, y2] = proj(W, FLOOR, z);
    parts.push(`<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="#1b2f45" stroke-opacity="0.35" stroke-width="1"/>`);
  }

  // back wall of racks (facing us)
  {
    const cols = 6; const cw = (2 * W) / cols;
    for (let c = 0; c < cols; c++) {
      const x0 = -W + c * cw + 0.03; const x1 = x0 + cw - 0.06;
      const q = [proj(x0, TOP, ZEND), proj(x1, TOP, ZEND), proj(x1, FLOOR, ZEND), proj(x0, FLOOR, ZEND)];
      parts.push(`<polygon points="${pts(q)}" fill="#0d1726" stroke="#1d3049" stroke-width="1"/>`);
      for (let y = TOP + 0.25; y < FLOOR - 0.2; y += 0.3) {
        for (let k = 0; k < 2; k++) {
          const [lx, ly] = proj(x0 + 0.16 + k * 0.2, y, ZEND);
          leds.push({ x: lx, y: ly, r: 1.9, z: ZEND });
        }
        const [a1, b1] = proj(x0 + 0.05, y + 0.14, ZEND); const [a2, b2] = proj(x1 - 0.05, y + 0.14, ZEND);
        parts.push(`<line x1="${a1}" y1="${b1}" x2="${a2}" y2="${b2}" stroke="#1d3049" stroke-opacity="0.8" stroke-width="0.8"/>`);
      }
    }
  }

  // side walls of racks, far to near so nearer racks paint on top
  for (let i = RACKS - 1; i >= 0; i--) {
    const z0 = Z0 + i * (DEPTH + GAP); const z1 = z0 + DEPTH;
    for (const side of [-1, 1]) {
      const x = side * W;
      const q = [proj(x, TOP, z0), proj(x, TOP, z1), proj(x, FLOOR, z1), proj(x, FLOOR, z0)];
      parts.push(`<polygon points="${pts(q)}" fill="url(#${side < 0 ? 'rRackL' : 'rRackR'})" stroke="#1d3049" stroke-width="${(1.6 / z0).toFixed(2)}"/>`);
      // unit lines
      for (let y = TOP + 0.3; y < FLOOR - 0.15; y += 0.3) {
        const [a1, b1] = proj(x, y, z0 + 0.04); const [a2, b2] = proj(x, y, z1 - 0.04);
        parts.push(`<line x1="${a1}" y1="${b1}" x2="${a2}" y2="${b2}" stroke="#223a57" stroke-opacity="0.7" stroke-width="${(1 / z0).toFixed(2)}"/>`);
        // LEDs along this unit
        const n = 5;
        for (let k = 0; k < n; k++) {
          const z = z0 + 0.2 + k * ((DEPTH - 0.4) / (n - 1));
          const [lx, ly] = proj(x - side * 0.02, y - 0.15, z);
          leds.push({ x: lx, y: ly, r: Math.max(1.4, 5 / z), z });
        }
      }
      // door frame edge glow
      const [e1, f1] = proj(x, TOP, z0); const [e2, f2] = proj(x, FLOOR, z0);
      parts.push(`<line x1="${e1}" y1="${f1}" x2="${e2}" y2="${f2}" stroke="#3fb4ff" stroke-opacity="0.55" stroke-width="${(2.2 / z0).toFixed(2)}" filter="url(#rLed)"/>`);
    }
  }

  // LEDs
  parts.push('<g class="leds" filter="url(#rLed)">');
  for (const l of leds) {
    const c = LED_COLORS[Math.floor(Math.random() * LED_COLORS.length)];
    const o = (0.25 + Math.random() * 0.75).toFixed(2);
    parts.push(`<circle cx="${l.x.toFixed(1)}" cy="${l.y.toFixed(1)}" r="${l.r.toFixed(2)}" fill="${c}" opacity="${o}"/>`);
  }
  parts.push('</g>');

  // haze near the floor
  parts.push(`<rect x="0" y="${VH * 0.55}" width="${VW}" height="${VH * 0.45}" fill="url(#rCeil)" opacity="0.35" transform="translate(0,${VH}) scale(1,-1) translate(0,-${VH})"/>`);
  parts.push('</svg>');

  host.innerHTML = parts.join('\n');

  // Blink: every tick, a handful of random LEDs change brightness. No tweens needed.
  const nodes = [...host.querySelectorAll('.leds circle')];
  let acc = 0;
  const tick = (time, dt) => {
    acc += dt;
    if (acc < 0.09) return;
    acc = 0;
    if (document.visibilityState !== 'visible') return;
    for (let i = 0; i < 14; i++) {
      const n = nodes[(Math.random() * nodes.length) | 0];
      n.setAttribute('opacity', (Math.random() < 0.3 ? 0.1 : 0.4 + Math.random() * 0.6).toFixed(2));
    }
  };
  gsap.ticker.add(tick);

  return {
    /** A ripple of activity across the room (e.g. when the bowl rings). */
    pulse() {
      gsap.fromTo(host.querySelector('.leds'), { opacity: 1.6 }, { opacity: 1, duration: 1.4, ease: 'power2.out' });
    },
  };
}
