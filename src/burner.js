/**
 * The incense burner, drawn as inline SVG so every part can be animated:
 * the sticks shorten as they burn, the embers glow at the live tip,
 * and the bronze catches a slow highlight sweep.
 */
import gsap from 'gsap';

const STICKS = [
  { x: 171, top: 18, lean: -2.5 },
  { x: 190, top: 8, lean: 0 },
  { x: 209, top: 22, lean: 2.5 },
];
const STICK_BOTTOM = 214; // where the sticks sink into the ash
const STICK_W = 5;

export function buildBurner(host) {
  host.innerHTML = `
<svg class="burner__svg" viewBox="0 0 380 420" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
  <defs>
    <radialGradient id="bGold" cx="0.36" cy="0.28" r="0.8">
      <stop offset="0" stop-color="#ffefb3"/>
      <stop offset="0.3" stop-color="#e2b24a"/>
      <stop offset="0.65" stop-color="#9a661c"/>
      <stop offset="1" stop-color="#3a2305"/>
    </radialGradient>
    <linearGradient id="bGoldLine" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="#f6dc8c"/>
      <stop offset="0.5" stop-color="#c9962b"/>
      <stop offset="1" stop-color="#5a3808"/>
    </linearGradient>
    <linearGradient id="bRim" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#fff6d0"/>
      <stop offset="0.5" stop-color="#dcb04a"/>
      <stop offset="1" stop-color="#6e480e"/>
    </linearGradient>
    <linearGradient id="bInner" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#1f1508"/>
      <stop offset="1" stop-color="#4a3414"/>
    </linearGradient>
    <radialGradient id="bAsh" cx="0.5" cy="0.4" r="0.6">
      <stop offset="0" stop-color="#b9ae9c"/>
      <stop offset="1" stop-color="#6f6555"/>
    </radialGradient>
    <linearGradient id="bStick" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0" stop-color="#8e5a3a"/>
      <stop offset="0.5" stop-color="#c98a5c"/>
      <stop offset="1" stop-color="#7a4a2c"/>
    </linearGradient>
    <linearGradient id="bShine" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0" stop-color="#fff" stop-opacity="0"/>
      <stop offset="0.5" stop-color="#fff" stop-opacity="0.55"/>
      <stop offset="1" stop-color="#fff" stop-opacity="0"/>
    </linearGradient>
    <filter id="bGlow" x="-300%" y="-300%" width="700%" height="700%">
      <feGaussianBlur stdDeviation="4" result="b"/>
      <feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge>
    </filter>
    <filter id="bSoft" x="-50%" y="-50%" width="200%" height="200%">
      <feGaussianBlur stdDeviation="8"/>
    </filter>
    <clipPath id="bBodyClip">
      <path d="M 84 214 C 60 300, 112 358, 190 358 C 268 358, 320 300, 296 214 Z"/>
    </clipPath>
  </defs>

  <!-- ground shadow -->
  <ellipse cx="190" cy="396" rx="135" ry="14" fill="#000" opacity="0.55" filter="url(#bSoft)"/>

  <!-- legs -->
  <g class="burner__legs">
    <path d="M 118 352 C 110 366, 108 378, 112 390" stroke="url(#bGoldLine)" stroke-width="14" stroke-linecap="round" fill="none"/>
    <path d="M 262 352 C 270 366, 272 378, 268 390" stroke="url(#bGoldLine)" stroke-width="14" stroke-linecap="round" fill="none"/>
    <path d="M 190 360 C 190 372, 190 382, 190 394" stroke="url(#bGoldLine)" stroke-width="14" stroke-linecap="round" fill="none"/>
    <ellipse cx="112" cy="392" rx="12" ry="6" fill="#5a3a0a"/>
    <ellipse cx="268" cy="392" rx="12" ry="6" fill="#5a3a0a"/>
    <ellipse cx="190" cy="396" rx="12" ry="6" fill="#5a3a0a"/>
  </g>

  <!-- handles -->
  <path d="M 90 228 C 36 214, 30 282, 86 270" stroke="url(#bGoldLine)" stroke-width="13" stroke-linecap="round" fill="none"/>
  <path d="M 290 228 C 344 214, 350 282, 294 270" stroke="url(#bGoldLine)" stroke-width="13" stroke-linecap="round" fill="none"/>
  <path d="M 90 228 C 36 214, 30 282, 86 270" stroke="#fff" stroke-opacity="0.25" stroke-width="3" stroke-linecap="round" fill="none" transform="translate(0,-3)"/>
  <path d="M 290 228 C 344 214, 350 282, 294 270" stroke="#fff" stroke-opacity="0.25" stroke-width="3" stroke-linecap="round" fill="none" transform="translate(0,-3)"/>

  <!-- belly -->
  <path d="M 84 214 C 60 300, 112 358, 190 358 C 268 358, 320 300, 296 214 Z" fill="url(#bGold)"/>
  <g clip-path="url(#bBodyClip)">
    <ellipse cx="146" cy="252" rx="40" ry="56" fill="#fff" opacity="0.22" filter="url(#bSoft)"/>
    <ellipse cx="190" cy="372" rx="130" ry="46" fill="#1a0f02" opacity="0.75" filter="url(#bSoft)"/>
    <ellipse cx="300" cy="300" rx="22" ry="70" fill="#000" opacity="0.25" filter="url(#bSoft)"/>
    <path d="M 70 300 Q 190 330 310 300" stroke="#000" stroke-opacity="0.28" stroke-width="2.5" fill="none"/>
    <path d="M 74 288 Q 190 316 306 288" stroke="#fff" stroke-opacity="0.18" stroke-width="1.5" fill="none"/>
    <!-- engraved cloud motif -->
    <g stroke="#3a2608" stroke-opacity="0.55" stroke-width="2" fill="none" stroke-linecap="round">
      <path d="M 150 262 c 6 -10 18 -10 22 0 c 8 -8 20 -2 18 8 c 8 2 8 12 0 14 h -40 c -10 0 -10 -14 0 -22 z"/>
      <path d="M 214 250 c 6 -10 18 -10 22 0 c 8 -8 20 -2 18 8 c 8 2 8 12 0 14 h -40 c -10 0 -10 -14 0 -22 z"/>
    </g>
    <rect class="burner__shine" x="-120" y="200" width="90" height="180" fill="url(#bShine)" opacity="0.35" transform="skewX(-18)"/>
  </g>

  <!-- rim -->
  <ellipse cx="190" cy="214" rx="108" ry="25" fill="url(#bRim)"/>
  <ellipse cx="190" cy="214" rx="108" ry="25" fill="none" stroke="#5a3a0a" stroke-opacity="0.5" stroke-width="1.5"/>
  <ellipse cx="190" cy="213" rx="88" ry="17" fill="url(#bInner)"/>
  <ellipse cx="190" cy="215" rx="78" ry="12" fill="url(#bAsh)"/>

  <!-- sticks -->
  <g class="burner__sticks">
    ${STICKS.map((s, i) => `
    <g class="stick" data-i="${i}" transform="rotate(${s.lean} ${s.x} ${STICK_BOTTOM})">
      <rect class="stick__body" x="${s.x - STICK_W / 2}" y="${s.top}" width="${STICK_W}" height="${STICK_BOTTOM - s.top}" rx="2" fill="url(#bStick)"/>
      <rect class="stick__ash" x="${s.x - STICK_W / 2 - 0.5}" y="${s.top}" width="${STICK_W + 1}" height="0" rx="2.5" fill="#a9a29a"/>
      <circle class="stick__halo" cx="${s.x}" cy="${s.top}" r="9" fill="#ff7a1a" opacity="0" filter="url(#bSoft)"/>
      <circle class="stick__ember" cx="${s.x}" cy="${s.top}" r="4" fill="#fff0c0" filter="url(#bGlow)" opacity="0"/>
    </g>`).join('')}
  </g>
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

  // slow highlight sweep across the bronze
  gsap.to(svg.querySelector('.burner__shine'), {
    attr: { x: 420 }, duration: 7, repeat: -1, repeatDelay: 5, ease: 'sine.inOut',
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

    /** Light up: embers on, then burn the sticks down over `seconds`. */
    light(seconds = 600) {
      burnTl?.kill();
      burnTl = gsap.timeline();
      sticks.forEach((s, i) => {
        const burnTo = STICK_BOTTOM - 46 - i * 6; // leave a stub
        burnTl
          .fromTo(s.ember, { opacity: 0, attr: { r: 0 } }, { opacity: 1, attr: { r: 4 }, duration: 0.5, ease: 'back.out(3)' }, 0.25 + i * 0.18)
          .to(s.halo, { opacity: 0.6, duration: 0.8 }, 0.3 + i * 0.18)
          .to(s.halo, { attr: { cy: burnTo }, duration: seconds, ease: 'none' }, 1)
          .to(s.body, { attr: { y: burnTo, height: STICK_BOTTOM - burnTo }, duration: seconds, ease: 'none' }, 1)
          .to(s.ember, { attr: { cy: burnTo }, duration: seconds, ease: 'none' }, 1)
          .to(s.ash, { attr: { y: burnTo - 10, height: 10 }, duration: seconds, ease: 'none' }, 1);
        // ember flicker
        gsap.to(s.ember, { opacity: 0.55, duration: gsap.utils.random(0.4, 0.8), yoyo: true, repeat: -1, ease: 'sine.inOut', delay: 1 + i * 0.3 });
        gsap.to(s.halo, { opacity: 0.3, duration: gsap.utils.random(0.5, 1), yoyo: true, repeat: -1, ease: 'sine.inOut', delay: 1.2 + i * 0.3 });
      });
    },

    /** Burned out: embers fade, ash falls, fresh sticks appear. */
    extinguish() {
      burnTl?.kill();
      const tl = gsap.timeline();
      sticks.forEach((s, i) => {
        gsap.killTweensOf([s.ember, s.halo]);
        tl.to([s.ember, s.halo], { opacity: 0, duration: 0.8 }, 0)
          .to(s.ash, { attr: { y: STICK_BOTTOM, height: 0 }, duration: 0.6, ease: 'power2.in' }, 0.2)
          .to(s.body, { attr: { y: s.top, height: STICK_BOTTOM - s.top }, duration: 1.2, ease: 'power3.out' }, 1 + i * 0.1)
          .set([s.ember, s.halo], { attr: { cy: s.top } }, 1);
      });
      return tl;
    },
  };
}
