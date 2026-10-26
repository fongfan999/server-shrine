/**
 * The server room, drawn procedurally as SVG with a simple perspective
 * projection: two walls of racks receding to a vanishing point, a back
 * wall of racks facing us, ceiling light strips, LED reflections on the
 * polished floor, and a few hundred LEDs that blink on their own.
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
const line = (a, b, attrs) => `<line x1="${a[0].toFixed(1)}" y1="${a[1].toFixed(1)}" x2="${b[0].toFixed(1)}" y2="${b[1].toFixed(1)}" ${attrs}/>`;

export function buildServerRoom(host) {
  const parts = [];
  const leds = [];

  parts.push(`<svg class="room" viewBox="0 0 ${VW} ${VH}" preserveAspectRatio="xMidYMid slice" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
  <defs>
    <linearGradient id="rFloor" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#0c1b2c"/>
      <stop offset="1" stop-color="#02050a"/>
    </linearGradient>
    <linearGradient id="rCeil" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#000"/>
      <stop offset="1" stop-color="#08121c"/>
    </linearGradient>
    <linearGradient id="rRackL" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0" stop-color="#162640"/>
      <stop offset="1" stop-color="#0b1626"/>
    </linearGradient>
    <linearGradient id="rRackR" x1="1" y1="0" x2="0" y2="0">
      <stop offset="0" stop-color="#162640"/>
      <stop offset="1" stop-color="#0b1626"/>
    </linearGradient>
    <radialGradient id="rVanish" cx="0.5" cy="0.5" r="0.5">
      <stop offset="0" stop-color="#4cbcff" stop-opacity="0.6"/>
      <stop offset="0.45" stop-color="#1b5a8a" stop-opacity="0.2"/>
      <stop offset="1" stop-color="#000" stop-opacity="0"/>
    </radialGradient>
    <linearGradient id="rReflect" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#3fb4ff" stop-opacity="0.4"/>
      <stop offset="1" stop-color="#3fb4ff" stop-opacity="0"/>
    </linearGradient>
    <linearGradient id="rFade" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#fff" stop-opacity="1"/>
      <stop offset="1" stop-color="#fff" stop-opacity="0"/>
    </linearGradient>
    <mask id="rFloorMask"><rect x="0" y="${CY}" width="${VW}" height="${VH - CY}" fill="url(#rFade)"/></mask>
    <filter id="rBlur"><feGaussianBlur stdDeviation="30"/></filter>
    <filter id="rSoft"><feGaussianBlur stdDeviation="6"/></filter>
    <filter id="rLed" x="-150%" y="-150%" width="400%" height="400%"><feGaussianBlur stdDeviation="1.2" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter>
    <filter id="rShaft" x="-20%" y="-20%" width="140%" height="140%"><feGaussianBlur stdDeviation="14"/></filter>
    <linearGradient id="rShaftG" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#9fdcff" stop-opacity="0.22"/>
      <stop offset="1" stop-color="#9fdcff" stop-opacity="0"/>
    </linearGradient>
    <linearGradient id="rMirror" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#fff" stop-opacity="0.9"/>
      <stop offset="1" stop-color="#fff" stop-opacity="0"/>
    </linearGradient>
    <mask id="rMirrorMask"><rect x="0" y="${CY}" width="${VW}" height="${VH - CY}" fill="url(#rMirror)"/></mask>
  </defs>`);

  // ceiling + floor
  const fl = [proj(-W, FLOOR, Z0 * 0.6), proj(W, FLOOR, Z0 * 0.6), proj(W, FLOOR, ZEND), proj(-W, FLOOR, ZEND)];
  const ce = [proj(-W, TOP, Z0 * 0.6), proj(W, TOP, Z0 * 0.6), proj(W, TOP, ZEND), proj(-W, TOP, ZEND)];
  parts.push(`<rect width="${VW}" height="${VH}" fill="#02050a"/>`);
  parts.push(`<polygon points="${pts(ce)}" fill="url(#rCeil)"/>`);
  parts.push(`<polygon points="${pts(fl)}" fill="url(#rFloor)"/>`);

  // vanishing glow
  const [vx, vy] = proj(0, (TOP + FLOOR) / 2, ZEND);
  parts.push(`<ellipse cx="${vx}" cy="${vy}" rx="440" ry="280" fill="url(#rVanish)" filter="url(#rBlur)"/>`);

  // floor reflection streak down the middle
  const rf = [proj(-0.9, FLOOR, ZEND), proj(0.9, FLOOR, ZEND), proj(1.6, FLOOR, Z0 * 0.6), proj(-1.6, FLOOR, Z0 * 0.6)];
  parts.push(`<polygon points="${pts(rf)}" fill="url(#rReflect)" opacity="0.5"/>`);

  // mirrored rack faces on the polished floor
  parts.push('<g class="rack-mirror" mask="url(#rMirrorMask)" opacity="0.28">');
  for (let i = RACKS - 1; i >= 0; i--) {
    const z0 = Z0 + i * (DEPTH + GAP); const z1 = z0 + DEPTH;
    for (const side of [-1, 1]) {
      const x = side * W;
      const q = [proj(x, 2 * FLOOR - TOP, z0), proj(x, 2 * FLOOR - TOP, z1), proj(x, FLOOR, z1), proj(x, FLOOR, z0)];
      parts.push(`<polygon points="${pts(q)}" fill="#1a2d47"/>`);
      parts.push(line(proj(x, FLOOR, z0), proj(x, 2 * FLOOR - TOP, z0), `stroke="#3fb4ff" stroke-opacity="0.5" stroke-width="${(2.2 / z0).toFixed(2)}"`));
    }
  }
  parts.push('</g>');

  // volumetric light shafts from the ceiling strips
  for (const x of [-1.25, 1.25]) {
    const q = [proj(x - 0.08, TOP, Z0 * 0.7), proj(x + 0.08, TOP, Z0 * 0.7), proj(x + 0.9, FLOOR, Z0 * 0.7), proj(x - 0.9, FLOOR, Z0 * 0.7)];
    parts.push(`<polygon points="${pts(q)}" fill="url(#rShaftG)" filter="url(#rShaft)"/>`);
  }

  // floor tile lines
  for (let z = Z0; z < ZEND; z += 0.6) {
    parts.push(line(proj(-W, FLOOR, z), proj(W, FLOOR, z), 'stroke="#1b2f45" stroke-opacity="0.4" stroke-width="1"'));
  }
  for (const x of [-1.5, -0.75, 0, 0.75, 1.5]) {
    parts.push(line(proj(x, FLOOR, Z0 * 0.6), proj(x, FLOOR, ZEND), 'stroke="#1b2f45" stroke-opacity="0.3" stroke-width="1"'));
  }

  // ceiling light strips
  for (const x of [-1.25, 1.25]) {
    parts.push(line(proj(x, TOP + 0.02, Z0 * 0.7), proj(x, TOP + 0.02, ZEND), 'stroke="#9fdcff" stroke-opacity="0.9" stroke-width="4" filter="url(#rSoft)"'));
    parts.push(line(proj(x, TOP + 0.02, Z0 * 0.7), proj(x, TOP + 0.02, ZEND), 'stroke="#e8f7ff" stroke-opacity="0.9" stroke-width="1.2"'));
  }

  // cable trays under the ceiling
  for (const x of [-1.85, 1.85]) {
    parts.push(line(proj(x, TOP + 0.12, Z0 * 0.7), proj(x, TOP + 0.12, ZEND), 'stroke="#1c2d44" stroke-width="7"'));
    parts.push(line(proj(x, TOP + 0.09, Z0 * 0.7), proj(x, TOP + 0.09, ZEND), 'stroke="#ff8a3c" stroke-opacity="0.55" stroke-width="1.4"'));
    parts.push(line(proj(x, TOP + 0.15, Z0 * 0.7), proj(x, TOP + 0.15, ZEND), 'stroke="#3fb4ff" stroke-opacity="0.45" stroke-width="1.2"'));
  }

  // back wall of racks (facing us)
  {
    const cols = 6; const cw = (2 * W) / cols;
    for (let c = 0; c < cols; c++) {
      const x0 = -W + c * cw + 0.03; const x1 = x0 + cw - 0.06;
      const q = [proj(x0, TOP, ZEND), proj(x1, TOP, ZEND), proj(x1, FLOOR, ZEND), proj(x0, FLOOR, ZEND)];
      parts.push(`<polygon points="${pts(q)}" fill="#0d1726" stroke="#1d3049" stroke-width="1"/>`);
      parts.push(`<polygon points="${pts(q)}" fill="#06101c" opacity="0.5"/>`);
      for (let y = TOP + 0.25; y < FLOOR - 0.2; y += 0.3) {
        for (let k = 0; k < 2; k++) {
          const [lx, ly] = proj(x0 + 0.16 + k * 0.2, y, ZEND);
          leds.push({ x: lx, y: ly, r: 1.9, wx: x0 + 0.16 + k * 0.2, wy: y, wz: ZEND });
        }
        parts.push(line(proj(x0 + 0.05, y + 0.14, ZEND), proj(x1 - 0.05, y + 0.14, ZEND), 'stroke="#1d3049" stroke-opacity="0.8" stroke-width="0.8"'));
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
      // server units: slightly lighter bands with a bezel line
      for (let y = TOP + 0.3; y < FLOOR - 0.15; y += 0.3) {
        const band = [proj(x, y - 0.26, z0 + 0.05), proj(x, y - 0.26, z1 - 0.05), proj(x, y - 0.04, z1 - 0.05), proj(x, y - 0.04, z0 + 0.05)];
        parts.push(`<polygon points="${pts(band)}" fill="#1a2d47" opacity="0.55"/>`);
        parts.push(line(proj(x, y, z0 + 0.04), proj(x, y, z1 - 0.04), `stroke="#223a57" stroke-opacity="0.8" stroke-width="${(1 / z0).toFixed(2)}"`));
        // drive bay ticks on the lower half of each unit
        for (let k = 0; k < 8; k++) {
          const z = z0 + 0.12 + k * ((DEPTH - 0.24) / 7);
          parts.push(line(proj(x, y - 0.13, z), proj(x, y - 0.06, z), `stroke="#0a1422" stroke-width="${(1.2 / z).toFixed(2)}"`));
        }
        // LEDs on the upper half
        const n = 5;
        for (let k = 0; k < n; k++) {
          const z = z0 + 0.2 + k * ((DEPTH - 0.4) / (n - 1));
          const [lx, ly] = proj(x - side * 0.02, y - 0.19, z);
          leds.push({ x: lx, y: ly, r: Math.max(1.4, 5 / z), wx: x - side * 0.02, wy: y - 0.19, wz: z });
        }
      }
      // door frame + handle
      const fr = [proj(x, TOP + 0.08, z0 + 0.06), proj(x, TOP + 0.08, z1 - 0.06), proj(x, FLOOR - 0.06, z1 - 0.06), proj(x, FLOOR - 0.06, z0 + 0.06)];
      parts.push(`<polygon points="${pts(fr)}" fill="none" stroke="#2a4260" stroke-width="${(1.4 / z0).toFixed(2)}"/>`);
      parts.push(line(proj(x, -0.6, z1 - 0.16), proj(x, 0.2, z1 - 0.16), `stroke="#8aa4c4" stroke-opacity="0.7" stroke-width="${(2.4 / z0).toFixed(2)}" stroke-linecap="round"`));
      // distance fog
      parts.push(`<polygon points="${pts(q)}" fill="#06101c" opacity="${(Math.min(0.75, (z0 / ZEND) * 0.85)).toFixed(2)}"/>`);
      // front-edge light bar
      parts.push(line(proj(x, TOP, z0), proj(x, FLOOR, z0), `stroke="#3fb4ff" stroke-opacity="0.6" stroke-width="${(2.2 / z0).toFixed(2)}" filter="url(#rLed)"`));
    }
  }

  // LED reflections on the floor (mirrored through the floor plane, fading with distance)
  parts.push('<g class="leds-reflect" mask="url(#rFloorMask)" opacity="0.45" filter="url(#rLed)">');
  for (const l of leds) {
    const [rx, ry] = proj(l.wx, 2 * FLOOR - l.wy, l.wz);
    if (ry > VH + 10) continue;
    const c = LED_COLORS[Math.floor(Math.random() * LED_COLORS.length)];
    parts.push(`<ellipse cx="${rx.toFixed(1)}" cy="${ry.toFixed(1)}" rx="${(l.r * 1.1).toFixed(2)}" ry="${(l.r * 2.2).toFixed(2)}" fill="${c}" opacity="0.6"/>`);
  }
  parts.push('</g>');

  // haze near the floor
  parts.push(`<rect x="0" y="${VH * 0.55}" width="${VW}" height="${VH * 0.45}" fill="url(#rCeil)" opacity="0.35" transform="translate(0,${VH}) scale(1,-1) translate(0,-${VH})"/>`);
  parts.push('</svg>');

  // The LEDs live in a second SVG on top. They blink all the time, and a repaint of
  // this layer costs only a few hundred circles, never the room's big blur filters.
  // The glow is a second, larger circle under each LED rather than a blur filter: a filter
  // over hundreds of circles would re-blur the whole screen on every blink.
  parts.push(`<svg class="room room--leds" viewBox="0 0 ${VW} ${VH}" preserveAspectRatio="xMidYMid slice" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">`);
  const colors = leds.map(() => LED_COLORS[Math.floor(Math.random() * LED_COLORS.length)]);
  parts.push('<g class="leds-halo" opacity="0.35">');
  leds.forEach((l, i) => parts.push(`<circle cx="${l.x.toFixed(1)}" cy="${l.y.toFixed(1)}" r="${(l.r * 2.4).toFixed(2)}" fill="${colors[i]}"/>`));
  parts.push('</g><g class="leds">');
  leds.forEach((l, i) => parts.push(`<circle cx="${l.x.toFixed(1)}" cy="${l.y.toFixed(1)}" r="${l.r.toFixed(2)}" fill="${colors[i]}" opacity="${(0.25 + Math.random() * 0.75).toFixed(2)}"/>`));
  parts.push('</g></svg>');

  host.innerHTML = parts.join('\n');

  // Blink: every tick, a handful of random LEDs change brightness. No tweens needed.
  const nodes = [...host.querySelectorAll('.leds circle')];
  let acc = 0;
  let lite = false;
  gsap.ticker.add((time, dt) => {
    acc += dt; // ms
    if (acc < (lite ? 300 : 150)) return;
    acc = 0;
    if (document.visibilityState !== 'visible') return;
    for (let i = 0; i < (lite ? 6 : 14); i++) {
      const n = nodes[(Math.random() * nodes.length) | 0];
      n.setAttribute('opacity', (Math.random() < 0.3 ? 0.1 : 0.4 + Math.random() * 0.6).toFixed(2));
    }
  });

  return {
    /** A ripple of activity across the room (e.g. when the bowl rings). */
    pulse() {
      gsap.fromTo(host.querySelector('.leds'), { opacity: 1.6 }, { opacity: 1, duration: 1.4, ease: 'power2.out' });
    },
    /** Lite mode: the LEDs blink less often (the glow filter is dropped in CSS). */
    setLite(on) { lite = on; },
  };
}
