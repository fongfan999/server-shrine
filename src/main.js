import gsap from 'gsap';
import { loadSettings, saveSettings, clearSettings, shareUrl, loadCounters, saveCounters, THEMES, DEFAULTS } from './config.js';
import { applyStrings, t, STRINGS, BRAND } from './strings.js';
import { sound } from './audio.js';
import { IncenseSmoke } from './smoke.js';
import { buildBurner, OFFERINGS } from './burner.js';
import { buildServerRoom } from './serverRoom.js';
import { Fog } from './fog.js';
import { Petals } from './petals.js';
import { releaseLantern } from './lanterns.js';
import { roomFromPath, connectRoom, loadMe, saveMe, AVATARS } from './room.js';
import { Congregation } from './congregation.js';
import { Motes } from './motes.js';
import { Vitals } from './vitals.js';
import { buildHanging } from './hanging.js';

const $ = (sel) => document.querySelector(sel);
const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;
/** t() with {placeholders} filled in. */
const fmt = (key, vars = {}) => Object.entries(vars).reduce((s, [k, v]) => s.replaceAll(`{${k}}`, v), t(key));

/* ---------- State ---------- */
let settings = loadSettings();
const counters = loadCounters();
let lit = false;
let litAt = 0;
let breathing = false;
let breathTl = null;

/* ---------- Room (shared shrine at /r/:room) ---------- */
const roomName = roomFromPath();
let shrine = null;       // live connection, once we have joined
let me = loadMe();
let myId = null;
let clockSkew = 0;       // server clock minus ours
let pendingLightAt = 0;  // we lit it and are waiting for the shrine to confirm
let greeted = false;     // the first state message restores the altar
const people = new Map();

/* ---------- Elements ---------- */
const body = document.body;
const title = $('#title');
const mantra = $('#mantra');
const burner = $('#burner');
const toastEl = $('#toast');
const panel = $('#panel');
const backdrop = $('#panel-backdrop');

/* ---------- Engines ---------- */
const room = buildServerRoom($('#server-room'));
const art = buildBurner($('#burner-art'));
const smoke = new IncenseSmoke($('#smoke'), () => art.tips());
const fog = new Fog($('#fog'));
const petals = new Petals($('#petals'));
const motes = new Motes($('#motes'));
const hanging = buildHanging($('#hang'));
const congregation = new Congregation($('#congregation'), burner);
const vitals = new Vitals($('#ekg'), $('#vitals-bpm'));
const BURN_SECONDS = 600; // keep in sync with worker/shrine.js

/* ---------- Apply settings ---------- */
function applySettings(animate = false) {
  body.dataset.theme = settings.theme;
  motes.syncColor();
  applyStrings({ title: settings.title, subtitle: settings.subtitle });
  document.title = `${settings.title || t('title')} · ${BRAND}`;
  if (roomName) $('#eyebrow').textContent = fmt('roomEyebrow', { room: roomName });
  if (animate || !title.querySelector('.word')) splitTitle(animate);

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
  const text = title.textContent.trim();
  title.innerHTML = '';
  const words = text.split(/\s+/);
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
    if (wi < words.length - 1) title.appendChild(document.createTextNode(' '));
  });
  if (replay && !reduceMotion) {
    gsap.fromTo('.title .ch', { y: 30, opacity: 0, rotateX: -60 }, { y: 0, opacity: 1, rotateX: 0, duration: 0.8, stagger: 0.02, ease: 'power3.out' });
  }
}

function intro() {
  if (reduceMotion) return;
  const dock = ['.pray', '.actions', '.credit'];
  gsap.set('.title .ch', { y: 40, opacity: 0, rotateX: -70, transformOrigin: '50% 100%' });
  gsap.set(['.eyebrow', '.subtitle', '.mantra'], { y: 14, opacity: 0 });
  gsap.set('.bar', { y: -12, opacity: 0 });
  gsap.set('.side .card', { y: 20, opacity: 0 });
  gsap.set(dock, { y: 24, opacity: 0 });
  gsap.set('.burner', { y: 60, opacity: 0, scale: 0.92 });

  // Camera pushes down the server corridor, the lanterns drop, the light comes up.
  gsap.fromTo('.layer--bg', { scale: 1.35, opacity: 0 }, { scale: 1, opacity: 1, duration: 3.6, ease: 'power2.out' });
  gsap.from('.hang', { y: '-45vh', duration: 2.2, ease: 'back.out(1.2)', stagger: 0.15, delay: 0.6 });
  gsap.from('#rays', { opacity: 0, duration: 3, delay: 1 });

  gsap.timeline({ defaults: { ease: 'power3.out' } })
    .to('.bar', { y: 0, opacity: 1, duration: 0.8 }, 0.1)
    .to('.eyebrow', { y: 0, opacity: 1, duration: 0.7 }, 0.25)
    .to('.title .ch', { y: 0, opacity: 1, rotateX: 0, duration: 1, stagger: 0.022 }, 0.35)
    .to(['.subtitle', '.mantra'], { y: 0, opacity: 1, duration: 0.8, stagger: 0.1 }, 0.8)
    .to('.burner', { y: 0, opacity: 1, scale: 1, duration: 1.3, ease: 'elastic.out(1, 0.7)' }, 0.5)
    .to('.side .card', { y: 0, opacity: 1, duration: 0.8, stagger: 0.08 }, 0.9)
    .to(dock, { y: 0, opacity: 1, duration: 0.8, stagger: 0.08 }, 1.0);

  // Idle float on the burner
  gsap.to('.burner', { y: -6, duration: 3.2, yoyo: true, repeat: -1, ease: 'sine.inOut', delay: 2 });
}

/* ---------- Parallax ---------- */
function parallax() {
  if (reduceMotion || !matchMedia('(pointer: fine)').matches) return;
  const bgX = gsap.quickTo('.layer--bg', 'x', { duration: 1.2, ease: 'power3.out' });
  const bgY = gsap.quickTo('.layer--bg', 'y', { duration: 1.2, ease: 'power3.out' });
  const headX = gsap.quickTo('.heading', 'x', { duration: 1.2, ease: 'power3.out' });
  const burnerX = gsap.quickTo('.burner', 'x', { duration: 1.4, ease: 'power3.out' });
  const light = $('#pointer-light');
  const lightX = gsap.quickTo(light, 'x', { duration: 0.9, ease: 'power3.out' });
  const lightY = gsap.quickTo(light, 'y', { duration: 0.9, ease: 'power3.out' });
  window.addEventListener('pointermove', (e) => {
    const nx = (e.clientX / innerWidth - 0.5);
    const ny = (e.clientY / innerHeight - 0.5);
    bgX(-nx * 30); bgY(-ny * 20);
    headX(nx * 6);
    burnerX(nx * 12);
    lightX(e.clientX); lightY(e.clientY);
    if (!light.dataset.on) { light.dataset.on = '1'; gsap.to(light, { opacity: 1, duration: 1.2 }); }
  }, { passive: true });
}

/* ---------- Light shimmer ---------- */
gsap.utils.toArray('.ray').forEach((ray) => {
  gsap.to(ray, { opacity: () => gsap.utils.random(0.45, 1), duration: () => gsap.utils.random(2, 4.5), repeat: -1, repeatRefresh: true, yoyo: true, ease: 'sine.inOut' });
});

/* ---------- Rack 42's heart rate: flat while cold, faster with more people and more devotion ---------- */
let devotion = 0;
function kick(amount, strength = 1) {
  devotion = Math.min(60, devotion + amount);
  vitals.kick(strength);
}
setInterval(() => {
  devotion *= 0.93;
  const crowd = Math.max(1, people.size);
  vitals.setBpm(lit ? Math.min(160, 58 + (crowd - 1) * 7 + devotion) : 0);
}, 1000);

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

/* ---------- Activity feed ---------- */
const feedEl = $('#feed');
const feedEmpty = $('#feed-empty');
const sideLeft = $('.side--left');
const FEED_MAX = 50;
const feedVisible = () => sideLeft.offsetParent !== null;

function ago(at) {
  const s = Math.max(0, Math.round((Date.now() - at) / 1000));
  if (s < 45) return 'now';
  if (s < 3600) return `${Math.round(s / 60)}m`;
  if (s < 86400) return `${Math.round(s / 3600)}h`;
  return `${Math.round(s / 86400)}d`;
}
setInterval(() => feedEl.querySelectorAll('time').forEach((el) => { el.textContent = ago(+el.dataset.at); }), 30000);

/**
 * Add a line to the activity feed. Repeats of the same action by the same
 * person within a few seconds fold into one line with a ×N counter.
 * `toastText` is shown as a toast instead when the feed is not on screen (phones).
 */
function logEvent({ key, avatar = '🪔', who = '', what, quote = '', quiet = false, at = Date.now(), toastText = '' }) {
  if (toastText && !feedVisible()) toast(toastText);

  const top = feedEl.firstElementChild;
  if (key && !quote && top?.dataset.key === key && at - +top.dataset.last < 15000) {
    top.dataset.last = at;
    top.dataset.n = +top.dataset.n + 1;
    top.querySelector('.feed__line').lastChild.textContent = ` ${what} ×${top.dataset.n}`;
    const time = top.querySelector('time');
    time.dataset.at = at;
    time.textContent = ago(at);
    return;
  }

  const li = document.createElement('li');
  li.className = 'feed__item' + (quiet ? ' feed__item--quiet' : '');
  if (key) { li.dataset.key = key; li.dataset.last = at; li.dataset.n = 1; }
  const av = document.createElement('span');
  av.className = 'feed__avatar';
  av.textContent = avatar;
  const main = document.createElement('div');
  const line = document.createElement('p');
  line.className = 'feed__line';
  if (who) {
    const b = document.createElement('b');
    b.textContent = who;
    line.append(b, document.createTextNode(` ${what}`));
  } else {
    line.textContent = what;
  }
  main.appendChild(line);
  if (quote) {
    const q = document.createElement('p');
    q.className = 'feed__quote';
    q.textContent = `“${quote}”`;
    main.appendChild(q);
  }
  const time = document.createElement('time');
  time.className = 'feed__time';
  time.dataset.at = at;
  time.textContent = ago(at);
  li.append(av, main, time);
  feedEl.prepend(li);
  feedEmpty.hidden = true;
  while (feedEl.children.length > FEED_MAX) feedEl.lastElementChild.remove();
  if (!reduceMotion && feedVisible()) gsap.from(li, { y: -10, opacity: 0, duration: 0.5, ease: 'power3.out' });
}

/** Our own action, as it should read in the feed. */
function logMine(kind, what, extra = {}) {
  logEvent({ key: `me:${kind}`, avatar: me?.avatar ?? '🧘', who: t('you'), what, ...extra });
}

/* ---------- Stats + progress ---------- */
const statIncense = $('#stat-incense');
const statKarma = $('#stat-karma');
const statTime = $('#stat-time');
const progressBar = $('#progress-bar');
const progressPct = $('#progress-pct');
const progress = $('#progress');
const burnState = $('#burn-state');
const burnTime = $('#burning-time');
const burnBar = $('#burn-bar');
const dockTime = $('#dock-time');

function updateStats() {
  statIncense.textContent = counters.incense;
  statKarma.textContent = counters.karma;
}

function bump(el) {
  gsap.fromTo(el, { scale: 1.3, color: '#fff' }, { scale: 1, color: '', duration: 0.6, ease: 'elastic.out(1, 0.5)', transformOrigin: '0% 100%' });
}

function addKarma(n = 1) {
  if (roomName) return; // the room's karma is shared; the shrine sends the new total
  counters.karma += n;
  saveCounters(counters);
  updateStats();
  bump(statKarma);
}

const mmss = (s) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;

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
    burnTime.textContent = `${mmss(left)} ${t('left')}`;
    dockTime.textContent = mmss(left);
    burnBar.style.width = `${(left / BURN_SECONDS) * 100}%`;
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
  if (lit) { puff(); return; }
  if (shrine) {
    pendingLightAt = Date.now();
    shrine.send('light');
  } else if (!roomName) {
    counters.incense += 1;
    saveCounters(counters);
    updateStats();
    bump(statIncense);
  }
  ignite(Date.now());
  if (myId) congregation.bow(myId, 3);
  logMine('light', t('fLight'), { toastText: t('litToast') });
}

/** Set the altar burning, `at` being when it was lit (earlier than now for late joiners). */
function ignite(at) {
  const elapsed = (Date.now() - at) / 1000;
  if (elapsed >= BURN_SECONDS) return;
  const fresh = elapsed < 5;
  lit = true;
  litAt = at;

  body.dataset.state = 'lit';
  burnState.textContent = t('lit');
  art.light(BURN_SECONDS);
  if (!fresh) art.syncBurn(elapsed);
  smoke.start();
  petals.rate = 1.4;
  congregation.setLit(true);
  motes.setLit(true);
  hanging.setLit(true);
  tickProgress();

  if (fresh) {
    sound.lighter();
    gsap.delayedCall(0.9, () => sound.bowl(196));
    petals.burst(24);
    kick(20, 1.2);
    // sparks fly off the sticks as they catch, and the light from above flares
    gsap.delayedCall(0.5, () => art.tips().forEach((tip) => motes.burst(tip.x, tip.y, 26)));
    gsap.fromTo('#rays', { filter: 'brightness(2.4)' }, { filter: 'brightness(1)', duration: 2.4, ease: 'power2.out' });
    shockwave();
    // Flash + shake of the burner, like a flame catching
    gsap.timeline()
      .to('.burner', { scale: 1.04, duration: 0.15, ease: 'power2.out' })
      .to('.burner', { scale: 1, duration: 0.8, ease: 'elastic.out(1, 0.4)' })
      .fromTo('.layer--vignette', { filter: 'brightness(1.6)' }, { filter: 'brightness(1)', duration: 1.4, ease: 'power2.out' }, 0);
    gsap.delayedCall(1.2, () => art.bow(3));
  }

  scheduleBurnOut();
}

// The incense burns out after a while; relight for more karma.
// A plain timer rather than gsap.delayedCall: GSAP's ticker pauses in background tabs.
let burnOutTimer = 0;
function scheduleBurnOut() {
  clearTimeout(burnOutTimer);
  burnOutTimer = setTimeout(burnOut, Math.max(0, litAt + (BURN_SECONDS + 1) * 1000 - Date.now()));
}

function burnOut() {
  if (!lit) return;
  clearTimeout(burnOutTimer);
  lit = false;
  body.dataset.state = 'unlit';
  burnState.textContent = t('cold');
  burnTime.textContent = '';
  burnBar.style.width = '0%';
  art.extinguish();
  smoke.stop();
  congregation.setLit(false);
  motes.setLit(false);
  hanging.setLit(false);
  if (shrine) shrine.send('burnout');
  else addKarma(10);
  const what = t(roomName ? 'fBurnout' : 'fBurnoutSolo');
  logEvent({ what, quiet: true, toastText: what });
  gsap.fromTo('#btn-light', { opacity: 0.4 }, { opacity: 1, duration: 0.6, ease: 'power3.out' });
}

// Coming back to a tab that slept: catch the sticks up with the clock.
document.addEventListener('visibilitychange', () => {
  if (document.visibilityState === 'visible' && lit) art.syncBurn((Date.now() - litAt) / 1000);
});

/* ---------- Bowl ---------- */
function ringBowl() {
  sound.unlock();
  const note = gsap.utils.random([174, 196, 220, 261]);
  bowlFx(note);
  addKarma(1);
  logMine('bowl', t('fBowl'));
  shrine?.send('bowl', { note });
}

function bowlFx(note) {
  sound.bowl(note);
  room.pulse();
  shockwave();
  hanging.gust();
  kick(4);
  gsap.fromTo($('#btn-bowl').querySelector('.act__icon'), { rotation: -20 }, { rotation: 0, duration: 1, ease: 'elastic.out(1, 0.3)' });
  gsap.fromTo('.scene', { scale: 1.012 }, { scale: 1, duration: 1.2, ease: 'power2.out' });
}

/** Golden rings roll out across the floor from the foot of the altar. */
function shockwave() {
  if (reduceMotion) return;
  const floor = $('#floor');
  for (let i = 0; i < 3; i++) {
    const ring = document.createElement('span');
    ring.className = 'shock';
    floor.appendChild(ring);
    gsap.fromTo(ring, { scale: 0.3, opacity: 0.95 }, { scale: 4.5 + i * 1.6, opacity: 0, duration: 2 + i * 0.5, delay: i * 0.16, ease: 'power2.out', onComplete: () => ring.remove() });
  }
}

/* ---------- Bow + offerings ---------- */
function bow() {
  sound.unlock();
  bowFx(myId);
  addKarma(2);
  logMine('bow', t('fBow'), { toastText: t('bowed') });
  shrine?.send('bow');
}

/** Someone bows: their figure if they kneel in the room, otherwise the ops team. */
function bowFx(id) {
  if (id && roomName) congregation.bow(id);
  else art.bow(1);
  kick(6);
  sound.tick(392, 0.07);
  gsap.delayedCall(0.5, () => sound.bowl(147));
  gsap.fromTo('.heading', { y: 0 }, { y: 6, duration: 0.5, yoyo: true, repeat: 1, ease: 'sine.inOut' });
}

let lastOffering = null;
function offer() {
  sound.unlock();
  const kinds = Object.keys(OFFERINGS).filter((k) => k !== lastOffering);
  const kind = gsap.utils.random(kinds);
  lastOffering = kind;
  const label = offerFx(kind);
  addKarma(3);
  logMine(`offer:${kind}`, fmt('fOffer', { item: label }), { toastText: fmt('offered', { item: label }) });
  shrine?.send('offer', { kind });
}

function offerFx(kind) {
  const label = art.offer(kind);
  kick(8);
  sound.whoosh();
  gsap.delayedCall(0.35, () => sound.tick(1046, 0.08));
  smoke.puff(0.6);
  gsap.fromTo('.burner', { scale: 1 }, { scale: 1.02, duration: 0.25, yoyo: true, repeat: 1, ease: 'sine.inOut' });
  return label;
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
  gsap.to(['.heading', '.side', '.burner'], { opacity: 0.2, duration: 0.6 });
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
  gsap.to(['.heading', '.side', '.burner'], { opacity: 1, duration: 0.5 });
}

/* ---------- Prayers ---------- */
$('#wish-form').addEventListener('submit', (e) => {
  e.preventDefault();
  sound.unlock();
  const input = $('#wish-input');
  const text = input.value.trim();
  if (!text) { puff(); toast(t('wishEmpty')); return; }
  input.value = '';
  prayerFx(text, roomName ? `${me?.avatar ?? ''} ${t('you')}` : '', false, congregation.element(myId));
  addKarma(3);
  logMine('prayer', t('fPrayer'), { quote: text, toastText: t('wishSent') });
  shrine?.send('prayer', { text });
});

function prayerFx(text, author, quiet = false, from = null) {
  releaseLantern($('#lanterns'), text, from ?? $('.pray'), author);
  if (quiet) return;
  kick(8);
  sound.whoosh();
  gsap.delayedCall(0.6, () => sound.bowl(261));
  petals.burst(8);
}

/* ---------- Smoke puffs (tap the burner, or the lit incense button) ---------- */
function puff() {
  sound.unlock();
  puffFx();
  addKarma(1);
  shrine?.send('puff');
}

function puffFx() {
  sound.tick(520, 0.08);
  kick(2, 0.6);
  smoke.puff(1);
  gsap.fromTo('.burner', { rotation: -2 }, { rotation: 0, duration: 0.8, ease: 'elastic.out(1, 0.3)' });
}

burner.addEventListener('click', light);

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

/* ---------- Shared shrine ---------- */
const DEFAULT_NAMES = ['Sleepy sysadmin', 'On-call monk', 'Intern of the week', 'Senior YAML engineer', 'Database whisperer', 'Kubernetes pilgrim', 'Release shaman', 'Log reader'];
const ACT_ICONS = { light: '🔥', bowl: '🔔', bow: '🙇', offer: '🍜', prayer: '🏮', puff: '💨' };
const joinEl = $('#join');
const joinName = $('#join-name');
const joinAvatars = $('#join-avatars');
const peopleList = $('#people');
const peopleCount = $('#people-count');
const presence = $('#presence');
const roomStatus = $('#room-status');

function enterRoom() {
  body.dataset.mode = 'room';
  art.setOpsTeam(false);
  $('#btn-together').hidden = true;
  $('#btn-invite').hidden = false;
  $('#room-chip').hidden = false;
  $('#room-name').textContent = roomName;
  $('#people-card').hidden = false;
  $('#btn-rename').hidden = false;
  presence.hidden = false;
  $('#join-room').textContent = fmt('roomEyebrow', { room: roomName });
  if (me) connect();
  else openJoin();
}

function openJoin() {
  const current = me ?? { name: gsap.utils.random(DEFAULT_NAMES), avatar: gsap.utils.random(AVATARS) };
  joinName.value = current.name;
  joinAvatars.innerHTML = '';
  for (const a of AVATARS) {
    const b = document.createElement('button');
    b.type = 'button';
    b.className = 'join__avatar';
    b.textContent = a;
    b.setAttribute('role', 'radio');
    b.setAttribute('aria-checked', String(a === current.avatar));
    joinAvatars.appendChild(b);
  }
  joinEl.hidden = false;
  gsap.fromTo(joinEl, { opacity: 0 }, { opacity: 1, duration: 0.4 });
  gsap.fromTo('.join__card', { y: 24, opacity: 0, scale: 0.97 }, { y: 0, opacity: 1, scale: 1, duration: 0.6, ease: 'power3.out', delay: 0.1 });
  setTimeout(() => { joinName.focus(); joinName.select(); }, 50);
}

joinAvatars.addEventListener('click', (e) => {
  const b = e.target.closest('.join__avatar');
  if (!b) return;
  joinAvatars.querySelectorAll('.join__avatar').forEach((x) => x.setAttribute('aria-checked', String(x === b)));
  sound.unlock();
  sound.tick(880, 0.05);
});

$('#join-form').addEventListener('submit', (e) => {
  e.preventDefault();
  sound.unlock();
  const name = joinName.value.trim().slice(0, 24);
  if (!name) return;
  const avatar = joinAvatars.querySelector('[aria-checked="true"]')?.textContent ?? AVATARS[0];
  me = { name, avatar };
  saveMe(me);
  gsap.to(joinEl, { opacity: 0, duration: 0.3, onComplete: () => { joinEl.hidden = true; } });
  sound.bowl(220);
  if (shrine) shrine.rename(me);
  else connect();
});

function connect() {
  shrine = connectRoom(roomName, me, {
    onMessage: onShrineMessage,
    onStatus(status) {
      body.dataset.conn = status;
      roomStatus.dataset.status = status;
      if (status === 'closed' && greeted) toast(t('offline'));
    },
  });
}

function onShrineMessage(msg) {
  switch (msg.t) {
    case 'state': {
      myId = msg.me;
      clockSkew = msg.now - Date.now();
      people.clear();
      for (const p of msg.people) people.set(p.id, p);
      renderPeople();
      syncCounters(msg);
      syncAltar(msg.litAt);
      if (!greeted) {
        greeted = true;
        // Restore what is already on the altar, and the prayers said before we arrived.
        msg.offerings.forEach((kind, i) => gsap.delayedCall(1.6 + i * 0.25, () => art.offer(kind)));
        for (const p of msg.prayers) logEvent({ avatar: p.avatar, who: p.name, what: t('fPrayer'), quote: p.text, at: p.at });
        msg.prayers.slice(-3).forEach((p, i) => gsap.delayedCall(2.4 + i * 1.8, () => prayerFx(p.text, `${p.avatar} ${p.name}`, true)));
      } else {
        toast(t('online'));
      }
      break;
    }
    case 'join':
      people.set(msg.person.id, msg.person);
      renderPeople(msg.person.id);
      logEvent({ avatar: msg.person.avatar, who: msg.person.name, what: t('fJoin'), quiet: true, toastText: `${msg.person.name} ${t('fJoin')}.` });
      sound.tick(660, 0.05);
      break;
    case 'leave': {
      const p = people.get(msg.id);
      people.delete(msg.id);
      renderPeople();
      if (p) logEvent({ avatar: p.avatar, who: p.name, what: t('fLeave'), quiet: true });
      break;
    }
    case 'rename':
      people.set(msg.person.id, msg.person);
      renderPeople();
      break;
    case 'sync':
      syncCounters(msg);
      syncAltar(msg.litAt);
      break;
    case 'act':
      syncCounters(msg);
      if (msg.kind === 'light' || msg.by.id === myId) syncAltar(msg.litAt);
      if (msg.by.id !== myId) remoteAct(msg);
      pingPerson(msg.by.id, ACT_ICONS[msg.kind]);
      break;
  }
}

function remoteAct({ kind, by, note, item, text }) {
  const log = (what, extra = {}) => logEvent({ key: `${by.id}:${kind}${item ? `:${item}` : ''}`, avatar: by.avatar, who: by.name, what, toastText: `${by.name} ${what}.`, ...extra });
  if (kind === 'light') { congregation.bow(by.id, 3); log(t('fLight')); }
  else if (kind === 'bowl') { bowlFx(note); log(t('fBowl')); }
  else if (kind === 'bow') { bowFx(by.id); log(t('fBow')); }
  else if (kind === 'offer') { const label = offerFx(item); if (label) log(fmt('fOffer', { item: label })); }
  else if (kind === 'prayer') { prayerFx(text, `${by.avatar} ${by.name}`, false, congregation.element(by.id)); log(t('fPrayer'), { quote: text, toastText: `${by.name}: “${text}”` }); }
  else if (kind === 'puff') puffFx();
}

/** The shrine is the source of truth for the room's counters. */
function syncCounters({ incense, karma }) {
  if (incense !== undefined && incense !== counters.incense) { counters.incense = incense; updateStats(); bump(statIncense); }
  if (karma !== undefined && karma !== counters.karma) { counters.karma = karma; updateStats(); bump(statKarma); }
}

/** Match our altar to the shrine's: lit since `serverLitAt`, or out (0). */
function syncAltar(serverLitAt) {
  if (serverLitAt === undefined) return;
  if (serverLitAt) {
    pendingLightAt = 0;
    const at = serverLitAt - clockSkew;
    if (!lit) ignite(at);
    else { litAt = at; scheduleBurnOut(); }
  } else if (lit && Date.now() - pendingLightAt > 3000) {
    burnOut();
  }
}

function renderPeople(newId) {
  const list = [...people.values()].sort((a, b) => (b.id === myId) - (a.id === myId));

  // Full list in the side card; your own row opens the rename dialog.
  peopleList.innerHTML = '';
  for (const p of list) {
    const mine = p.id === myId;
    const li = document.createElement('li');
    const row = document.createElement(mine ? 'button' : 'div');
    row.className = 'person';
    row.dataset.id = p.id;
    if (mine) { row.type = 'button'; row.title = t('rename'); }
    const avatar = document.createElement('span');
    avatar.className = 'person__avatar';
    avatar.textContent = p.avatar;
    const name = document.createElement('span');
    name.className = 'person__name';
    name.textContent = p.name;
    row.append(avatar, name);
    if (mine) {
      const tag = document.createElement('span');
      tag.className = 'person__tag';
      tag.textContent = t('you');
      row.appendChild(tag);
    }
    li.appendChild(row);
    peopleList.appendChild(li);
    if (p.id === newId && !reduceMotion) gsap.from(li, { x: -12, opacity: 0, duration: 0.5, ease: 'power3.out' });
  }
  peopleCount.textContent = list.length;
  congregation.set(list, myId);

  // Compact stack in the top bar.
  presence.innerHTML = '';
  for (const p of list.slice(0, 4)) {
    const a = document.createElement('span');
    a.className = 'presence__avatar' + (p.id === myId ? ' presence__avatar--me' : '');
    a.dataset.id = p.id;
    a.textContent = p.avatar;
    presence.appendChild(a);
  }
  const count = document.createElement('span');
  count.className = 'presence__count';
  count.textContent = fmt('prayingCount', { n: list.length });
  presence.appendChild(count);
  presence.title = list.map((p) => p.name).join(', ');
}

/** Someone did something: their row glows and the action's icon floats off it. */
function pingPerson(id, icon) {
  congregation.nudge(id);
  const el = (feedVisible() && peopleList.querySelector(`[data-id="${id}"]`)) || presence.querySelector(`[data-id="${id}"]`);
  if (!el || reduceMotion) return;
  el.classList.add('is-ping');
  setTimeout(() => el.classList.remove('is-ping'), 700);
  if (!icon) return;
  const r = el.getBoundingClientRect();
  const f = document.createElement('span');
  f.className = 'ping';
  f.textContent = icon;
  Object.assign(f.style, { left: `${r.right - 18}px`, top: `${r.top + r.height / 2 - 10}px` });
  document.body.appendChild(f);
  gsap.fromTo(f, { y: 0, opacity: 1, scale: 0.6 }, { y: -28, opacity: 0, scale: 1.2, duration: 1.3, ease: 'power2.out', onComplete: () => f.remove() });
}

peopleList.addEventListener('click', (e) => {
  if (e.target.closest('button.person')) openJoin();
});
presence.addEventListener('click', () => {
  if (feedVisible()) { openJoin(); return; }
  toast(`${t('inShrine')}: ${[...people.values()].map((p) => (p.id === myId ? t('you') : p.name)).join(', ')}`);
});

$('#btn-rename').addEventListener('click', () => { openPanel(false); openJoin(); });

$('#btn-invite').addEventListener('click', async () => {
  sound.unlock();
  const url = `${location.origin}/r/${roomName}`;
  try { await navigator.clipboard.writeText(url); } catch { prompt('Copy this link:', url); }
  toast(t('inviteCopied'));
  sound.tick(990, 0.08);
});

/* ---------- Keyboard shortcuts ---------- */
document.addEventListener('keydown', (e) => {
  if (e.target.matches('input, textarea') || !joinEl.hidden || e.metaKey || e.ctrlKey || e.altKey) return;
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
if (roomName) enterRoom();
