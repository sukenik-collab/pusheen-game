# CLAUDE.md — Pusheen Cozy Game

Project memory for Claude Code. Keep this file lean and directive — it's read every session.

## What this is
A cozy 2D fan game: a plump cat potters around a small connected house (Backyard, Kitchen, LivingRoom, Bedroom). She fetches juice to wake Sloth, finds a snack, helps Stormy find her yarn, and naps in a sunbeam. We are testing a **feeling**, not shipping a full game.

**Start each session with `HANDOFF.md` (where things stand) and `ROADMAP.md` (what's next, in order).** Specs live in `/docs`: the Product Brief is the why plus the success and kill criteria, the Design Doc the feel targets, and the Tech Spec, v1.5 and v2 specs how it was built.

## Stack
- **Phaser 4** + **Vite**, **vanilla JavaScript** (no TypeScript).
- Static client only — **no backend, no database, no server calls.** One planned exception: a cookieless analytics script (`ROADMAP.md`, Next). Amend this line when adding it, and allow nothing else.
- Deployed on **Netlify**, auto-built from the GitHub repo on push to `main`. Every PR gets a deploy preview.
- Node.js 22 for tooling.

## Golden rules (do not violate)
1. **Expressive motion = tweens, never physics.** Squash, stretch, bounce, tilt, idle bob → Phaser tweens. Arcade physics is only for movement and ground/collision.
2. **Squash reads as volume-conserving:** pair y-squash with x-stretch (e.g. `y:0.85 / x:1.12`), and give the rebound a slight overshoot (`Back.easeOut`). Never a plain shrink.
3. **Proximity cues = `Phaser.Geom.Circle` sensor zones.** Two concentric zones: outer "sniff" radius fires the cue, smaller inner radius enables the action. **Outer must be larger** so the cue *leads* the player.
4. **No fail states, no timers, no enemies. Ever.** If a mechanic adds stress or urgency, it's wrong for this game — stop and flag it.
5. **Art goes through the pipeline.** Real art is generated (Gemini, prompts in `docs/art-prompts.md`) on flat magenta and cut to size by the scripts in `tools/`. Never hand-edit a cut sprite; re-run its script. Anything without art yet stays a generated placeholder shape (`Preloader.makeTexture`), and that's fine.
6. **Stay tiny.** No inventory (a snack is a counter; carrying is a single held item). No time/weather/dream systems. Anything that grows the game goes into `ROADMAP.md` first.
7. **Audio is first-class.** Wire the lo-fi loop and SFX early, not as a final polish step — the vibe depends on it.
8. **Support keyboard *and* touch from the start** — playtesting happens on a tablet.

## Session interaction rules (how you operate)
- **"Confirm", "check", "verify", "look at" = read-only.** Do not execute an irreversible action (push, merge, delete, overwrite, `--force`, deploy) unless I explicitly say "execute" (or "execute and confirm"). A verify request is never a license to act.
- **Never push, merge, deploy, or delete on your own initiative** — those are my calls.
- **Branch discipline:** when I ask you to commit, commit to a working branch, not `main`. `main` is what Netlify deploys and what gets playtested, so it must always be in a playable state. Merging to `main` happens at working checkpoints, and I do it.
- **No new dependencies or `npm install`s without asking first.** Keep the dependency tree minimal (Phaser + Vite tooling is basically it).
- **Ask before large refactors or restructuring.** Prefer focused, reversible changes over sweeping ones.
- **Commit at working states**, one logical change per commit, with a clear message.

## Feel targets (starting seeds, tune by playtest)
Assume ~1280×720 logical canvas. All of these live in `src/config/feel.js`.
- Move: accel ~1200, max speed ~180, drag ~1000 (px/s / px/s²) — plump, coasts to a stop.
- Jump: gravity ~1400, jump velocity ~-480 — a modest hop.
- Land squash: cat `y:0.85 / x:1.12` ~90ms, return to 1.0 ~120ms with `Back.easeOut`.
- Cushion: `y:0.9 / x:1.05` ~100ms with small yoyo.
- Sniff radius ~140px (outer) vs interact radius ~64px (inner).
- Idle: subtle ±2–3px vertical sine + faint scale "breathing" so she's never static.

## Structure
- `src/main.js` — Phaser.Game config + scene list.
- `src/config/` — `feel.js` (ALL tunable feel constants in one place), `gameState.js` (run-state registry keys), `audioManifest.js`.
- `src/scenes/` — one scene per file: `Preloader`, the four rooms (`Backyard`, `Kitchen`, `LivingRoom`, `Bedroom`), and `UI` (HUD, touch controls, peek panel), which runs alongside them.
- `src/entities/` — one game object per file (`Pusheen`, `Sloth`, `Stormy`, `Container`, `Door`, `HeldPickup`, …).
- `src/systems/` — shared wiring: `roomBuilder` (data layouts), `InteractionController`, `Reveal`.
- `src/audio/AudioController.js` — music and SFX.
- `tools/` — Python scripts that cut concept art into sprites (`tools/README.md`).
- `public/assets/` — sprites and audio, served at runtime.
- `/docs` — specs, the art asset list, the art prompts, and `concept-art/` (the sources `tools/` cuts from).

## Conventions
- ES modules; one class per file; small, named functions over clever one-liners.
- **Scenes stay thin** (orchestration/wiring); gameplay logic lives in the entity classes.
- **No premature abstraction** — don't build systems/managers until there are 2–3 real callers.
- Comment the *intent* of a tween ("squash on land"), not the syntax.

## Verification / test strategy
The test strategy is **human playtests** answering feel questions ("does this delight?", "does my kid want to play again?"). **No automated test suite yet:** the core metric is subjective feel, and a test suite for Phaser rendering, tweens and input is high-effort for near-zero return at this stage. A real test setup is a deliberate later decision.

Before calling a change to play, placement or art done, run the real game in a browser (Playwright with the preinstalled Chromium) and check it with real key input and screenshots.

## Definition of done
Not "the cabinet opens." It's: does moving around, the juice quest, finding the snack and the nap payoff make a first-time player (a kid, or a stranger from Reddit) want to do it again? If the loop is pleasant-but-boring after ~90s, that's a finding — surface it, don't paper over it.

## When unsure
If a change might add stress, scope, or complexity beyond the slice, ask before building it.
