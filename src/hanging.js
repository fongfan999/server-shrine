/**
 * Red paper lanterns hanging from the server-room ceiling, framing the altar.
 * They sway on their cords, and glow brighter while the incense burns.
 */
import gsap from 'gsap';

// x: offset from centre (vw), drop: cord length (vh), s: size, depth: 0 near … 1 far
const LANTERNS = [
  { x: -36, drop: 6, s: 0.62, depth: 1 },
  { x: -25, drop: 21, s: 1, depth: 0 },
  { x: 25, drop: 15, s: 0.9, depth: 0.2 },
  { x: 37, drop: 3, s: 0.6, depth: 1 },
];

let uid = 0;
const lantern = () => {
  const id = `hl${uid++}`;
  return `
<svg class="hang__svg" viewBox="0 0 80 150" aria-hidden="true">
  <defs>
    <radialGradient id="${id}p" cx="0.45" cy="0.45" r="0.6">
      <stop offset="0" stop-color="#ffd27a"/>
      <stop offset="0.35" stop-color="#ff6a3a"/>
      <stop offset="0.75" stop-color="#c3172b"/>
      <stop offset="1" stop-color="#5e0612"/>
    </radialGradient>
    <linearGradient id="${id}g" x1="0" x2="1">
      <stop offset="0" stop-color="#6b4710"/><stop offset="0.5" stop-color="#f3cf72"/><stop offset="1" stop-color="#6b4710"/>
    </linearGradient>
  </defs>
  <ellipse class="hang__glow" cx="40" cy="62" rx="58" ry="58" fill="#ff7a3a" opacity="0.18"/>
  <rect x="26" y="20" width="28" height="8" rx="2" fill="url(#${id}g)"/>
  <ellipse cx="40" cy="62" rx="34" ry="36" fill="url(#${id}p)"/>
  <g fill="none" stroke="#5e0612" stroke-opacity="0.55" stroke-width="1.2">
    <path d="M40 26 V98"/>
    <path d="M40 26 C 22 40, 22 84, 40 98"/><path d="M40 26 C 58 40, 58 84, 40 98"/>
    <path d="M40 26 C 10 44, 10 80, 40 98"/><path d="M40 26 C 70 44, 70 80, 40 98"/>
  </g>
  <circle cx="40" cy="62" r="11" fill="none" stroke="#ffe6a8" stroke-opacity="0.75" stroke-width="1.6"/>
  <circle cx="40" cy="62" r="5" fill="#ffe6a8" fill-opacity="0.55"/>
  <rect x="26" y="96" width="28" height="8" rx="2" fill="url(#${id}g)"/>
  <path d="M40 104 V112" stroke="#f3cf72" stroke-width="2"/>
  <path d="M34 112 h12 l-2 30 h-8 z" fill="#c3172b"/>
  <path d="M36 114 v26 M40 114 v28 M44 114 v26" stroke="#ff8a5a" stroke-opacity="0.6" stroke-width="1"/>
</svg>`;
};

export function buildHanging(host) {
  const items = LANTERNS.map((l) => {
    const el = document.createElement('div');
    el.className = 'hang';
    el.style.left = `calc(50% + ${l.x}vw)`;
    el.style.setProperty('--drop', `${l.drop}vh`);
    el.style.setProperty('--s', l.s);
    el.style.setProperty('--depth', l.depth);
    el.innerHTML = `<span class="hang__cord"></span>${lantern()}`;
    host.appendChild(el);
    gsap.fromTo(el, { rotation: -2.5 * l.s }, { rotation: 2.5 * l.s, duration: gsap.utils.random(3.2, 4.6), yoyo: true, repeat: -1, ease: 'sine.inOut', delay: Math.random() * 2, transformOrigin: '50% 0%' });
    return el;
  });
  const glows = host.querySelectorAll('.hang__glow');

  return {
    setLit(lit) {
      gsap.to(glows, { opacity: lit ? 0.42 : 0.18, duration: 2, ease: 'sine.inOut' });
    },
    /** A gust: everyone swings a little harder for a moment (the bowl rang). */
    gust() {
      items.forEach((el, i) => gsap.fromTo(el.querySelector('svg'), { rotation: 0 }, { rotation: (i % 2 ? 1 : -1) * 6, duration: 0.35, yoyo: true, repeat: 1, ease: 'sine.inOut', transformOrigin: '50% 0%' }));
    },
  };
}
