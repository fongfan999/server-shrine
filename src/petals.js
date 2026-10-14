/**
 * Falling petals, driven entirely by GSAP tweens on DOM nodes.
 */
import gsap from 'gsap';

export class Petals {
  constructor(container) {
    this.container = container;
    this.enabled = true;
    this.running = false;
    this.rate = 1; // petals per second
    this._spawnLoop = null;
  }

  start() {
    if (this.running) return;
    this.running = true;
    const loop = () => {
      if (!this.running) return;
      if (this.enabled && document.visibilityState === 'visible') this.spawn();
      this._spawnLoop = gsap.delayedCall(1 / this.rate + gsap.utils.random(-0.3, 0.3), loop);
    };
    loop();
  }

  stop() {
    this.running = false;
    this._spawnLoop?.kill();
  }

  setEnabled(on) { this.enabled = on; }

  /** A gust: spawn a bunch at once. */
  burst(n = 18) {
    for (let i = 0; i < n; i++) gsap.delayedCall(i * 0.04, () => this.spawn());
  }

  spawn() {
    const el = document.createElement('span');
    el.className = 'petal';
    const size = gsap.utils.random(10, 20);
    el.style.width = `${size}px`;
    el.style.height = `${size * 0.72}px`;
    this.container.appendChild(el);

    const startX = gsap.utils.random(-40, innerWidth + 40);
    const drift = gsap.utils.random(-120, 120);
    const dur = gsap.utils.random(7, 13);

    gsap.set(el, { x: startX, y: -40, rotation: gsap.utils.random(0, 360), opacity: 0 });
    const tl = gsap.timeline({ onComplete: () => el.remove() });
    tl.to(el, { opacity: gsap.utils.random(0.5, 0.95), duration: 0.8 }, 0)
      .to(el, { y: innerHeight + 60, duration: dur, ease: 'none' }, 0)
      .to(el, { x: `+=${drift}`, duration: dur, ease: 'sine.inOut' }, 0)
      .to(el, { rotation: `+=${gsap.utils.random(180, 540)}`, duration: dur, ease: 'none' }, 0)
      .to(el, { rotationY: 360, duration: gsap.utils.random(1.5, 3), repeat: -1, ease: 'sine.inOut' }, 0)
      .to(el, { opacity: 0, duration: 1.2 }, dur - 1.2);
    // sway
    gsap.to(el, { x: `+=${gsap.utils.random(20, 60)}`, duration: gsap.utils.random(1.2, 2.4), yoyo: true, repeat: -1, ease: 'sine.inOut' });
  }
}
