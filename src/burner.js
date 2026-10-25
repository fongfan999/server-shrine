/**
 * The altar: a bronze tripod censer on a lacquered table with a silk runner,
 * two red candles, room for offerings, and two devotees from the ops team
 * kneeling in front of it. Inline SVG so everything animates: the incense
 * sticks burn down, embers glow at the live tip, candle flames flicker, the
 * devotees bow, offerings pop onto the table.
 */
import gsap from 'gsap';

const CX = 260;
const RIM_Y = 236;
const STICK_BOTTOM = RIM_Y + 2;
const STICK_W = 5;
const STICKS = [
  { x: CX - 22, top: 30, lean: -2.2 },
  { x: CX, top: 16, lean: 0 },
  { x: CX + 22, top: 36, lean: 2.2 },
];
const CANDLES = [{ x: 96 }, { x: 424 }];
const TABLE_Y = 398;
const SLOTS = [148, 186, 334, 372]; // x positions for offerings on the table

/* ---------- offerings: small vector icons, drawn with their base at (0,0) ---------- */
export const OFFERINGS = {
  energy: {
    label: 'an energy drink',
    svg: `<rect x="-8" y="-34" width="16" height="34" rx="3" fill="#1d2a3d"/><rect x="-8" y="-34" width="16" height="4" fill="#9fb3c8"/><rect x="-8" y="-22" width="16" height="9" fill="#2bb7ff"/><path d="M-2 -21 l4 -0 l-2 4 l3 0 l-5 6 l1 -4 l-3 0 z" fill="#ffd34d"/><rect x="-6" y="-33" width="3" height="30" fill="#fff" opacity="0.12"/>`,
  },
  noodles: {
    label: 'a cup of instant noodles',
    svg: `<path d="M-13 -30 L13 -30 L10 0 L-10 0 Z" fill="#f4efe6"/><path d="M-13 -30 L13 -30 L12 -22 L-12 -22 Z" fill="#d8202e"/><ellipse cx="0" cy="-30" rx="13" ry="3.5" fill="#fff"/><path d="M-6 -16 h12 M-5 -10 h10" stroke="#d8202e" stroke-width="1.5"/>`,
  },
  duck: {
    label: 'a rubber duck',
    svg: `<ellipse cx="0" cy="-9" rx="13" ry="9" fill="#ffd21f"/><circle cx="7" cy="-20" r="7.5" fill="#ffd21f"/><path d="M13 -20 l8 2 l-8 3 z" fill="#ff8a1f"/><circle cx="9" cy="-22" r="1.4" fill="#1a1206"/><path d="M-12 -12 q-5 -4 -2 -8" stroke="#ffd21f" stroke-width="4" fill="none" stroke-linecap="round"/>`,
  },
  coffee: {
    label: 'a cup of coffee',
    svg: `<path d="M-10 -22 L10 -22 L8 0 L-8 0 Z" fill="#f4efe6"/><path d="M10 -18 q8 0 6 8 q-2 6 -8 5" stroke="#f4efe6" stroke-width="3" fill="none"/><path d="M-10 -22 L10 -22 L9.5 -17 L-9.5 -17 Z" fill="#6b3a1e"/><path d="M-3 -28 q2 -4 0 -8 M3 -28 q2 -4 0 -8" stroke="#fff" stroke-opacity="0.5" stroke-width="1.5" fill="none" stroke-linecap="round"/>`,
  },
  keyboard: {
    label: 'a mechanical keyboard',
    svg: `<rect x="-22" y="-10" width="44" height="10" rx="2" fill="#2b2f3a"/><g fill="#8a93a6">${[...Array(8)].map((_, i) => `<rect x="${-19 + i * 5}" y="-8" width="3" height="2.4" rx="0.5"/>`).join('')}${[...Array(8)].map((_, i) => `<rect x="${-19 + i * 5}" y="-4.5" width="3" height="2.4" rx="0.5"/>`).join('')}</g><rect x="-6" y="-8" width="3" height="2.4" rx="0.5" fill="#3fb4ff"/>`,
  },
  usb: {
    label: 'a USB stick with the backups',
    svg: `<rect x="-5" y="-24" width="10" height="20" rx="2" fill="#2d6cdf"/><rect x="-4" y="-30" width="8" height="7" fill="#c7ced9"/><rect x="-2.5" y="-29" width="5" height="1.5" fill="#55606e"/><rect x="-2.5" y="-26" width="5" height="1.5" fill="#55606e"/><circle cx="0" cy="-12" r="1.6" fill="#9ad0ff"/>`,
  },
  laptop: {
    label: 'a laptop covered in stickers',
    svg: `<rect x="-18" y="-24" width="36" height="22" rx="2" fill="#2b2f3a"/><rect x="-16" y="-22" width="32" height="18" fill="#0f141c"/><rect x="-20" y="-3" width="40" height="3" rx="1" fill="#3a3f4b"/><circle cx="-8" cy="-12" r="3" fill="#ff5d73"/><rect x="2" y="-16" width="7" height="7" rx="1" fill="#7dffc8" transform="rotate(15 5 -12)"/><circle cx="8" cy="-8" r="2" fill="#ffd166"/>`,
  },
};

export function buildBurner(host) {
  host.innerHTML = `
<svg class="burner__svg" viewBox="0 0 520 470" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
  <defs>
    <radialGradient id="bGold" cx="0.36" cy="0.26" r="0.82">
      <stop offset="0" stop-color="#fff1b8"/>
      <stop offset="0.28" stop-color="#e6b84f"/>
      <stop offset="0.62" stop-color="#9c6a1e"/>
      <stop offset="0.86" stop-color="#4a2d07"/>
      <stop offset="1" stop-color="#2a1803"/>
    </radialGradient>
    <linearGradient id="bGoldLine" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="#f8e2a0"/>
      <stop offset="0.5" stop-color="#c9962b"/>
      <stop offset="1" stop-color="#4e3006"/>
    </linearGradient>
    <linearGradient id="bRim" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#fff8d8"/>
      <stop offset="0.45" stop-color="#e0b44c"/>
      <stop offset="1" stop-color="#5e3d0a"/>
    </linearGradient>
    <linearGradient id="bInner" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#140d04"/>
      <stop offset="1" stop-color="#3f2b10"/>
    </linearGradient>
    <radialGradient id="bAsh" cx="0.5" cy="0.35" r="0.65">
      <stop offset="0" stop-color="#c4b9a6"/>
      <stop offset="1" stop-color="#6a6052"/>
    </radialGradient>
    <linearGradient id="bStick" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0" stop-color="#7d4a2a"/>
      <stop offset="0.45" stop-color="#c98a5c"/>
      <stop offset="1" stop-color="#6b3f22"/>
    </linearGradient>
    <linearGradient id="bShine" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0" stop-color="#fff" stop-opacity="0"/>
      <stop offset="0.5" stop-color="#fff" stop-opacity="0.5"/>
      <stop offset="1" stop-color="#fff" stop-opacity="0"/>
    </linearGradient>
    <linearGradient id="bWood" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#4a2412"/>
      <stop offset="0.5" stop-color="#2a1208"/>
      <stop offset="1" stop-color="#140804"/>
    </linearGradient>
    <linearGradient id="bSilk" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0" stop-color="#5a0d18"/>
      <stop offset="0.35" stop-color="#9a1b2b"/>
      <stop offset="0.6" stop-color="#7a1221"/>
      <stop offset="1" stop-color="#430913"/>
    </linearGradient>
    <linearGradient id="bCandle" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0" stop-color="#7a0f1c"/>
      <stop offset="0.4" stop-color="#c8273a"/>
      <stop offset="1" stop-color="#5c0b16"/>
    </linearGradient>
    <radialGradient id="bFlame" cx="0.5" cy="0.75" r="0.6">
      <stop offset="0" stop-color="#ffffff"/>
      <stop offset="0.25" stop-color="#ffe9a8"/>
      <stop offset="0.6" stop-color="#ff9a2e"/>
      <stop offset="1" stop-color="#ff5a1a" stop-opacity="0"/>
    </radialGradient>
    <linearGradient id="bBody" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0" stop-color="#05070b"/>
      <stop offset="0.5" stop-color="#0d1118"/>
      <stop offset="1" stop-color="#05070b"/>
    </linearGradient>
    <pattern id="bFret" width="16" height="12" patternUnits="userSpaceOnUse">
      <path d="M0 10 V2 H10 V6 H5 V4 M12 2 H16" fill="none" stroke="#3a2608" stroke-opacity="0.7" stroke-width="1.6"/>
    </pattern>
    <filter id="bGlow" x="-300%" y="-300%" width="700%" height="700%">
      <feGaussianBlur stdDeviation="4" result="b"/>
      <feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge>
    </filter>
    <filter id="bFlameGlow" x="-200%" y="-100%" width="500%" height="300%">
      <feGaussianBlur stdDeviation="5" result="b"/>
      <feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge>
    </filter>
    <filter id="bSoft" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="8"/></filter>
    <filter id="bSofter" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="16"/></filter>
    <clipPath id="bBodyClip">
      <path d="M 150 ${RIM_Y + 4} C 112 322, 168 380, 260 380 C 352 380, 408 322, 370 ${RIM_Y + 4} Z"/>
    </clipPath>
  </defs>

  <!-- table -->
  <g class="altar-table">
    <ellipse cx="260" cy="440" rx="250" ry="16" fill="#000" opacity="0.6" filter="url(#bSofter)"/>
    <rect x="22" y="${TABLE_Y}" width="476" height="18" rx="4" fill="url(#bWood)"/>
    <rect x="22" y="${TABLE_Y}" width="476" height="3" fill="#c9962b" opacity="0.55"/>
    <rect x="40" y="416" width="18" height="34" rx="3" fill="#1c0c05"/>
    <rect x="462" y="416" width="18" height="34" rx="3" fill="#1c0c05"/>
    <rect x="30" y="414" width="460" height="6" rx="2" fill="#0d0603"/>
    <path d="M 150 ${TABLE_Y} L 370 ${TABLE_Y} L 384 428 Q 260 444 136 428 Z" fill="url(#bSilk)"/>
    <path d="M 150 ${TABLE_Y} L 370 ${TABLE_Y} L 384 428 Q 260 444 136 428 Z" fill="none" stroke="#e2b655" stroke-opacity="0.55" stroke-width="1.5"/>
    <path d="M 160 404 L 360 404" stroke="#e2b655" stroke-opacity="0.35" stroke-width="1"/>
  </g>

  <!-- candles -->
  ${CANDLES.map((c, i) => `
  <g class="candle" data-i="${i}">
    <ellipse cx="${c.x}" cy="${TABLE_Y}" rx="16" ry="5" fill="#000" opacity="0.45" filter="url(#bSoft)"/>
    <ellipse cx="${c.x}" cy="396" rx="20" ry="6" fill="url(#bGoldLine)"/>
    <rect x="${c.x - 11}" y="322" width="22" height="74" rx="3" fill="url(#bCandle)"/>
    <rect x="${c.x - 11}" y="352" width="22" height="4" fill="#e2b655" opacity="0.8"/>
    <rect x="${c.x - 11}" y="368" width="22" height="2" fill="#e2b655" opacity="0.5"/>
    <ellipse cx="${c.x}" cy="322" rx="11" ry="3.5" fill="#e04a5a"/>
    <rect x="${c.x - 1}" y="310" width="2" height="12" fill="#2a1408"/>
    <g class="flame" style="transform-origin: ${c.x}px 320px" opacity="0">
      <ellipse cx="${c.x}" cy="306" rx="12" ry="20" fill="#ff8a2a" opacity="0.35" filter="url(#bFlameGlow)"/>
      <path d="M ${c.x} 288 C ${c.x + 7} 298, ${c.x + 8} 310, ${c.x} 318 C ${c.x - 8} 310, ${c.x - 7} 298, ${c.x} 288 Z" fill="url(#bFlame)"/>
    </g>
  </g>`).join('')}

  <!-- offerings land here -->
  <g class="offerings"></g>

  <!-- censer shadow on the runner -->
  <ellipse cx="260" cy="400" rx="110" ry="12" fill="#000" opacity="0.6" filter="url(#bSoft)"/>

  <!-- legs -->
  <g stroke="url(#bGoldLine)" stroke-width="16" stroke-linecap="round" fill="none">
    <path d="M 186 358 C 164 374, 162 390, 176 400"/>
    <path d="M 334 358 C 356 374, 358 390, 344 400"/>
    <path d="M 260 374 C 258 386, 258 394, 260 402"/>
  </g>
  <g fill="#3a2305">
    <ellipse cx="176" cy="402" rx="12" ry="5"/>
    <ellipse cx="344" cy="402" rx="12" ry="5"/>
    <ellipse cx="260" cy="404" rx="12" ry="5"/>
  </g>

  <!-- belly -->
  <path d="M 150 ${RIM_Y + 4} C 112 322, 168 380, 260 380 C 352 380, 408 322, 370 ${RIM_Y + 4} Z" fill="url(#bGold)"/>
  <g clip-path="url(#bBodyClip)">
    <ellipse cx="208" cy="268" rx="46" ry="54" fill="#fff" opacity="0.2" filter="url(#bSoft)"/>
    <ellipse cx="196" cy="256" rx="12" ry="20" fill="#fff" opacity="0.5" filter="url(#bSoft)"/>
    <ellipse cx="260" cy="392" rx="140" ry="50" fill="#120a01" opacity="0.8" filter="url(#bSoft)"/>
    <ellipse cx="392" cy="300" rx="24" ry="76" fill="#3fb4ff" opacity="0.14" filter="url(#bSoft)"/>
    <ellipse cx="130" cy="310" rx="18" ry="70" fill="#3fb4ff" opacity="0.08" filter="url(#bSoft)"/>
    <path d="M 118 290 Q 260 334 402 290 L 402 306 Q 260 350 118 306 Z" fill="url(#bFret)" opacity="0.9"/>
    <path d="M 118 290 Q 260 334 402 290" stroke="#2a1803" stroke-opacity="0.5" stroke-width="1.5" fill="none"/>
    <path d="M 118 306 Q 260 350 402 306" stroke="#2a1803" stroke-opacity="0.5" stroke-width="1.5" fill="none"/>
    <path d="M 118 287 Q 260 331 402 287" stroke="#fff" stroke-opacity="0.18" stroke-width="1" fill="none"/>
    <g stroke="#2e1c05" stroke-opacity="0.6" stroke-width="2" fill="none" stroke-linecap="round">
      <path d="M 208 326 c 6 -10 18 -10 22 0 c 8 -8 20 -2 18 8 c 8 2 8 12 0 14 h -40 c -10 0 -10 -14 0 -22 z"/>
      <path d="M 276 326 c 6 -10 18 -10 22 0 c 8 -8 20 -2 18 8 c 8 2 8 12 0 14 h -40 c -10 0 -10 -14 0 -22 z"/>
    </g>
    <rect class="burner__shine" x="-140" y="220" width="90" height="190" fill="url(#bShine)" opacity="0.32" transform="skewX(-18)"/>
  </g>

  <!-- rim -->
  <ellipse cx="260" cy="${RIM_Y}" rx="124" ry="29" fill="url(#bRim)"/>
  <ellipse cx="260" cy="${RIM_Y}" rx="124" ry="29" fill="none" stroke="#4a2e07" stroke-opacity="0.55" stroke-width="1.5"/>
  <ellipse cx="260" cy="${RIM_Y - 3}" rx="124" ry="29" fill="none" stroke="#fff" stroke-opacity="0.35" stroke-width="1.2"/>
  <ellipse cx="260" cy="${RIM_Y - 1}" rx="102" ry="20" fill="url(#bInner)"/>
  <ellipse cx="260" cy="${RIM_Y + 1}" rx="90" ry="13" fill="url(#bAsh)"/>

  <!-- ears -->
  <g stroke="url(#bGoldLine)" stroke-width="12" stroke-linecap="round" fill="none">
    <path d="M 150 ${RIM_Y - 4} C 138 200, 176 194, 180 ${RIM_Y - 8}"/>
    <path d="M 370 ${RIM_Y - 4} C 382 200, 344 194, 340 ${RIM_Y - 8}"/>
  </g>
  <g stroke="#fff" stroke-opacity="0.3" stroke-width="2.5" stroke-linecap="round" fill="none">
    <path d="M 150 ${RIM_Y - 6} C 138 198, 176 192, 180 ${RIM_Y - 10}"/>
    <path d="M 370 ${RIM_Y - 6} C 382 198, 344 192, 340 ${RIM_Y - 10}"/>
  </g>

  <!-- sticks -->
  <g class="burner__sticks">
    ${STICKS.map((s, i) => `
    <g class="stick" data-i="${i}" transform="rotate(${s.lean} ${s.x} ${STICK_BOTTOM})">
      <rect class="stick__body" x="${s.x - STICK_W / 2}" y="${s.top}" width="${STICK_W}" height="${STICK_BOTTOM - s.top}" rx="2" fill="url(#bStick)"/>
      <rect class="stick__ash" x="${s.x - STICK_W / 2 - 0.5}" y="${s.top}" width="${STICK_W + 1}" height="0" rx="2.5" fill="#a9a29a"/>
      <circle class="stick__halo" cx="${s.x}" cy="${s.top}" r="10" fill="#ff7a1a" opacity="0" filter="url(#bSoft)"/>
      <circle class="stick__ember" cx="${s.x}" cy="${s.top}" r="4" fill="#fff0c0" filter="url(#bGlow)" opacity="0"/>
    </g>`).join('')}
  </g>

  <!-- the ops team, kneeling, backs to us, incense raised -->
  ${[{ x: 34, s: 1.18, flip: 1 }, { x: 486, s: 1.18, flip: -1 }].map((d, i) => `
  <g class="devotee" data-i="${i}" transform="translate(${d.x} 470) scale(${d.flip * d.s} ${d.s})">
    <ellipse cx="0" cy="-2" rx="34" ry="7" fill="#000" opacity="0.5" filter="url(#bSoft)"/>
    <!-- legs folded under -->
    <path d="M -30 0 Q -32 -24 -12 -30 L 14 -30 Q 32 -24 30 0 Z" fill="#06080c"/>
    <path d="M -30 0 Q -32 -24 -12 -30" stroke="#3fb4ff" stroke-opacity="0.18" stroke-width="2" fill="none"/>
    <g class="devotee__upper" style="transform-origin: 0px -30px">
      <!-- torso -->
      <path d="M -22 -30 L -24 -92 Q 0 -104 24 -92 L 22 -30 Z" fill="url(#bBody)"/>
      <path d="M -24 -92 Q 0 -104 24 -92" stroke="#3fb4ff" stroke-opacity="0.35" stroke-width="2" fill="none"/>
      <path d="M -22 -30 L -24 -92" stroke="#3fb4ff" stroke-opacity="0.12" stroke-width="2" fill="none"/>
      <!-- arms up, palms together -->
      <path d="M -20 -86 Q -30 -118 -8 -140 L 0 -146" stroke="#06080c" stroke-width="11" stroke-linecap="round" fill="none"/>
      <path d="M 20 -86 Q 30 -118 8 -140 L 0 -146" stroke="#06080c" stroke-width="11" stroke-linecap="round" fill="none"/>
      <path d="M -8 -140 L 0 -146" stroke="#3fb4ff" stroke-opacity="0.25" stroke-width="2" fill="none"/>
      <!-- head -->
      <circle cx="0" cy="-110" r="15" fill="#06080c"/>
      <path d="M -13 -116 Q 0 -128 13 -116" stroke="#3fb4ff" stroke-opacity="0.3" stroke-width="2" fill="none"/>
      <!-- incense held in the hands -->
      <rect x="-1.2" y="-182" width="2.4" height="38" fill="#b57a50"/>
      <circle class="devotee__ember" cx="0" cy="-182" r="2.6" fill="#fff0c0" filter="url(#bGlow)" opacity="0"/>
    </g>
  </g>`).join('')}
</svg>`;

  const svg = host.querySelector('svg');
  const sticks = [...svg.querySelectorAll('.stick')].map((g, i) => ({
    g,
    body: g.querySelector('.stick__body'),
    ash: g.querySelector('.stick__ash'),
    ember: g.querySelector('.stick__ember'),
    halo: g.querySelector('.stick__halo'),
    top: STICKS[i].top,
  }));
  const flames = [...svg.querySelectorAll('.flame')];
  const devotees = [...svg.querySelectorAll('.devotee__upper')];
  const devoteeEmbers = [...svg.querySelectorAll('.devotee__ember')];
  const offeringsG = svg.querySelector('.offerings');
  const offerings = []; // { el, slot }

  gsap.to(svg.querySelector('.burner__shine'), {
    attr: { x: 560 }, duration: 8, repeat: -1, repeatDelay: 6, ease: 'sine.inOut',
  });

  // the devotees sway almost imperceptibly while they wait
  devotees.forEach((d, i) => {
    gsap.to(d, { rotation: i ? -1.5 : 1.5, duration: 3.4, yoyo: true, repeat: -1, ease: 'sine.inOut', delay: i * 0.7 });
  });

  let burnTl = null;

  return {
    svg,
    /** Screen-space centres of the live ember tips (for the smoke emitters). */
    tips() {
      return sticks.map((s) => {
        const r = s.ember.getBoundingClientRect();
        return { x: r.left + r.width / 2, y: r.top + r.height / 2 };
      });
    },

    /** Light up: candles catch, embers glow, sticks burn down over `seconds`. */
    light(seconds = 600) {
      burnTl?.kill();
      burnTl = gsap.timeline();
      flames.forEach((f, i) => {
        burnTl.to(f, { opacity: 1, duration: 0.5, ease: 'power2.out' }, 0.1 + i * 0.25);
        gsap.to(f, {
          scaleY: () => gsap.utils.random(0.85, 1.15),
          scaleX: () => gsap.utils.random(0.9, 1.1),
          rotation: () => gsap.utils.random(-5, 5),
          duration: 0.18, repeat: -1, repeatRefresh: true, ease: 'sine.inOut',
        });
      });
      burnTl.to(devoteeEmbers, { opacity: 1, duration: 0.6, stagger: 0.2 }, 0.8);
      devoteeEmbers.forEach((e, i) => gsap.to(e, { opacity: 0.5, duration: 0.6, yoyo: true, repeat: -1, ease: 'sine.inOut', delay: 1.5 + i * 0.3 }));
      sticks.forEach((s, i) => {
        const burnTo = STICK_BOTTOM - 50 - i * 6;
        burnTl
          .fromTo(s.ember, { opacity: 0, attr: { r: 0 } }, { opacity: 1, attr: { r: 4 }, duration: 0.5, ease: 'back.out(3)' }, 0.5 + i * 0.18)
          .to(s.halo, { opacity: 0.6, duration: 0.8 }, 0.55 + i * 0.18)
          .to(s.halo, { attr: { cy: burnTo }, duration: seconds, ease: 'none' }, 1)
          .to(s.body, { attr: { y: burnTo, height: STICK_BOTTOM - burnTo }, duration: seconds, ease: 'none' }, 1)
          .to(s.ember, { attr: { cy: burnTo }, duration: seconds, ease: 'none' }, 1)
          .to(s.ash, { attr: { y: burnTo - 10, height: 10 }, duration: seconds, ease: 'none' }, 1);
        gsap.to(s.ember, { opacity: 0.55, duration: gsap.utils.random(0.4, 0.8), yoyo: true, repeat: -1, ease: 'sine.inOut', delay: 1 + i * 0.3 });
        gsap.to(s.halo, { opacity: 0.3, duration: gsap.utils.random(0.5, 1), yoyo: true, repeat: -1, ease: 'sine.inOut', delay: 1.2 + i * 0.3 });
      });
    },

    /** Jump the burn to `elapsed` seconds in (late joiners, or a tab that was asleep). */
    syncBurn(elapsed) {
      burnTl?.time(Math.max(0, elapsed));
    },

    /** Burned out: embers and candles fade, ash falls, fresh sticks appear. */
    extinguish() {
      burnTl?.kill();
      const tl = gsap.timeline();
      flames.forEach((f) => { gsap.killTweensOf(f); tl.to(f, { opacity: 0, duration: 1 }, 0); });
      devoteeEmbers.forEach((e) => { gsap.killTweensOf(e); tl.to(e, { opacity: 0, duration: 1 }, 0); });
      sticks.forEach((s, i) => {
        gsap.killTweensOf([s.ember, s.halo]);
        tl.to([s.ember, s.halo], { opacity: 0, duration: 0.8 }, 0)
          .to(s.ash, { attr: { y: STICK_BOTTOM, height: 0 }, duration: 0.6, ease: 'power2.in' }, 0.2)
          .to(s.body, { attr: { y: s.top, height: STICK_BOTTOM - s.top }, duration: 1.2, ease: 'power3.out' }, 1 + i * 0.1)
          .set([s.ember, s.halo], { attr: { cy: s.top } }, 1);
      });
      return tl;
    },

    /** The ops team bows to the rack. Returns the timeline. */
    bow(times = 1) {
      const tl = gsap.timeline();
      devotees.forEach((d, i) => {
        gsap.killTweensOf(d, 'rotation');
        const t = gsap.timeline({ repeat: times - 1 });
        t.to(d, { scaleY: 0.5, y: 4, duration: 0.55, ease: 'power2.inOut' })
          .to(d, { scaleY: 1, y: 0, duration: 0.8, ease: 'power2.inOut' }, '+=0.25');
        tl.add(t, i * 0.12);
      });
      tl.call(() => devotees.forEach((d, i) => gsap.to(d, { rotation: i ? -1.5 : 1.5, duration: 3.4, yoyo: true, repeat: -1, ease: 'sine.inOut' })));
      return tl;
    },

    /** Place an offering on the table. Returns its label. */
    offer(kind) {
      const def = OFFERINGS[kind];
      if (!def) return null;
      // free slot, or recycle the oldest
      let slot = SLOTS.findIndex((_, i) => !offerings.some((o) => o.slot === i));
      if (slot === -1) {
        const old = offerings.shift();
        slot = old.slot;
        gsap.to(old.el, { opacity: 0, y: -10, duration: 0.4, onComplete: () => old.el.remove() });
      }
      const el = document.createElementNS('http://www.w3.org/2000/svg', 'g');
      el.setAttribute('class', 'offering');
      el.innerHTML = `<ellipse cx="0" cy="0" rx="16" ry="4" fill="#000" opacity="0.5" filter="url(#bSoft)"/>${def.svg}`;
      el.style.transformOrigin = `${SLOTS[slot]}px ${TABLE_Y}px`;
      gsap.set(el, { x: SLOTS[slot], y: TABLE_Y, scale: 1.3 });
      offeringsG.appendChild(el);
      offerings.push({ el, slot });
      gsap.fromTo(el, { scale: 0, y: TABLE_Y - 40, opacity: 0 }, { scale: 1.3, y: TABLE_Y, opacity: 1, duration: 0.9, ease: 'elastic.out(1, 0.55)' });
      return def.label;
    },
  };
}
