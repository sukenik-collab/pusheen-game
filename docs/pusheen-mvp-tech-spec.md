# Pusheen Cozy Game — MVP Tech Spec
*"The Living Room Snack Hunt" vertical slice*

Status: draft v0.1 · Companions: Product Brief (the why + success/kill criteria), Design Doc (the feel targets) · Project memory: CLAUDE.md

This spec is written to be **delegatable to Claude Code**. It defines architecture, structure, and the implementation specifics that carry the "feel," then a checklist and a phased build plan with a testable checkpoint at each step.

---

## 1. Purpose & scope
Build one playable screen that answers a single question: *is cozy, no-stakes pottering actually fun?* Everything here serves that. No costumes, no interconnection, no time system, no persistence. Placeholder art throughout.

## 2. Architecture at a glance
A **client-only static web game**. No backend, no database, no network calls — the entire game is HTML/JS/CSS + asset files served from a CDN.

Runtime shape (standard Phaser):
```
Phaser.Game (src/main.js)
 ├─ Preloader scene   → loads all assets, then starts LivingRoom
 ├─ LivingRoom scene  → the world: player, furniture, interactions, physics
 └─ UI scene          → runs in parallel, on top: snack counter,
                        cabinet-peek overlay, "So Cozy!" card
```
The UI runs as a **separate parallel scene** launched over LivingRoom so overlays and HUD don't tangle with world logic. (For the MVP this can collapse into containers inside LivingRoom if simpler — but the split is cleaner and cheap.)

## 3. Stack
- **Phaser 4** game framework (scaffolded via the official `@phaserjs/game` CLI, Vite + JavaScript template).
- **Vite** dev server + bundler (hot reload; `npm run dev`, builds to `dist/`).
- **Vanilla JavaScript**, ES modules.
- **Netlify** static hosting, auto-deploy from GitHub on push.
- **Node.js 22** for tooling.

## 4. Project structure
```
pusheen-cozy/
├─ index.html                 # mounts the game
├─ vite/ or vite.config.*     # from the template (relative base path)
├─ CLAUDE.md                  # project memory for Claude Code
├─ public/
│  └─ assets/
│     ├─ sprites/             # placeholder shapes / later art
│     └─ audio/               # lo-fi loop + SFX
└─ src/
   ├─ main.js                 # Phaser.Game config + scene list
   ├─ config/
   │  └─ feel.js              # ALL tunable feel constants in one place
   ├─ scenes/
   │  ├─ Preloader.js
   │  ├─ LivingRoom.js
   │  └─ UI.js
   └─ entities/
      ├─ Pusheen.js
      ├─ Cabinet.js
      ├─ Cushion.js
      ├─ Snack.js
      ├─ Sunbeam.js
      └─ Box.js               # optional hiding spot
```

## 5. Core systems

### 5.1 Movement (arcade physics)
Arcade physics owns locomotion and ground collision only. Pull all numbers from `config/feel.js`:
- Horizontal: acceleration, max velocity, drag (so she eases in and coasts to rest).
- Vertical: gravity + a single jump impulse from the ground.
- She should feel plump and unhurried — low top speed, visible accel/decel ramp.

### 5.2 Squash & stretch (tweens — the tactile core)
Driven entirely by tweens, triggered off events (landing, contact) — **not** physics side effects.
- On land (detect ground contact): tween the cat's scale to `y:0.85 / x:1.12` over ~90ms, then back to `1.0` over ~120ms with `Back.easeOut`. The paired x-stretch fakes volume conservation; the overshoot gives bounce.
- Keep a subtle idle tween always running: vertical bob (±2–3px sine) + faint scale breathing, so a resting cat still looks alive.

### 5.3 Couch cushion
On the cat landing on the cushion: tween the cushion to `y:0.9 / x:1.05` over ~100ms with a small yoyo rebound; run the cat's land-squash simultaneously; play a soft squish SFX. Purely cosmetic — no gameplay effect.

### 5.4 Snack radar (anticipation)
Two concentric `Phaser.Geom.Circle` sensor zones centered on the cabinet:
- **Outer "sniff" (~140px):** on entry, fire the cue once — a nose-twitch tween on the cat + one floating note/"!" that rises and fades. Reset the "already fired" flag on exit so it can re-trigger next approach. Never spam it.
- **Inner "interact" (~64px):** while inside, enable the peek action and show a gentle prompt.
Test overlap against these geometry zones, not pixel-perfect sprite overlap. Outer strictly larger than inner so the cue *precedes* the action.

### 5.5 Cabinet peek (UI overlay)
Approach (inner zone) → interact → UI scene eases in a "cozy zoom" panel (slight scale-up, soft ease — reads as leaning in, not a menu). Panel shows a 2–3 item grid, one is the snack. Select snack → it lifts out, panel eases closed, collection state updates.

### 5.6 Snack collection & goal state
On collect: set `snackCollected = true` in the Phaser **registry** (game-wide data), and increment the on-screen counter (`0/1 → 1/1`) in the UI scene. No inventory object, no persistence.

### 5.7 The sunbeam nap (level complete)
Only armed once `snackCollected` is true. On entering the sunbeam zone: lock input → ~0.5s settle → curl-up tween (~0.6s) → UI fades in a "So Cozy!" card (hold ~2s) → drift soft dust-mote particles in the beam → gently soften/swell the music. Slow and warm; give the beat room.

### 5.8 Hiding box (optional, cheap)
Enter box → brief pause/hide → pop out. No reward, no effect. Ship only if it costs near-zero.

## 6. Input (keyboard + touch, both from day one)
- **Keyboard:** Left/Right (or A/D) to move, Space/Up to jump, a single action key (e.g. E) to peek/interact.
- **Touch (tablet):** on-screen controls rendered in the UI scene — left/right buttons, a jump button, and a context action button that appears when in an interact zone. Wire via Phaser pointer events. Keep buttons large, soft, and unobtrusive.
- Route both input paths into the **same** intent functions (`moveLeft()`, `jump()`, `interact()`) so there's one code path to tune.

## 7. State management
Minimal. A tiny amount of game state in the Phaser registry:
- `snackCollected: boolean`
- `snackCount: number` (0 or 1 for the MVP)
- `inputLocked: boolean` (true during the nap sequence)
No save/load, no localStorage — the slice is a single sitting.

## 8. Assets
Placeholder-first. Keep names stable so real art can drop in later without code changes.

**Sprites** (`public/assets/sprites/`): pusheen (plump oval), cabinet, couch + cushion (separate so the cushion can tween), window + sunbeam, snack, note/"!" cue, optional box. Simple shapes or rough sketches are fine.

**Audio** (`public/assets/audio/`): one lo-fi loop (background), squish (cushion), a soft collect chime (snack), a cozy sigh (nap). Optional signature: a kid-recorded "mrrp." Source CC0/royalty-free (Kenney packs for UI/collect SFX, Freesound for organic foley, Pixabay Music / Incompetech / OpenGameArt for the loop). **Wire audio in early** — it carries half the vibe.

## 9. Dev setup & deploy
Build locally against Vite's hot-reload dev server; GitHub is the source of truth; Netlify auto-builds a public link on every push. No backend, so hosting is free and trivial.

```bash
# 1. Scaffold (choose: Web Bundler → Vite → JavaScript)
npm create @phaserjs/game@latest pusheen-cozy
cd pusheen-cozy && npm install
npm run dev            # http://localhost:8080, hot reload

# 2. Repo (template already inits git + .gitignore for node_modules/dist)
git add -A && git commit -m "Scaffold Phaser + Vite MVP"
gh repo create pusheen-cozy --private --source=. --push

# 3. Claude Code (native installer recommended)
curl -fsSL https://claude.ai/install.sh | bash   # (Windows: irm https://claude.ai/install.ps1 | iex)
claude --version
claude                 # run from the repo folder

# 4. Deploy: Netlify → Import from GitHub → build `npm run build`, publish `dist`
#    (Vite auto-detected). Every push redeploys the shared link.
```
Optional cleanup: the template ships a `log.js` telemetry file (sends only template name + Phaser version); delete it if you'd rather not.

## 10. Setup checklist
- [ ] Install Node.js 22 (LTS), confirm `node --version`.
- [ ] Install git; set `user.name` / `user.email`.
- [ ] Scaffold with `npm create @phaserjs/game@latest` → Vite → JavaScript.
- [ ] `npm install`, confirm `npm run dev` serves at :8080.
- [ ] (Optional) delete `log.js`.
- [ ] Add `CLAUDE.md` to the repo root.
- [ ] Add `src/config/feel.js` with the starting feel constants.
- [ ] Commit; create **private** GitHub repo; push.
- [ ] Install Claude Code (native installer); `claude --version`; run `claude` in the repo.
- [ ] Pull in Phaser 4's `skills/` (AI agent skills) so the agent uses current APIs.
- [ ] Create a free Netlify account; import the repo; set build `npm run build` / publish `dist`.
- [ ] Confirm the deploy pipeline with a trivial change (see Phase 0) before writing game code.

## 11. Build phases & checkpoints
Each phase ends in a commit + deploy, so there's always a live link. Checkpoints are the **honest feel questions**, not "does it run." Phases are ordered to de-risk the scariest thing (does movement feel good?) as early as possible.

**Phase 0 — Prove the pipeline (infra, no game).**
Empty scene renders a background rectangle. Push → confirm the Netlify link updates and opens on a phone/tablet.
- ✅ Checkpoint: the whole loop (edit → push → live shared link) works *before* any gameplay exists.

**Phase 1 — Movement feel (the core risk / kill gate).**
Plump oval walks and jumps with accel/drag/gravity from `feel.js`, plus idle bob and land-squash. Bare screen, nothing else.
- ✅ Checkpoint: does just moving her around already feel pleasant and cat-like? Tune the numbers here. **If this isn't fun, stop and rethink the concept before building more** (this is the brief's kill gate).

**Phase 2 — The room + couch juice.**
Placeholder furniture laid out; couch cushion squash tween + squish SFX.
- ✅ Checkpoint: does bouncing on the couch delight? Does the physical feedback make you want to poke at things?

**Phase 3 — Radar + cabinet peek.**
Two sensor zones, the sniff cue, the cozy-zoom cabinet overlay, collect → counter increments.
- ✅ Checkpoint: without any instructions, does "sense something → look inside → found it!" read clearly and feel satisfying?

**Phase 4 — The payoff nap.**
Sunbeam arms after collection; control lock → curl → "So Cozy!" → dust motes → music beat.
- ✅ Checkpoint: does finishing the goal feel warm and earned? Does a first-time tester smile at the nap?

**Phase 5 — Audio pass + tuning (kill gate #2: the full loop).**
Full mix — loop + all SFX + optional "mrrp" — then a pass over the whole feel-tuning checklist end to end.
- ✅ Checkpoint: play the entire ~2–3 min loop. Does the tester (your kid) want to do it *again* / open it again tomorrow? That "again?" is the green light.

**Phase 6 — Optional hiding box.**
Only if Phase 5 passed and it's near-free. Pure charm.

## 12. Go / no-go
After Phase 5, evaluate against the Product Brief's success and kill criteria. Green → the concept is proven and worth growing (revisit the deferred metroidvania/costume/time decisions). Flat → you've learned something real and cheap, before building a whole house.
