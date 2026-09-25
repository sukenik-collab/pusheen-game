# HANDOFF

Where the game stands and how it hangs together. Last updated 2026-09-25.
**What to do next is in [`ROADMAP.md`](ROADMAP.md)**; this file is the state
of play.

## Start here next time

1. Open `ROADMAP.md` at **Now**. Item 1 (the invisible fridge labels) is a
   quick win; item 2 (the art batch) needs you to generate images first,
   using `docs/art-prompts.md`.
2. `npm run dev` serves the game at http://localhost:8080 (it boots in the
   Backyard). `npm run build` must pass before any PR.
3. Work on a branch; `main` is what's live.

## Where things stand

- **`main` is the playable build.** Netlify deploys it to
  https://pusheen-game.netlify.app/ on every merge, and every PR gets its
  own deploy preview (the Netlify bot comments the link).
- **Nothing is in flight.** v2 ("Wake Me for Juice", Room Pair #2) and the
  art work since are all merged.
- **Signed off at the last playtest:** Sloth's hang from the branch and the
  kitchen climb.

## The game today

One small connected house. It boots in the Backyard:

> Meet **Sloth**, asleep on the backyard tree. He'd like juice. In the
> **Kitchen**, climb two cardboard boxes onto the counter for a **glass**,
> fill it at the **fridge**, and carry it back. He wakes, drops down, ambles
> off, and a **garden gate** appears. Through it is the **LivingRoom**, the
> original slice: the snack in the cabinet, Stormy's lost yarn and the
> sunbeam nap, then "Play again".

The **Bedroom** is off the LivingRoom. Its costume box turns Pusheen into
Pusheencorn, whose floatier jump reaches the high shelf. There are no fail
states, timers or enemies anywhere.

## Art: what's real and what isn't

- **Real, cut from `docs/concept-art/` by the scripts in `tools/`:** the
  backyard tree, the hanging Sloth (two layers), and the kitchen boxes. See
  `tools/README.md`.
- **Real, from earlier work:** the kitchen backdrop, Sloth's awake and
  sitting poses, and the original rooms' sprites (Pusheen, Pusheencorn,
  Stormy, furniture). Some of those were cut from concept art; others are
  SVGs in `scripts/new-room-art.html`, rasterized by
  `scripts/gen-new-room-art.mjs`.
- **Still placeholder shapes** (drawn in `Preloader.makeTexture`): the
  garden gate, the screen door, the fridge interior, the glass and juice
  glass, the OJ pitcher, milk, cheese and leftovers. Prompts to generate
  them are in `docs/art-prompts.md`; sizes and status in
  `docs/pusheen-v2-art-assets.md`.
- **Audio** is synthesized CC0 placeholders;
  `public/assets/audio/CREDITS.md` suggests real replacements.

## Load-bearing details (don't "fix" these)

- **Doors arm only once Pusheen is clear of their zone.** The garden gate
  appears exactly where she stands to hand over the juice. Without this,
  the delivery warped her to the LivingRoom mid wake-up.
- **Sloth's post-wake line is a costume Easter egg.** He settles past the
  gate, so hearing it takes Pusheencorn's jump (a normal jump is 36px
  short). A grounded-only door trigger or a shorter `SLOTH.amblePx` would
  quietly remove it; the v2 spec §4 has the numbers.
- **The kitchen hops are tight on purpose.** Each rise is 80px of a ~82px
  hop. `LOW_BOX_TOP`, `TALL_BOX_TOP` and `COUNTER_TOP_FROM_GROUND` in
  `Kitchen.js` and the box art are cut to each other, so change them
  together (`tools/README.md`).
- **The box ledges are narrower than the boxes on purpose:** inset by her
  half-width less 10px, so she can't stand on thin air past an edge. The
  counter's ledge isn't inset, because its painted top runs on past both
  ends.
- **The hanging Sloth is two layers with the tree drawn between them.** The
  back layer lives outside his container, and `Sloth.syncBackLayer` copies
  his transforms onto it every frame. The hang pivots on `SLOTH.gripRow`,
  so breathing keeps his paws on the branch. `SLOTH.restHeight` is derived
  from the tree and sprite geometry: re-derive it, don't eyeball it (the
  comment on it in `feel.js` shows how).
- **In the Backyard, creation order is depth order** (sky, clouds, sun,
  grass, hedge, tree). There's no `setDepth`.

## How the pieces fit

- **Rooms** are data-driven (the v1.5 refactor): each scene has a `LAYOUT`
  of passive furniture (`src/systems/roomBuilder.js`), interactables
  register with `InteractionController`, and doors name the room and spawn
  point they lead to (`src/scenes/roomTransition.js`).
- **Run state** lives in the Phaser registry (`src/config/gameState.js`:
  `held:item`, `sloth:met`, `glass:taken`, `juice:delivered`, …). "Play
  again" resets it.
- **Carrying:** `held:item` (none, glass or juice) sets Pusheen's accessory
  sprite and a gentler jump (`CARRY` in `feel.js`).
- **Reveals:** `bindReveal(flag, …)` (`src/systems/Reveal.js`) fades the
  garden gate in when `juice:delivered` flips.
- **The UI scene** (`src/scenes/UI.js`) runs alongside the rooms: the HUD,
  the touch buttons, and the peek panel for the cabinet and fridge.
- **Tunables** are all in `src/config/feel.js`.

## Docs map

| File | What it's for |
|---|---|
| `ROADMAP.md` | What's next, in order, and a log of decisions |
| `HANDOFF.md` | This file: the state of play |
| `CLAUDE.md` | Working rules for Claude sessions |
| `docs/art-prompts.md` | Gemini prompts for the art still missing |
| `docs/pusheen-v2-art-assets.md` | Every v2 sprite: size, status, tuning notes |
| `tools/README.md` | How concept art becomes sprites |
| `docs/pusheen-mvp-product-brief.md` | The why, plus the success and kill criteria |
| `docs/pusheen-mvp-design-doc.md`, `pusheen-mvp-tech-spec.md`, `pusheen-v1.5-refactor-spec.md`, `pusheen-v2-room-pair-2-spec.md` | The specs as built: feel targets and architecture history |
