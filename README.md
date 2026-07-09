# Pusheen Cozy Game

A tiny, single-screen "vibe-slice": a plump cat wanders a cozy living-room
corner, peeks in a cabinet, finds a snack, and naps in a sunbeam. No enemies,
no timer, no fail state. This MVP exists to test one thing — is guided,
low-stakes pottering around a room actually delightful, or just pleasant-but-
boring? See `docs/pusheen-mvp-product-brief.md` for the full hypothesis and
success criteria.

![screenshot](screenshot.png)

## Play it

Live build: deployed to Netlify from `main` on every push. 

https://pusheen-game.netlify.app/

## Controls

| Action | Keyboard | Touch |
|---|---|---|
| Move | Arrow keys / A, D | On-screen `<` / `>` buttons |
| Jump | Space / W / Up | On-screen `^` button |
| Interact (open/close cabinet, take item) | E | On-screen `E` button |
| Select item in the cabinet | 1 / 2 / 3 | Tap the item |
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
| `src/config/feel.js` | All tunable movement/animation constants |
| `src/config/audioManifest.js` | Music tracks + SFX sets available in-game |
| `src/scenes/` | `Preloader`, `LivingRoom` (gameplay), `UI` (HUD/controls, parallel scene) |
| `src/entities/` | One class per game object — `Pusheen`, `Cabinet`, `Cushion`, `Sunbeam` |
| `src/audio/AudioController.js` | Music/SFX playback, ducking, mute |
| `public/assets/` | Sprites and audio, served as static files |
| `docs/` | Product brief, design doc, tech spec — the why, the feel targets, the architecture |

## Audio

The shipped music and SFX are synthesized CC0 placeholders (generated via
`scripts/gen-placeholder-audio.mjs`) so the game has a real, working audio
layer to playtest with. Each track/SFX set in `src/config/audioManifest.js`
notes a recommended real replacement — see `public/assets/audio/CREDITS.md`.
Swapping to real audio is a drop-in-the-file-and-change-a-path change, no
logic changes needed.

## Status

All five build phases (movement, room, cabinet, nap payoff, audio) are done
and merged to `main`. There's no automated test suite by design — the MVP is
validated through playtesting against the feel-based success criteria in
`docs/pusheen-mvp-product-brief.md`, not a checklist of features. See
`CLAUDE.md` for the project's working rules and `docs/` for the full spec set.
