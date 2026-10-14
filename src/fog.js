/**
 * Ambient fog: large soft blobs drifting slowly across the whole viewport.
 * Rendered as radial gradients on a low-res canvas (upscaled) for cheapness.
 */
import gsap from 'gsap';

const SCALE = 0.35;

export class Fog {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.blobs = [];
    this.enabled = true;
    this.opacity = 0;
    this.resize();
    window.addEventListener('resize', () => this.resize());
    gsap.ticker.add((time, dt) => this.frame(dt));
    gsap.to(this, { opacity: 1, duration: 4, ease: 'power1.inOut', delay: 0.5 });
  }

  resize() {
    this.w = Math.ceil(innerWidth * SCALE);
    this.h = Math.ceil(innerHeight * SCALE);
    this.canvas.width = this.w;
    this.canvas.height = this.h;
    this.blobs = [];
    const count = Math.max(6, Math.round((innerWidth * innerHeight) / 160000));
    for (let i = 0; i < count; i++) this.blobs.push(this.makeBlob(true));
  }

  makeBlob(anywhere = false) {
    const r = gsap.utils.random(this.w * 0.25, this.w * 0.6);
    return {
      x: anywhere ? gsap.utils.random(-r, this.w + r) : -r,
      y: gsap.utils.random(this.h * 0.2, this.h * 1.1),
      r,
      vx: gsap.utils.random(0.004, 0.012),
      vy: gsap.utils.random(-0.003, 0.001),
      a: gsap.utils.random(0.05, 0.12),
    };
  }

  setEnabled(on) {
    this.enabled = on;
    gsap.to(this, { opacity: on ? 1 : 0, duration: 1.5, overwrite: true });
  }

  frame(dt) {
    if (this.opacity <= 0.001) {
      if (this.cleared) return;
      this.ctx.clearRect(0, 0, this.w, this.h);
      this.cleared = true;
      return;
    }
    this.cleared = false;
    dt = Math.min(dt * 1000, 50);
    const ctx = this.ctx;
    ctx.clearRect(0, 0, this.w, this.h);
    for (let i = 0; i < this.blobs.length; i++) {
      const b = this.blobs[i];
      b.x += b.vx * dt;
      b.y += b.vy * dt;
      if (b.x - b.r > this.w) this.blobs[i] = this.makeBlob(false);
      const g = ctx.createRadialGradient(b.x, b.y, 0, b.x, b.y, b.r);
      g.addColorStop(0, `rgba(226,230,236,${b.a * this.opacity})`);
      g.addColorStop(1, 'rgba(226,230,236,0)');
      ctx.fillStyle = g;
      ctx.fillRect(b.x - b.r, b.y - b.r, b.r * 2, b.r * 2);
    }
  }
}
