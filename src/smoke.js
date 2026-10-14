/**
 * Incense smoke: soft sprite particles rising from each live ember tip,
 * drifting in a slow sine wind, growing and fading. The sprite is drawn
 * at runtime, so there is no image to load.
 */
import gsap from 'gsap';

function makeSprite(size = 64) {
  const c = document.createElement('canvas');
  c.width = c.height = size;
  const ctx = c.getContext('2d');
  const g = ctx.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
  g.addColorStop(0, 'rgba(236,238,242,0.55)');
  g.addColorStop(0.35, 'rgba(226,230,236,0.28)');
  g.addColorStop(0.7, 'rgba(216,222,230,0.08)');
  g.addColorStop(1, 'rgba(210,216,224,0)');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, size, size);
  // a few wispy strands so the puffs are not perfect circles
  ctx.globalCompositeOperation = 'destination-out';
  for (let i = 0; i < 3; i++) {
    const a = Math.random() * Math.PI * 2;
    ctx.beginPath();
    ctx.ellipse(size / 2 + Math.cos(a) * size * 0.22, size / 2 + Math.sin(a) * size * 0.22, size * 0.18, size * 0.1, a, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(0,0,0,0.35)';
    ctx.fill();
  }
  return c;
}

export class IncenseSmoke {
  /**
   * @param {HTMLCanvasElement} canvas
   * @param {() => {x:number,y:number}[]} emitters  returns the screen-space tip positions
   */
  constructor(canvas, emitters) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.emitters = emitters;
    this.parts = [];
    this.running = false;
    this.intensity = 0;
    this.wind = 0;
    this.lastSpawn = 0;
    this.sprites = [makeSprite(), makeSprite(), makeSprite()];
    this.dpr = Math.min(window.devicePixelRatio || 1, 2);
    this.resize();
    window.addEventListener('resize', () => this.resize());
    gsap.ticker.add((time, dt) => this.frame(dt));
    gsap.to(this, { wind: 1, duration: 6, ease: 'sine.inOut', yoyo: true, repeat: -1 });
  }

  resize() {
    const r = this.canvas.getBoundingClientRect();
    this.w = r.width;
    this.h = r.height;
    this.canvas.width = Math.round(this.w * this.dpr);
    this.canvas.height = Math.round(this.h * this.dpr);
    this.ctx.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);
  }

  start() {
    this.running = true;
    gsap.to(this, { intensity: 1, duration: 3, ease: 'power2.out', overwrite: 'auto' });
  }

  stop() {
    gsap.to(this, { intensity: 0, duration: 2, ease: 'power2.in', overwrite: 'auto', onComplete: () => { this.running = false; } });
  }

  spawn(boost = 1) {
    const c = this.canvas.getBoundingClientRect();
    for (const e of this.emitters()) {
      this.parts.push({
        x: e.x - c.left,
        y: e.y - c.top,
        age: 0,
        life: gsap.utils.random(3200, 5200),
        vx: gsap.utils.random(-0.012, 0.012) * boost,
        vy: gsap.utils.random(-0.055, -0.035) * (1 + (boost - 1) * 0.4),
        size: gsap.utils.random(12, 18) * (1 + (boost - 1) * 0.3),
        grow: gsap.utils.random(0.014, 0.024),
        rot: gsap.utils.random(0, Math.PI * 2),
        rotV: gsap.utils.random(-0.0008, 0.0008),
        phase: gsap.utils.random(0, Math.PI * 2),
        alpha: gsap.utils.random(0.16, 0.3),
        sprite: this.sprites[(Math.random() * this.sprites.length) | 0],
      });
    }
  }

  frame(dt) {
    if (!this.running && this.parts.length === 0) return;
    dt = Math.min(dt * 1000, 50);

    this.lastSpawn += dt;
    const interval = gsap.utils.interpolate(260, 95, this.intensity);
    if (this.running && this.intensity > 0.02 && this.lastSpawn > interval) {
      this.lastSpawn = 0;
      this.spawn();
    }

    const ctx = this.ctx;
    ctx.clearRect(0, 0, this.w, this.h);
    const windX = (this.wind - 0.5) * 0.02;

    for (let i = this.parts.length - 1; i >= 0; i--) {
      const p = this.parts[i];
      p.age += dt;
      if (p.age > p.life || p.y < -60) { this.parts.splice(i, 1); continue; }
      const t = p.age / p.life;
      const sway = Math.sin(p.age * 0.0016 + p.phase) * 0.02 * t;
      p.x += (p.vx + windX * t + sway) * dt;
      p.y += p.vy * dt * (1 - t * 0.35);
      p.size += p.grow * dt;
      p.rot += p.rotV * dt;

      const a = p.alpha * Math.sin(Math.PI * Math.min(t, 1)) * this.intensity;
      ctx.save();
      ctx.globalAlpha = a;
      ctx.translate(p.x, p.y);
      ctx.rotate(p.rot);
      ctx.drawImage(p.sprite, -p.size / 2, -p.size / 2, p.size, p.size);
      ctx.restore();
    }
  }

  /** A puff of extra smoke (e.g. when the burner is tapped). */
  puff(n = 6) {
    for (let i = 0; i < n; i++) this.spawn(3);
  }
}
