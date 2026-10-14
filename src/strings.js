export const STRINGS = {
  eyebrow: 'Scheduled maintenance',
  title: 'The servers are meditating',
  subtitle: 'Light some incense, breathe with us, and everything will be back shortly.',
  light: 'Light the incense',
  bowl: 'Ring the bowl',
  breathe: 'Breathe',
  wishLabel: 'Send a wish to the servers',
  wishPlaceholder: 'May the uptime be with you…',
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
  wishSent: 'Your wish floats up to the cloud.',
  wishEmpty: 'An empty wish is still a wish. +1 karma.',
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
