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
  A door also **arms only once Pusheen is clear of its zone**, so it can't fire
  on someone already standing in it. That is load-bearing, not defensive: the
  garden gate is revealed at exactly the spot she stands to hand over the juice,
  and without it the delivery yanked her to the LivingRoom in the same frame —
  before the wake beat played or the gate had even faded in.
- **Sloth's post-wake line is a costume Easter egg**, not an unreachable branch.
  He settles past the gate, so hearing it takes the Pusheencorn high jump to
  clear the gate (normal jump is 36px short; costumed clears by 75px). Spec §4
  has the numbers and, importantly, the two things not to "fix" — a grounded-only
  door trigger or a shorter `SLOTH.amblePx` would each quietly remove it.

## Real art wired

- **The Backyard is layered**, not one painted backdrop. `Backyard.create()`
  stacks sky → clouds → sun → grass → hedge → tree back to front (creation order
  is depth order). Sky and grass are `add.rectangle` fills; hedge, sun and cloud
  are generated in `Preloader`; only `backyard-tree.png` is art. That split is
  what lets the branch be scaled and placed to the pixel, which is how Sloth
  came to actually grip it instead of hanging near it.
- **The hanging Sloth wraps the branch** as two layers the tree draws
  between: `sloth-hanging-back.png` (just his far arms, under the tree) and
  `sloth-hanging-front.png` (head, body, near arms and all four paws hooked
  over the top, over it). Both are cut together by `tools/cut_sloth.py` from
  art generated *with* a branch through it, which is keyed out. The back
  layer lives outside Sloth's container (a container draws all its children
  at one depth), so `Sloth.syncBackLayer` copies the front's transforms onto
  it every frame — any tween moves both. The hanging pose also pivots on
  `SLOTH.gripRow`, where his claws hook over, so breathing and the yawn keep
  his paws on the branch instead of lifting them. This replaced a single
  sprite with a hole the branch had to fill to the pixel, whose far arms ended
  in flat tops that read as cut off in front of the branch.
  `SLOTH.restHeight` is derived from the same registration — see the comment
  on it.
- **`backyard-tree.png`** re-cut from a second tree source, drawn alone on flat
  magenta rather than fused into a whole-scene mockup. `cut_tree.py` keys that
  by default now (`--no-magenta` keeps the original whole-scene source
  working); same halo fix as the sloth's. Branch geometry moved by a couple
  of px (`SLOTH.restHeight` 159 → 160) — re-derived, not eyeballed; see the
  comment on it.
- **The kitchen's two climbing steps are real art:** a step stool and a
  mint rolling cart (`step-stool.png`, `step-cart.png`), cut by
  `tools/cut_prop.py`. Both are drawn in 3/4 view, so she doesn't stand on a
  sprite's top edge (that's the far rim); the sprites are drawn only and she
  lands on invisible one-way ledges halfway back across each top face, the
  same way the counter already worked. The script sizes each step so that
  face sits at the step's height, which stayed 80/160/240.
- `kitchen-bg.png` and the two awake poses (`sloth-awake.png` standing
  mid-stretch, `sloth-sitting.png` settled on his belly, cut from
  `docs/concept-art/sloth3.png` and `sloth1.png`) are unchanged. All three Sloth
  poses are now pre-cropped to display size and swap in at scale 1.

## TODO when you pick this up

1. **Playtest-tune placements** (I couldn't pixel-verify without rendering):
   - **Sloth** hang: `SLOTH.restHeight` (feel.js), `SLOTH_X` (Backyard.js), and
     `TREE_X`/`TREE_SCALE`/`GRASS_TOP` for the scenery around him. `restHeight`
     is derived from `TREE_SCALE`, so re-derive it if the tree is rescaled.
   - **Kitchen counter climb:** the hop margins are tight by design (each
     rise is 80px of a ~82px hop). Heights are `STOOL_TOP`/`CART_TOP`/
     `COUNTER_TOP_FROM_GROUND` in Kitchen.js; the step art is sized to them,
     so moving one means re-cutting that step (see `tools/README.md`).
2. **Missing art:** the remaining placeholders (screenDoor, gardenGate,
   fridgeInside, glass, orangeJuice, juicePitcher, item decoys) are
   generated shapes; see the punch-list.
   → **`docs/pusheen-v2-art-assets.md`** (status + sizes + tuning knobs).
   The awake Sloth poses are done — the wake beat now stretches, plods clear
   on the standing pose (a waddle tween carries the steps; there's no
   walk-cycle art) and flops onto the sitting pose where he stops.
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
