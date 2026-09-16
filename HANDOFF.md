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
- **`sloth-hanging.png`** replaces `sloth-sleeping.png`: a draped four-limb grip,
  cut from art generated *with* a branch drawn through it. The branch is keyed
  back out, so the gap under his paws is a hole the tree's own branch fills.
  `SLOTH.restHeight` is derived from that registration — see the comment on it.
- `kitchen-bg.png` and the two awake poses (`sloth-awake.png` standing
  mid-stretch, `sloth-sitting.png` settled on his belly, cut from
  `docs/concept-art/sloth3.png` and `sloth1.png`) are unchanged. All three Sloth
  poses are now pre-cropped to display size and swap in at scale 1.
- **Known mismatch:** the hanging pose's fur reads cooler than the two awake
  ones (`#BF9E7B` vs `#D9AF87`/`#E0B179`), so he changes shade when he wakes.
  Pre-existing — the retired `sloth-sleeping.png` was `#C8A180` — but still
  visible. Fix by tinting one side to the other; which way is a taste call.

## TODO when you pick this up

1. **Playtest-tune placements** (I couldn't pixel-verify without rendering):
   - **Sloth** hang: `SLOTH.restHeight` (feel.js), `SLOTH_X` (Backyard.js), and
     `TREE_X`/`TREE_SCALE`/`GRASS_TOP` for the scenery around him. `restHeight`
     is derived from `TREE_SCALE`, so re-derive it if the tree is rescaled.
   - **Kitchen counter climb:** the standable counter body sits ~20px below the
     painted counter surface, and the hop margins are tight by design — nudge
     `COUNTER_TOP_FROM_GROUND` + `STOOL_H`/`BOX_H` in Kitchen.js.
2. **Missing art:** the remaining placeholders (screenDoor, gardenGate,
   stepStool, stepBox, fridgeInside, glass, orangeJuice, juicePitcher, item
   decoys) are generated shapes; see the punch-list.
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
