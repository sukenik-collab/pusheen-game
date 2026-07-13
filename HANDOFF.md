# HANDOFF — v2 "Wake Me for Juice" (Room Pair #2)

Working state for picking this up later. Last updated 2026-07-13.

## Where things stand

- **Branch:** `feat/v2-room-pair-2` (pushed to origin). Based on the v1.5
  refactor, which is **already merged to `main`** — so a PR from this branch to
  `main` shows only the v2 diff and merges cleanly. **Not yet merged (your call).**
- **Build:** `npm run build` passes. **Play:** `npm run dev`.
- **Boot room is the Backyard** (`Preloader` → `Backyard`). The LivingRoom +
  Bedroom are unreachable until you wake Sloth (the connecting gate is
  reveal-gated).

## What this slice is

A garden→kitchen quest that opens up the existing house:

> Meet **Sloth** (asleep, hanging from the backyard tree) → he asks for juice →
> in the **Kitchen**, climb onto the counter for a **glass** → fill it at the
> **fridge** (OJ pitcher) → carry it back → **give it to Sloth** → he wakes,
> drops down, ambles off, and a **garden gate** is revealed → through it to the
> **LivingRoom** (the original snack + nap slice, now reached later).
> "Play again" resets and drops you back in the Backyard.

Full spec: `docs/pusheen-v2-room-pair-2-spec.md`. It plays well as of last
playtest; the art rework below is what's freshest.

## Built & working (P0–P3 + art rework)

- **Rooms:** `Backyard` + `Kitchen` (v1.5 data-driven scenes), screen door
  between them; garden gate → LivingRoom (reveal-gated); LivingRoom gained a
  `fromBackyard` spawn + return door; Play-again transitions to Backyard.
- **Carry system:** `held:item` ∈ none/glass/juice → a Pusheen accessory sprite
  + jump multiplier, re-derived in the Pusheen **constructor** every room and
  kept live via a registry subscription. `setFacing()` flips the accessory.
- **Glass on the counter:** `HeldPickup` entity (direct `take`). Pusheen must
  **climb onto the counter** to reach it — step stool → box → counter, all
  one-way platforms (walk off the edge to drop down).
- **Fridge:** painted into the kitchen backdrop; an invisible `Container` zone
  (`hidden:true`) opens to the lit interior (`fridgeInside` panel) showing the
  **OJ pitcher** (fills the held glass, gated on holding it) among decoys
  (milk/cheese/leftovers) that give the gentle nope.
- **Sloth:** hangs from the branch; flag-branched dialogue; one-time **wake
  beat** (yawn → drop off branch with a bounce → amble left → sparkles) that
  freezes input while it plays. On drop he **nudges Pusheen aside** so the
  revealed gate isn't under her feet — she has to walk to it. Reveal wired via
  `bindReveal('juice:delivered', …)`.
- **Doors:** `Door` takes a `texture` option; screen doors + garden gate use it.

## Real art wired (from `docs/concept-art`)

- `backyard-bg.png` (garden), `kitchen-bg.png`, `sloth-sleeping.png` — all in
  `public/assets/sprites/`, loaded in `Preloader`.

## TODO when you pick this up

1. **Playtest-tune placements** (I couldn't pixel-verify without rendering):
   - **Sloth** size/hang: `SLOTH_ART_SCALE` (Sloth.js), `SLOTH.restHeight`
     (feel.js), `SLOTH_X` (Backyard.js).
   - **Kitchen counter climb:** the standable counter body sits ~20px below the
     painted counter surface, and the hop margins are tight by design — nudge
     `COUNTER_TOP_FROM_GROUND` + `STOOL_H`/`BOX_H` in Kitchen.js.
2. **Missing art:** the **awake Sloth** sprite (`slothAwake`) — the wake beat
   currently plays with the sleeping sprite. Other placeholders (screenDoor,
   gardenGate, stepStool, stepBox, fridgeInside, glass, orangeJuice,
   juicePitcher, item decoys) are generated shapes; see the punch-list.
   → **`docs/pusheen-v2-art-assets.md`** (status + sizes + tuning knobs).
3. **Optional P4 cozy extras** (spec §5): butterflies, flowers, hammock/lemon —
   only if desired.
4. **Merge:** open a PR `feat/v2-room-pair-2` → `main` and merge when happy.

## Key files

- Scenes: `src/scenes/Backyard.js`, `Kitchen.js`, `LivingRoom.js` (house wiring),
  `Preloader.js` (art + placeholders).
- Entities: `src/entities/Sloth.js`, `HeldPickup.js`, `Container.js` (panel +
  hidden), `Door.js` (texture), `Pusheen.js` (carry).
- Config: `src/config/feel.js` (CARRY, SLOTH, SLOTH_RADAR, …),
  `src/config/gameState.js` (run-state keys: held:item, sloth:met,
  glass:taken, juice:delivered).

## Recent commits (newest first)

- `41bb0be` docs: art punch-list update
- `177565a` real kitchen art + climb onto the counter
- `204c68d` real backyard art, door sprites, delivery/reveal flow fix
- `282bfbe` art rework: backdrops, hanging Sloth, counter glass, fridge interior
- `1097789` v2 slice: Backyard + Kitchen, juice quest, connected house
- `56fe8af` v2 infra: held-item carry + content-item gates
