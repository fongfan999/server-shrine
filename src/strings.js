export const BRAND = 'Server Shrine';

export const STRINGS = {
  eyebrow: 'Scheduled maintenance',
  title: 'The servers are meditating',
  subtitle: 'The ops team is already praying. Light some incense, make an offering, and the rack will hum again shortly.',
  tagline: 'Pray for uptime, together.',
  madeBy: 'Made by',

  // Dock
  light: 'Light incense',
  burning: 'Burning',
  bowl: 'Ring bowl',
  bow: 'Bow',
  offer: 'Offer',
  breathe: 'Breathe',
  wishLabel: 'Say a prayer to the servers',
  wishPlaceholder: 'Say a prayer to the servers…',

  // Side cards
  inShrine: 'In the shrine',
  soloLabel: 'Praying alone',
  soloText: 'Open a shared shrine and send the link to your team. Everyone’s incense, offerings and prayers land on the same altar, live.',
  soloCta: 'Open a team shrine',
  feedLabel: 'Activity',
  feedEmpty: 'Quiet so far. Light the incense to begin.',
  vitalsLabel: 'Rack 42 vitals',
  cold: 'Incense is cold',
  lit: 'Incense burning',
  left: 'left',
  statIncense: 'Incense lit',
  statKarma: 'Karma',
  statTime: 'Meditating',
  progressLabel: 'Enlightenment',
  backAt: 'back at',
  backIn: 'Back in',
  anyMoment: 'Back any moment now',

  // Rooms
  together: 'Pray with your team',
  togetherShort: 'Team',
  invite: 'Invite',
  roomEyebrow: 'Shared shrine / {room}',
  joinTitle: 'Enter the',
  joinTitleAccent: 'shrine',
  joinHint: 'Your team is praying for the servers. What should the rack call you?',
  joinBtn: 'Kneel at the altar',
  inviteCopied: 'Invite link copied. More devotees, faster recovery.',
  prayingCount: '{n} praying',
  connecting: 'Connecting to the shrine…',
  offline: 'Lost the shrine. Reconnecting…',
  online: 'Back in the shrine.',
  you: 'You',
  rename: 'rename',
  renameBtn: 'Change name',

  // Activity feed: "{who} {what}"
  fLight: 'lit the incense',
  fBowl: 'rang the bowl',
  fBow: 'bowed to rack 42',
  fOffer: 'offered {item}',
  fPrayer: 'sent a prayer',
  fPuff: 'wafted the smoke',
  fJoin: 'knelt at the altar',
  fLeave: 'went back to work',
  fBurnout: 'The incense burned down. +10 karma for the room.',
  fBurnoutSolo: 'The incense burned down. +10 karma.',

  // Settings
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

  // Toasts
  litToast: 'Incense lit. The servers feel it.',
  wishSent: 'Your prayer floats up to the cloud.',
  wishEmpty: 'A silent prayer still counts.',
  bowed: 'The ops team bows. Rack 42 hums approvingly.',
  offered: 'The servers accept {item}.',
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
