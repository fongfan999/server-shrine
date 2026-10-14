export const STRINGS = {
  eyebrow: 'Scheduled maintenance',
  title: 'The servers are meditating',
  subtitle: 'The ops team is already praying. Light some incense, make an offering, and the rack will hum again shortly.',
  light: 'Light the incense',
  burning: 'Incense burning',
  bowl: 'Ring the bowl',
  bow: 'Bow',
  offer: 'Make an offering',
  breathe: 'Breathe',
  wishLabel: 'Say a prayer to the servers',
  wishPlaceholder: 'Please don’t crash during the demo…',
  statIncense: 'incense lit',
  statKarma: 'karma',
  statTime: 'in meditation',
  progressLabel: 'Enlightenment',
  backAt: 'back at',
  backIn: 'back in',
  anyMoment: 'back any moment now',
  panelTitle: 'Customize',
  fTitle: 'Title',
  fSubtitle: 'Subtitle',
  fEta: 'Back at',
  fTheme: 'Theme',
  fMusic: 'Background music',
  fSfx: 'Sound effects',
  fPetals: 'Falling petals',
  fFog: 'Ambient fog',
  copyLink: 'Copy share link',
  reset: 'Reset',
  panelHint: 'Everything here is also a URL parameter, e.g. ?title=…&theme=jade&petals=0',
  copied: 'Link copied. Share the calm.',
  lit: 'Incense lit. The servers feel it.',
  wishSent: 'Your prayer floats up to the cloud.',
  wishEmpty: 'A silent prayer still counts. +1 karma.',
  bowed: 'The ops team bows. Rack 42 hums approvingly.',
  offered: 'The servers accept {item}.',
  offeredFull: 'The altar is full. The servers are pleased, and slightly overwhelmed.',
  burnedOut: 'The incense has burned out. The servers are enlightened.',
  inhale: 'Inhale',
  hold: 'Hold',
  exhale: 'Exhale',
  mantras: [
    'Clearing cache and karma…',
    'Rebooting chakras…',
    'Aligning load balancers with the moon…',
    'Garbage-collecting bad vibes…',
    'Flushing DNS and attachments…',
    'Waiting for the pods to find inner peace…',
    'Namaste. Propagation takes 24–48h.',
    'Retrying with exponential compassion…',
    'The database is in a deep state of lock.',
    'Scaling horizontally, breathing vertically…',
    'Turning it off and om again…',
    'Kubernetes is also just trying its best.',
    'Resolving merge conflicts of the soul…',
    'Have you tried unplugging your expectations?',
    'Your request is important to the universe.',
    'The ops team has removed their shirts. It is serious now.',
    'Bowing to rack 42, three times, as is tradition…',
    'Offering a Red Bull to the load balancer…',
    'Chanting the runbook in a low voice…',
    'Asking the senior engineer to look at it. He is also praying.',
    'Sacrificing a junior dev’s weekend…',
    'Lighting one more stick for the primary database.',
  ],
};

export const t = (key) => STRINGS[key] ?? key;

/** Apply strings to every [data-i18n] / [data-i18n-placeholder] element. */
export function applyStrings(overrides = {}) {
  document.querySelectorAll('[data-i18n]').forEach((el) => {
    const key = el.dataset.i18n;
    const val = overrides[key] || t(key);
    if (el.textContent !== val) el.textContent = val;
  });
  document.querySelectorAll('[data-i18n-placeholder]').forEach((el) => {
    el.placeholder = t(el.dataset.i18nPlaceholder);
  });
}
