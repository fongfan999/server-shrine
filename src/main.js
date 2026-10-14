import gsap from 'gsap';
import { loadSettings, saveSettings, clearSettings, shareUrl, loadCounters, saveCounters, THEMES, DEFAULTS } from './config.js';
import { applyStrings, t, STRINGS } from './strings.js';
import { sound } from './audio.js';
import { IncenseSmoke } from './smoke.js';
import { buildBurner, OFFERINGS } from './burner.js';
import { buildServerRoom } from './serverRoom.js';
import { Fog } from './fog.js';
import { Petals } from './petals.js';
import { releaseLantern } from './lanterns.js';

const $ = (sel) => document.querySelector(sel);
const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;

/* ---------- State ---------- */
let settings = loadSettings();
const counters = loadCounters();
let lit = false;
let litAt = 0;
let breathing = false;
let breathTl = null;

/* ---------- Elements ---------- */
const body = document.body;
const title = $('#title');
const subtitle = $('#subtitle');
const mantra = $('#mantra');
const burner = $('#burner');
const smokeCanvas = $('#smoke');
const toastEl = $('#toast');
const panel = $('#panel');
const backdrop = $('#panel-backdrop');

/* ---------- Engines ---------- */
const room = buildServerRoom($('#server-room'));
const art = buildBurner($('#burner-art'));
const smoke = new IncenseSmoke(smokeCanvas, () => art.tips());
const fog = new Fog($('#fog'));
const petals = new Petals($('#petals'));
const BURN_SECONDS = 600;

/* ---------- Apply settings ---------- */
function applySettings(animate = false) {
  body.dataset.theme = settings.theme;
  applyStrings({ title: settings.title, subtitle: settings.subtitle });
  document.title = `${settings.title || t('title')} 🧘`;
  if (animate) splitTitle(true);

  fog.setEnabled(settings.fog);
  petals.setEnabled(settings.petals);
  sound.setMusic(settings.music);
  sound.setSfx(settings.sfx);

  // Panel reflects state
  panel.querySelector('[name=title]').value = settings.title;
  panel.querySelector('[name=subtitle]').value = settings.subtitle;
  panel.querySelector('[name=eta]').value = settings.eta ? toLocalInput(settings.eta) : '';
  for (const k of ['music', 'sfx', 'petals', 'fog']) panel.querySelector(`[name=${k}]`).checked = settings[k];
  panel.querySelectorAll('.swatch').forEach((s) => s.classList.toggle('active', s.dataset.theme === settings.theme));

  updateEta();
  updateStats();
}

function toLocalInput(iso) {
  const d = new Date(iso);
  const pad = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function persist() {
  saveSettings(settings);
}

/* ---------- Title split + intro ---------- */
function splitTitle(replay = false) {
  const text = title.textContent;
  title.innerHTML = '';
  const words = text.split(' ');
  words.forEach((word, wi) => {
    const w = document.createElement('span');
    w.className = 'word' + (wi === words.length - 1 && words.length > 1 ? ' word--accent' : '');
    for (const ch of word) {
      const s = document.createElement('span');
      s.className = 'ch';
      s.textContent = ch;
      w.appendChild(s);
    }
    title.appendChild(w);
    title.appendChild(document.createTextNode(' '));
  });
  if (replay) {
    gsap.fromTo('.title .ch', { y: 30, opacity: 0, rotateX: -60 }, { y: 0, opacity: 1, rotateX: 0, duration: 0.8, stagger: 0.02, ease: 'power3.out' });
  }
}

function intro() {
  splitTitle();
  const tl = gsap.timeline({ defaults: { ease: 'power3.out' } });
  if (reduceMotion) {
    tl.set(['.top', '.eyebrow', '.title .ch', '.subtitle', '.mantra', '.cta .btn', '.wish', '.burner', '.altar__stats', '.foot'], { opacity: 1 });
    return;
  }
  gsap.set('.title .ch', { y: 40, opacity: 0, rotateX: -70, transformOrigin: '50% 100%' });
  gsap.set(['.eyebrow', '.subtitle', '.mantra', '.cta .btn', '.wish', '.altar__stats', '.foot'], { y: 16, opacity: 0 });
  gsap.set('.top', { y: -12, opacity: 0 });
  gsap.set('.burner', { y: 60, opacity: 0, scale: 0.92 });

  tl.to('.top', { y: 0, opacity: 1, duration: 0.8 }, 0.1)
    .to('.eyebrow', { y: 0, opacity: 1, duration: 0.7 }, 0.3)
    .to('.title .ch', { y: 0, opacity: 1, rotateX: 0, duration: 1, stagger: 0.022 }, 0.4)
    .to('.subtitle', { y: 0, opacity: 1, duration: 0.8 }, 0.9)
    .to('.mantra', { y: 0, opacity: 1, duration: 0.7 }, 1.05)
    .to('.cta .btn', { y: 0, opacity: 1, duration: 0.7, stagger: 0.08 }, 1.15)
    .to('.wish', { y: 0, opacity: 1, duration: 0.7 }, 1.4)
    .to('.burner', { y: 0, opacity: 1, scale: 1, duration: 1.3, ease: 'elastic.out(1, 0.7)' }, 0.6)
    .to('.altar__stats', { y: 0, opacity: 1, duration: 0.7 }, 1.3)
    .to('.foot', { y: 0, opacity: 1, duration: 0.7 }, 1.45);

  // Idle float on the burner + glow breathing on the primary CTA
  gsap.to('.burner', { y: -6, duration: 3.2, yoyo: true, repeat: -1, ease: 'sine.inOut', delay: 2 });
  gsap.to('#btn-light', { boxShadow: '0 14px 44px rgb(var(--accent-rgb) / 0.55)', duration: 1.6, yoyo: true, repeat: -1, ease: 'sine.inOut' });
}

/* ---------- Parallax ---------- */
function parallax() {
  if (reduceMotion || !matchMedia('(pointer: fine)').matches) return;
  const bgX = gsap.quickTo('.layer--bg', 'x', { duration: 1.2, ease: 'power3.out' });
  const bgY = gsap.quickTo('.layer--bg', 'y', { duration: 1.2, ease: 'power3.out' });
  const heroX = gsap.quickTo('.hero', 'x', { duration: 1.2, ease: 'power3.out' });
  const burnerX = gsap.quickTo('.burner', 'x', { duration: 1.4, ease: 'power3.out' });
  const light = $('#pointer-light');
  const lightX = gsap.quickTo(light, 'x', { duration: 0.9, ease: 'power3.out' });
  const lightY = gsap.quickTo(light, 'y', { duration: 0.9, ease: 'power3.out' });
  window.addEventListener('pointermove', (e) => {
    const nx = (e.clientX / innerWidth - 0.5);
    const ny = (e.clientY / innerHeight - 0.5);
    bgX(-nx * 30); bgY(-ny * 20);
    heroX(nx * 8);
    burnerX(nx * 14);
    lightX(e.clientX); lightY(e.clientY);
    if (!light.dataset.on) { light.dataset.on = '1'; gsap.to(light, { opacity: 1, duration: 1.2 }); }
  }, { passive: true });
}

/* ---------- Mantras ---------- */
function startMantras() {
  const lines = () => STRINGS.mantras;
  let i = Math.floor(Math.random() * lines().length);
  const swap = () => {
    const next = lines()[i++ % lines().length];
    gsap.timeline()
      .to(mantra, { y: -8, opacity: 0, duration: 0.35, ease: 'power2.in', onComplete: () => { mantra.textContent = next; } })
      .fromTo(mantra, { y: 8, opacity: 0 }, { y: 0, opacity: 1, duration: 0.45, ease: 'power2.out' });
  };
  swap();
  setInterval(swap, 4200);
}

/* ---------- Toast ---------- */
let toastTl;
function toast(msg) {
  toastEl.textContent = msg;
  toastTl?.kill();
  toastTl = gsap.timeline()
    .to(toastEl, { opacity: 1, y: 0, duration: 0.4, ease: 'power3.out', overwrite: true })
    .to(toastEl, { opacity: 0, y: 20, duration: 0.5, ease: 'power2.in' }, '+=2.6');
}

/* ---------- Stats + progress ---------- */
const statIncense = $('#stat-incense');
const statKarma = $('#stat-karma');
const statTime = $('#stat-time');
const progressBar = $('#progress-bar');
const progressPct = $('#progress-pct');
const progress = $('#progress');
const burningEl = $('#burning');
const burningTime = $('#burning-time');

function updateStats() {
  statIncense.textContent = counters.incense;
  statKarma.textContent = counters.karma;
}

function bump(el) {
  gsap.fromTo(el, { scale: 1.35, color: '#fff' }, { scale: 1, color: '', duration: 0.6, ease: 'elastic.out(1, 0.5)' });
}

function addKarma(n = 1) {
  counters.karma += n;
  saveCounters(counters);
  updateStats();
  bump(statKarma);
}

// Enlightenment is a very zen progress bar: it approaches 100% but never quite arrives.
let enlightenment = 0;
function tickProgress() {
  const elapsed = lit ? (Date.now() - litAt) / 1000 : 0;
  const target = lit ? 100 * (1 - Math.exp(-elapsed / 240)) : 0;
  enlightenment += (target - enlightenment) * 0.08;
  const pct = Math.min(99, Math.floor(enlightenment));
  progressBar.style.width = `${enlightenment}%`;
  progressPct.textContent = `${pct}%`;
  progress.setAttribute('aria-valuenow', pct);

  if (lit) {
    const s = Math.floor(elapsed);
    statTime.textContent = `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;
    const left = Math.max(0, BURN_SECONDS - s);
    burningTime.textContent = `${Math.floor(left / 60)}:${String(left % 60).padStart(2, '0')}`;
  }
}
setInterval(tickProgress, 250);

/* ---------- ETA ---------- */
const etaText = $('#eta-text');
function updateEta() {
  if (!settings.eta) { etaText.textContent = t('anyMoment'); return; }
  const d = new Date(settings.eta);
  const diff = d - Date.now();
  if (diff <= 0) { etaText.textContent = t('anyMoment'); return; }
  const h = Math.floor(diff / 3600000);
  const m = Math.floor((diff % 3600000) / 60000);
  const rel = h > 0 ? `${h}h ${m}m` : `${m}m`;
  const abs = d.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' });
  etaText.textContent = `${t('backIn')} ${rel} · ${t('backAt')} ${abs}`;
}
setInterval(updateEta, 15000);

/* ---------- Light the incense ---------- */
function light() {
  sound.unlock();
  if (lit) return;
  lit = true;
  litAt = Date.now();
  counters.incense += 1;
  saveCounters(counters);
  updateStats();
  bump(statIncense);

  sound.lighter();
  gsap.delayedCall(0.9, () => sound.bowl(196));

  body.dataset.state = 'lit';
  burningEl.hidden = false;
  gsap.fromTo(burningEl, { scale: 0.8, opacity: 0 }, { scale: 1, opacity: 1, duration: 0.6, ease: 'back.out(2)' });
  art.light(BURN_SECONDS);
  smoke.start();
  petals.rate = 1.4;
  petals.burst(24);

  // Flash + shake of the burner, like a flame catching
  gsap.timeline()
    .to('.burner', { scale: 1.04, duration: 0.15, ease: 'power2.out' })
    .to('.burner', { scale: 1, duration: 0.8, ease: 'elastic.out(1, 0.4)' })
    .fromTo('.layer--vignette', { filter: 'brightness(1.6)' }, { filter: 'brightness(1)', duration: 1.4, ease: 'power2.out' }, 0);

  toast(t('lit'));
  gsap.delayedCall(1.2, () => art.bow(3));

  // The incense burns out after a while; relight for more karma.
  gsap.delayedCall(BURN_SECONDS + 1, burnOut);
}

function burnOut() {
  if (!lit) return;
  lit = false;
  body.dataset.state = 'unlit';
  burningEl.hidden = true;
  art.extinguish();
  smoke.stop();
  addKarma(10);
  toast(t('burnedOut'));
  gsap.fromTo('#btn-light', { opacity: 0, y: 10 }, { opacity: 1, y: 0, duration: 0.6, ease: 'power3.out' });
}

/* ---------- Bowl ---------- */
function ringBowl() {
  sound.unlock();
  sound.bowl(gsap.utils.random([174, 196, 220, 261]));
  addKarma(1);
  room.pulse();

  // Ripple ring from the bowl button
  const btn = $('#btn-bowl');
  const r = btn.getBoundingClientRect();
  const ring = document.createElement('span');
  Object.assign(ring.style, {
    position: 'fixed', left: `${r.left + r.width / 2}px`, top: `${r.top + r.height / 2}px`,
    width: '20px', height: '20px', marginLeft: '-10px', marginTop: '-10px',
    borderRadius: '50%', border: '1px solid rgb(var(--accent-rgb) / 0.8)', pointerEvents: 'none', zIndex: 10,
  });
  document.body.appendChild(ring);
  gsap.to(ring, { scale: 40, opacity: 0, duration: 2.6, ease: 'power2.out', onComplete: () => ring.remove() });
  gsap.fromTo(btn.firstElementChild, { rotation: -20 }, { rotation: 0, duration: 1, ease: 'elastic.out(1, 0.3)' });
  gsap.fromTo('.scene', { scale: 1.01 }, { scale: 1, duration: 1.2, ease: 'power2.out' });
}

/* ---------- Bow + offerings ---------- */
function bow() {
  sound.unlock();
  art.bow(1);
  sound.tick(392, 0.07);
  gsap.delayedCall(0.5, () => sound.bowl(147));
  addKarma(2);
  toast(t('bowed'));
  gsap.fromTo('.hero', { y: 0 }, { y: 6, duration: 0.5, yoyo: true, repeat: 1, ease: 'sine.inOut' });
}

let lastOffering = null;
function offer() {
  sound.unlock();
  const kinds = Object.keys(OFFERINGS).filter((k) => k !== lastOffering);
  const kind = gsap.utils.random(kinds);
  lastOffering = kind;
  const label = art.offer(kind);
  sound.whoosh();
  gsap.delayedCall(0.35, () => sound.tick(1046, 0.08));
  addKarma(3);
  smoke.puff(0.6);
  toast(t('offered').replace('{item}', label));
  gsap.fromTo('.burner', { scale: 1 }, { scale: 1.02, duration: 0.25, yoyo: true, repeat: 1, ease: 'sine.inOut' });
}

/* ---------- Breathing guide ---------- */
const breathEl = $('#breath');
const breathLabel = $('#breath-label');
const breathBtn = $('#btn-breathe');

function toggleBreathing() {
  sound.unlock();
  breathing = !breathing;
  breathBtn.setAttribute('aria-pressed', String(breathing));
  if (breathing) startBreathing(); else stopBreathing();
}

function startBreathing() {
  breathEl.hidden = false;
  gsap.set('.hero > :not(.cta)', { opacity: 0.25 });
  gsap.set(['.breath__core'], { scale: 0.4 });
  gsap.set(['.breath__ring'], { scale: 1, opacity: 0.6 });

  const IN = 4, HOLD = 7, OUT = 8; // 4-7-8 breathing
  breathTl = gsap.timeline({ repeat: -1 });
  breathTl
    .call(() => { breathLabel.textContent = t('inhale'); sound.breath(220, IN, 0.07); })
    .to('.breath__core', { scale: 1, duration: IN, ease: 'sine.inOut' }, '<')
    .to('.breath__ring', { scale: 1.08, opacity: 1, duration: IN, ease: 'sine.inOut' }, '<')
    .call(() => { breathLabel.textContent = t('hold'); })
    .to('.breath__ring', { scale: 1.1, duration: HOLD, ease: 'none' })
    .call(() => { breathLabel.textContent = t('exhale'); sound.breath(165, OUT, 0.06); smoke.puff(0.8); })
    .to('.breath__core', { scale: 0.4, duration: OUT, ease: 'sine.inOut' }, '<')
    .to('.breath__ring', { scale: 1, opacity: 0.6, duration: OUT, ease: 'sine.inOut' }, '<');
}

function stopBreathing() {
  breathTl?.kill();
  breathEl.hidden = true;
  gsap.to('.hero > :not(.cta)', { opacity: 1, duration: 0.5 });
}

/* ---------- Wishes ---------- */
$('#wish-form').addEventListener('submit', (e) => {
  e.preventDefault();
  sound.unlock();
  const input = $('#wish-input');
  const text = input.value.trim();
  if (!text) { addKarma(1); toast(t('wishEmpty')); return; }
  input.value = '';
  releaseLantern($('#lanterns'), text, $('.wish'));
  sound.whoosh();
  gsap.delayedCall(0.6, () => sound.bowl(261));
  addKarma(3);
  petals.burst(8);
  toast(t('wishSent'));
});

/* ---------- Burner tap: a puff of smoke ---------- */
burner.addEventListener('click', () => {
  if (!lit) { light(); return; }
  sound.unlock();
  sound.tick(520, 0.08);
  smoke.puff(1);
  gsap.fromTo('.burner', { rotation: -2 }, { rotation: 0, duration: 0.8, ease: 'elastic.out(1, 0.3)' });
  addKarma(1);
});

/* ---------- Sound toggle ---------- */
const soundBtn = $('#btn-sound');
soundBtn.addEventListener('click', () => {
  sound.unlock();
  const on = soundBtn.getAttribute('aria-pressed') !== 'true';
  soundBtn.setAttribute('aria-pressed', String(on));
  sound.setMuted(!on);
  if (on) sound.tick(880);
});

/* ---------- Settings panel ---------- */
let panelOpen = false;
function openPanel(open) {
  panelOpen = open;
  panel.setAttribute('aria-hidden', String(!open));
  backdrop.classList.toggle('open', open);
  gsap.to(panel, { x: open ? '0%' : '100%', duration: 0.5, ease: open ? 'power3.out' : 'power3.in' });
  if (open) sound.tick(660, 0.06);
}
$('#btn-settings').addEventListener('click', () => { sound.unlock(); openPanel(!panelOpen); });
$('#btn-close-panel').addEventListener('click', () => openPanel(false));
backdrop.addEventListener('click', () => openPanel(false));
document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && panelOpen) openPanel(false); });

panel.addEventListener('input', (e) => {
  const el = e.target;
  if (!el.name) return;
  if (el.type === 'checkbox') settings[el.name] = el.checked;
  else if (el.name === 'eta') settings.eta = el.value ? new Date(el.value).toISOString() : '';
  else settings[el.name] = el.value;
  persist();
  applySettings();
  if (el.type === 'checkbox') sound.tick(el.checked ? 880 : 440, 0.06);
});

$('#swatches').addEventListener('click', (e) => {
  const s = e.target.closest('.swatch');
  if (!s) return;
  settings.theme = s.dataset.theme;
  persist();
  applySettings();
  sound.tick(740, 0.06);
  petals.burst(10);
  gsap.fromTo('.layer--vignette', { opacity: 0.6 }, { opacity: 1, duration: 1 });
});

$('#btn-copy-link').addEventListener('click', async () => {
  const url = shareUrl(settings);
  try { await navigator.clipboard.writeText(url); } catch { prompt('Copy this link:', url); }
  history.replaceState(null, '', url);
  toast(t('copied'));
  sound.tick(990, 0.08);
});

$('#btn-reset').addEventListener('click', () => {
  clearSettings();
  settings = { ...DEFAULTS };
  history.replaceState(null, '', location.pathname);
  applySettings(true);
  sound.tick(330, 0.06);
});

/* ---------- Keyboard shortcuts ---------- */
document.addEventListener('keydown', (e) => {
  if (e.target.matches('input, textarea')) return;
  if (e.key === 'l') light();
  if (e.key === 'b') ringBowl();
  if (e.key === 'p') bow();
  if (e.key === 'o') offer();
  if (e.key === ' ') { e.preventDefault(); toggleBreathing(); }
  if (e.key === 'm') soundBtn.click();
  if (e.key === 't') { settings.theme = THEMES[(THEMES.indexOf(settings.theme) + 1) % THEMES.length]; persist(); applySettings(); }
});

/* ---------- Wire up ---------- */
$('#btn-light').addEventListener('click', light);
$('#btn-bowl').addEventListener('click', ringBowl);
$('#btn-bow').addEventListener('click', bow);
$('#btn-offer').addEventListener('click', offer);
breathBtn.addEventListener('click', toggleBreathing);

// The first interaction anywhere unlocks audio so music can start on the first click.
document.addEventListener('pointerdown', () => sound.unlock(), { once: true });

if (import.meta.env.DEV) window.__incense = { gsap, sound, smoke, fog, petals, get settings() { return settings; } };

applySettings();
intro();
parallax();
startMantras();
petals.rate = 0.35; // a few stray petals before the incense is lit
petals.start();
