# Pusheen Cozy Game

***Pusheen's Lazy Afternoon*** — a small, cozy fan game: a plump cat potters
around a little connected house. She fetches juice to wake Sloth in the
backyard, finds a snack, helps Stormy find her yarn, and naps in a sunbeam,
while a shy butterfly drifts about the yard and now and then lands on her
head. No enemies, no timer, no fail state. It exists to test one thing — is
guided, low-stakes pottering around a house actually delightful, or just
pleasant-but-boring? See
`docs/pusheen-mvp-product-brief.md` for the full hypothesis and success
criteria.

An unofficial, non-commercial fan project; not affiliated with Pusheen Corp.

![screenshot](screenshot.png)

## Play it

Live build: deployed to Netlify from `main` on every push. 

https://pusheen-game.netlify.app/

## Controls

| Action | Keyboard | Touch |
|---|---|---|
| Move | Arrow keys / A, D | On-screen `<` / `>` buttons |
| Jump | Space / W / Up | On-screen `^` button |
| Interact (talk, open/close the cabinet or fridge, take an item) | E | On-screen `E` button |
| Select an item in the cabinet or fridge | 1 – 4 | Tap the item |
| Play again (after the nap) | Space | Tap the button |
| Music / SFX menu | — | ♪ button, top-right |

## Stack

- **Phaser 4** + **Vite**, vanilla JavaScript (no TypeScript, no backend).
- Static client only, deployed on **Netlify** from `main`.
- Node.js 22 for tooling.

## Getting started

```bash
npm install
npm run dev      # dev server at http://localhost:8080
npm run build    # production build to dist/
```

## Project structure

| Path | Contents |
|---|---|
| `src/main.js` | Phaser game config + scene list |
| `src/config/` | `feel.js` (all tunable movement/animation constants), `gameState.js` (run state), `audioManifest.js` (music + SFX sets) |
| `src/scenes/` | `Preloader`, the four rooms (`Backyard`, `Kitchen`, `LivingRoom`, `Bedroom`), `UI` (HUD, controls, peek panel; runs alongside) |
| `src/entities/` | One class per game object — `Pusheen`, `Sloth`, `Stormy`, `Butterfly`, `Container`, `Door`, … |
| `src/systems/` | Shared wiring: data layouts, interactions, reveals |
| `src/audio/AudioController.js` | Music/SFX playback, ducking, mute |
| `tools/` | Python scripts that cut concept art into sprites and the page's icons |
| `public/assets/` | Sprites and audio, served as static files |
| `docs/` | Specs, the art asset list and art prompts, and the concept art |

## Audio

The music starts with Pusheen's first move (a walk or a jump), not at
load. The shipped music and SFX are synthesized CC0 placeholders (generated via
`scripts/gen-placeholder-audio.mjs`) so the game has a real, working audio
layer to playtest with. Each track/SFX set in `src/config/audioManifest.js`
notes a recommended real replacement — see `public/assets/audio/CREDITS.md`.
Swapping to real audio is a drop-in-the-file-and-change-a-path change, no
logic changes needed.

## Status

Where things stand is in `HANDOFF.md`; what's next, in order, is in
`ROADMAP.md`. There's no automated test suite by design — the game is
validated through playtesting against the feel-based success criteria in
`docs/pusheen-mvp-product-brief.md`, not a checklist of features. See
`CLAUDE.md` for the project's working rules and `docs/` for the full spec set.
