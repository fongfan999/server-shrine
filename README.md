# The servers are meditating 🧘

A zen maintenance page. Light the incense, ring the bowl, breathe, send a wish
to the servers, and wait for enlightenment (or the deploy to finish, whichever
comes first).

Built with [Vite](https://vite.dev), [GSAP](https://gsap.com) and the Web Audio
API, deployed on [Cloudflare Workers](https://developers.cloudflare.com/workers/)
with static assets.

## Features

- **GSAP everywhere** – staggered title reveal, elastic burner entrance,
  pointer parallax, petals, floating wish lanterns, breathing guide, toasts.
- **No image or audio files** – the incense burner is inline SVG (the sticks
  really burn down), the server room is drawn procedurally with hundreds of
  blinking LEDs, the smoke sprite is painted at runtime, and the music is
  generative ambient synthesized in the browser. Only the logo is a file.
- **Sound** – generative drone, pads, pentatonic bells and wind, plus one-shot
  effects: lighter strike, singing bowl, lantern whoosh, UI ticks, breath pads.
- **Canvas smoke** – incense smoke rises from each live ember tip; ambient fog
  drifts across the server room.
- **Customizable** – title, subtitle, "back at" time, four themes, and toggles
  for music/effects/petals/fog. Open the ⚙ panel or use URL params.
- **Keyboard** – `L` light · `B` bowl · `Space` breathe · `M` mute · `T` theme.
- **Worker API** – `GET /api/status` returns JSON, `GET /api/health` returns `om`.

## URL parameters

| Param      | Values                                   | Example                        |
| ---------- | ---------------------------------------- | ------------------------------ |
| `title`    | any text                                 | `?title=Back+in+5+minutes`     |
| `subtitle` | any text                                 | `?subtitle=Deploying+v2.0`     |
| `eta`      | ISO 8601 date/time                       | `?eta=2026-10-14T18:30:00Z`    |
| `theme`    | `gold` `jade` `sakura` `ember`           | `?theme=jade`                  |
| `music` `sfx` `petals` `fog` | `1` / `0`              | `?petals=0&fog=0`              |

The settings panel's **Copy share link** button builds this URL for you.

## Develop

```bash
npm install
npm run dev        # Vite dev server at http://localhost:5173
```

## Run the Worker locally

```bash
npm run cf:dev     # builds, then wrangler dev at http://localhost:8787
```

## Deploy

```bash
npx wrangler login # once
npm run deploy
```

To serve from your own hostname, add a `routes` entry to `wrangler.jsonc`.

## Project layout

```
index.html          page shell
src/main.js         wiring, intro timeline, interactions
src/burner.js       inline-SVG incense burner (burn-down, embers, shine)
src/serverRoom.js   procedural SVG server room with blinking LEDs
src/audio.js        Web Audio sound kit (one-shot effects)
src/music.js        generative ambient music
src/smoke.js        incense smoke particles (runtime sprite)
src/fog.js          ambient fog
src/petals.js       falling petals (GSAP)
src/lanterns.js     wish lanterns (GSAP)
src/config.js       settings: URL params > localStorage > defaults
src/strings.js      copy and mantras
src/styles.css      design tokens + themes
public/assets/      logo only
worker/index.js     Cloudflare Worker (API + asset headers)
wrangler.jsonc      Worker config
```
