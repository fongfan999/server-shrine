# Server Shrine 🪔

When the servers are down, the team prays together. Open a shrine, send the
link to your teammates, and light incense, ring the bowl, bow, make offerings
and send prayers to the rack, all in real time on one shared altar.

Inspired by every "I haven't been able to reach the server for an hour" thread,
and the classic photo of sysadmins praying to a rack with incense. A
[Wot Da Fong](https://wotdafong.dev/) project.

Built with [Vite](https://vite.dev), [GSAP](https://gsap.com) and the Web Audio
API, running on [Cloudflare Workers](https://developers.cloudflare.com/workers/)
with a [Durable Object](https://developers.cloudflare.com/durable-objects/) per
shrine.

## How it works

- `/` is a solo shrine. It also works as a maintenance page (custom title,
  subtitle and "back at" time).
- `/new` redirects to a freshly named shared shrine, e.g. `/r/serene-rack-42`.
- `/r/:room` asks for a name and avatar, then joins that room's `Shrine`
  Durable Object over a WebSocket. The room keeps the shared state: who is
  here, incense burn time, karma, the offerings on the table and the last 12
  prayers. Late joiners see the incense mid-burn and the prayers they missed.
- Durable Objects use the WebSocket Hibernation API, so idle shrines cost
  nothing. A shrine nobody visits for 30 days deletes itself.

## Features

- **Shared altar**: everyone sees and hears every action, and the activity
  feed shows who did what (repeats fold into "rang the bowl ×3").
- **The congregation**: everyone in the room kneels in front of the altar with
  their name above them, in rows when the team is big. They bow when they
  bow, and their prayer lanterns rise from where they kneel.
- **Rack 42 vitals**: a heart monitor that flatlines while the incense is cold
  and beats faster with more people and more devotion.
- **Atmosphere**: a camera push down the server corridor on load, light rays
  and dust over the altar, red paper lanterns, sparks when the incense
  catches, golden shockwaves across the floor when the bowl rings, and the
  whole room warming up while it burns.
- **Drawn, not downloaded**: the incense burner is inline SVG (the sticks
  really burn down), the server room is procedural, the smoke is painted at
  runtime, and the ambient music is synthesized in the browser.
- **Customizable**: title, subtitle, "back at" time, four themes, toggles for
  music/effects/petals/fog. Open the settings panel or use URL params.
- **Keyboard**: `L` light · `B` bowl · `P` bow · `O` offer · `Space` breathe ·
  `M` mute · `T` theme.
- **Worker API**: `GET /api/status` (JSON), `GET /api/health` (`om`),
  `GET /api/rooms/:room/ws` (WebSocket).

## URL parameters

| Param      | Values                                   | Example                        |
| ---------- | ---------------------------------------- | ------------------------------ |
| `title`    | any text                                 | `?title=Back+in+5+minutes`     |
| `subtitle` | any text                                 | `?subtitle=Deploying+v2.0`     |
| `eta`      | ISO 8601 date/time                       | `?eta=2026-10-14T18:30:00Z`    |
| `theme`    | `gold` `jade` `sakura` `ember`           | `?theme=jade`                  |
| `music` `sfx` `petals` `fog` | `1` / `0`              | `?petals=0&fog=0`              |

They work on room pages too: `/r/serene-rack-42?theme=jade`.

## Develop

```bash
npm install
npm run dev        # Vite + the Worker and Durable Object in workerd, http://localhost:5173
```

`npm run preview` builds and serves the production bundle locally.

## Deploy

```bash
npx wrangler login # once
npm run deploy
```

To serve from your own hostname, add a `routes` entry to `wrangler.jsonc`.

## Project layout

```
index.html          page shell
src/main.js         wiring, intro, actions, activity feed, shared-shrine client
src/room.js         room URL, saved name, reconnecting WebSocket
src/burner.js       inline-SVG incense burner (burn-down, embers, offerings)
src/serverRoom.js   procedural SVG server room with blinking LEDs
src/audio.js        Web Audio sound kit (one-shot effects)
src/music.js        generative ambient music
src/smoke.js        incense smoke particles (runtime sprite)
src/fog.js          ambient fog
src/petals.js       falling petals (GSAP)
src/lanterns.js     prayer lanterns (GSAP)
src/congregation.js teammates kneeling at the altar
src/motes.js        dust in the light, sparks
src/hanging.js      red paper lanterns
src/vitals.js       rack 42 heart monitor
src/config.js       settings: URL params > localStorage > defaults
src/strings.js      brand name, copy and mantras
src/styles.css      design tokens, themes, layout
public/favicon.svg  the mark
worker/index.js     Cloudflare Worker: routes, /new, API, asset headers
worker/shrine.js    Shrine Durable Object: one per room
wrangler.jsonc      Worker + Durable Object config
```
