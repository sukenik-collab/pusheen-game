# Pusheen v2 — Art Asset List (Room Pair #2: Backyard + Kitchen)

Status of each asset: **✅ real art** (wired from `docs/concept-art`), or
**▫️ placeholder** (generated shape in `Preloader.makeTexture`, awaiting art).
The game is fully playable either way. Gemini prompts for the placeholders
are in `docs/art-prompts.md`.

## Conventions

- **Size art to its footprint.** Sprites are placed at native size (the scenes
  don't resize them), except the two room backdrops, which are scaled to the
  1280×720 canvas via `setDisplaySize`. The "Size" column is the target.
- **Backdrops** are full-bleed (no transparency). **Sprites** are transparent
  PNGs, subject centered.
- Loaded in `Preloader.preload()` — real art via `this.load.image('<key>',
  'assets/sprites/<file>.png')`, placeholders via `this.makeTexture('<key>', …)`.
- The cut assets (`backyard-tree.png`, `sloth-hanging-front.png`,
  `sloth-hanging-back.png`) are generated from `docs/concept-art/` by
  **`tools/`** — see `tools/README.md`. Re-run those rather than hand-editing
  if you change the source art; they also print the geometry
  `SLOTH.restHeight` and `SLOTH.gripRow` are derived from. `step-boxes.png`
  is cut by `tools/cut_boxes.py`, which prints what the kitchen places it
  and its ledges from.
- Style: *flat cartoon Pusheen style — thick clean outlines, flat solid colors,
  no gradients/shading, soft rounded corners, chunky cute proportions.*

---

## Backyard

The Backyard is **layered**, not a single backdrop: the scene stacks sky, clouds,
sun, grass, hedge and tree back-to-front (creation order = depth order). That is
what lets the branch be scaled and placed to the pixel where Sloth grips it.
Sky (`#BACBF4`) and grass (`#80A56F`) are `add.rectangle` fills, not images.

| Key | Size | Status | Notes |
|---|---|---|---|
| `tree` | 850×771 | ✅ `backyard-tree.png` | Trunk + canopy + the low branch, transparent. Drawn at `TREE_SCALE` with its base on `groundTop` (Backyard.js). The branch is level and 44px thick over the stretch Sloth hangs from; leaf sprigs sit past it at the tip. Re-cut (via `tools/cut_tree.py`) from a clean tree-alone-on-magenta source — see `tools/README.md`. |
| `bushes` | 1280×96 | ▫️ generated | The scalloped hedge along the horizon, carrying the horizon line at `BACKYARD.bushLine`. |
| `sun` | 190×190 | ▫️ generated | Flat disc + eight chunky rays. |
| `cloud` | 210×116 | ▫️ generated | One lump, placed twice at different scales. |
| `slothHangingFront` | 180×159 | ✅ `sloth-hanging-front.png` | Draped over the branch, all four paws hooked over its top: head, body, near arms and paws. Drawn *over* the tree. Cut from art generated *with* a branch through it, which is keyed out. Fur matches the awake poses' tone. |
| `slothHangingBack` | 180×159 | ✅ `sloth-hanging-back.png` | Just his far arms, which pass behind the branch — drawn *under* the tree, same size and position as the front layer, so the branch lands between them. Both cut together by `tools/cut_sloth.py`. |
| `slothAwake` | 124×170 | ✅ `sloth-awake.png` | Standing mid-stretch, arms up (from `concept-art/sloth3.png`). Swapped in as he drops off the branch, and worn for the plod. There's no walk-cycle art, so the steps are a waddle tween (`SLOTH.waddleDeg`/`waddleMs`) — real walk frames would replace that, not add to it. |
| `slothSitting` | 190×110 | ✅ `sloth-sitting.png` | Settled on his belly, eyes open (from `concept-art/sloth1.png`). Where the plod ends, and how he's found on re-entry. |
| `gardenGate` | 128×150 | ✅ `garden-gate.png` | The revealed hidden path, behind where Sloth hangs (from `concept-art/garden_gate.jpg`). Wider than a doorway on purpose: two decorative posts (ivy on the left, the latch on the right) flank the 5-picket panel that actually swings, so the walk-into zone is sized to just that panel — 87px, `zoneWidth` in Backyard.js's `Door` call — not the sprite's own 128px. Cut by `tools/cut_prop.py --posts`, which reports the panel bounds; re-run it and copy the new width in if the art changes. |
| `backyardBg` | — | ⛔ retired | Replaced by the layer stack above. |
| `screenDoor` | 87×150 | ✅ `screen-door.png` | The Backyard→Kitchen screen door (shared with the Kitchen side), from `concept-art/screen_door.jpg`. Cut by `tools/cut_prop.py`. |
| `butterflyBody` | 11×32 | ✅ `butterfly-body.png` | Body + antennae, from `concept-art/butterfly.jpg`. One of five pieces in `Butterfly.js`'s rig — see below. |
| `butterflyWingUL`/`UR`/`LL`/`LR` | 29×23 / 29×23 / 27×20 / 26×20 | ✅ `butterfly-wing-{ul,ur,ll,lr}.png` | The four wing quadrants, flapped independently (scaleX around each one's own attachment corner). All five cut together by `tools/cut_butterfly.py`, which splits the art at the body's own centre point; see `tools/README.md` for why each wing's crop reaches a little past that split. |

## Kitchen

| Key | Size | Status | Notes |
|---|---|---|---|
| `kitchenBg` | 1376×768 | ✅ `kitchen-bg.png` | Wall, window-to-backyard, countertop, **and the fridge** all painted in. |
| *(fridge)* | — | ✅ in backdrop | No separate sprite — the fridge is part of `kitchenBg`; the Container is an invisible zone over it (`hidden: true`). |
| `fridgeInside` | 640×350 | ✅ `fridge-inside.png` | The lit fridge interior shown as the peek-panel backdrop when it opens, from `concept-art/fridge_inside.jpg`. Cut by `tools/cut_prop.py --width 640`. The items stand on its shelf: `PANEL_SHELVES` in `UI.js` holds the shelf line and back-wall span measured from this art, so re-measure them if it's re-cut (see Tuning notes). |
| `stepBoxes` | 295×176 | ✅ `step-boxes.png` | The climb to the counter: a short and a tall cardboard box, one sprite, taped shut with shipping labels (from `concept-art/kitchen_boxes.jpg`). Cut by `tools/cut_boxes.py`, scaled so the middle of each top face sits 80 and 160px up, where she lands on invisible ledges -- not the sprite's top edge, which is a top face's far rim. Replaced the `stepStool` / `stepBox` placeholders. |
| `screenDoor` | 87×150 | ✅ `screen-door.png` | Kitchen→Backyard screen door (same key and file as above). |

## Items (peek-panel icons + counter/carried sprites)

| Key | Size | Status | Notes |
|---|---|---|---|
| `glass` | 66×84 | ✅ `glass.png` | Empty glass — stands on the counter top (climb up to take it) + carried accessory. From `concept-art/glasses.jpg` (both glasses in one image), cut by `tools/cut_items.py`. Its base is `GLASS_SET_BACK` (Kitchen.js) behind the counter's front lip, in front of the mugs. |
| `orangeJuice` | 66×84 | ✅ `orange-juice.png` | Filled glass — carried accessory after filling. Same source and cut as `glass`, so the two match exactly. |
| `juicePitcher` | 94×100 | ✅ `juice-pitcher.png` | The OJ pitcher inside the fridge, from `concept-art/fridge_items.jpg` (all four items in one image), cut by `tools/cut_items.py --same-scale 100`: one scale for all four, so they keep the sizes they were drawn at relative to each other. Its handle/spout ended up mirrored from the original prompt (handle right, spout left) — left as-is, purely cosmetic. |
| `itemMilk` | 63×99 | ✅ `item-milk.png` | Fridge decoy (gentle "nope"). Same source and cut as the pitcher. |
| `itemCheese` | 69×64 | ✅ `item-cheese.png` | Fridge decoy. Same source and cut as the pitcher. |
| `itemLeftovers` | 75×66 | ✅ `item-leftovers.png` | Fridge decoy. Same source and cut as the pitcher. |

---

## Reused / shared (no new art)

`door` (LivingRoom↔Bedroom↔Backyard interior doors), `drawer` (cabinet peek
panel), `pusheen` / `pusheencorn` (carry accessory is a separate child sprite).

## Tuning notes (placement tied to the real backdrops)

- **Sloth** hang height: `SLOTH.restHeight` (feel.js) + `SLOTH_X` (Backyard.js).
  `restHeight` is *derived*, not eyeballed — it puts the tree's branch where
  his art's own branch was, from `TREE_SCALE` and the branch's offsets in the
  tree art. Re-derive it if `TREE_SCALE` moves; the comment on it in feel.js
  has the numbers. The sprite size is baked into the two hanging layers, so
  changing how big he is means re-cutting them.
- **Tree** placement: `TREE_X` / `TREE_SCALE`, and `GRASS_TOP` for the horizon
  (all Backyard.js). The branch must stay thick enough to hide his far arms'
  cut tops (`tools/cut_sloth.py` prints how high they reach).
- **Kitchen counter** climb: floor → short box (80) → tall box (160) →
  counter (240), each rise just inside a normal hop. The counter ledge puts
  her at its painted front lip. The boxes are *cut to* those heights, so
  changing one means re-cutting with a matching `stand` in
  `tools/cut_boxes.py`, then copying what it prints into `Kitchen.js`'s
  `LAYOUT` and `LEDGES`.
- **Fridge shelf**: `PANEL_SHELVES.fridgeInside` in `UI.js` is measured from
  `fridge-inside.png`, in panel-centre coordinates: item bases on `shelfY`
  (between the shelf's back edge, +28, and front edge, +43), the row spread
  from `left` to `right` inside the back wall (-214..+213), labels in the
  lower compartment. The four items' widths plus the gaps have to fit that
  span, so a bigger `--same-scale` re-cut may need a wider span or smaller
  items.
- **Garden gate** walk-into zone: `Door`'s `zoneWidth` opt (Backyard.js),
  sized to the picket panel alone, not the sprite's decorative posts. Re-cut
  with `tools/cut_prop.py --posts` and copy in the new panel width if the art
  changes; see `Door.js`'s comment on `zoneWidth` for why it's per-instance.
- **Butterfly rig**: the five origins in `Butterfly.js` (`BODY_ORIGIN`,
  `WING_ORIGIN`) are exactly what `tools/cut_butterfly.py` prints on every
  re-cut — copy them in whole, don't hand-tune, they're where the pieces
  physically meet. Her size is the cut's `--width` (53px wingspan, the
  script's default): re-cut to resize her rather than scaling her in code.
  `BUTTERFLY_BOUNDS` (Backyard.js) is the sky above the grass line; its
  top and bottom keep her on screen, its sides reach 90px past the screen
  edges so she can slip briefly off either side.
- **Butterfly perch**: `HEAD_TOP` in `Pusheen.js` is where it lands, in px
  from her sprite's centre facing left — between the ears on
  `pusheen.png`, and just below the horn tip on `pusheencorn.png` (lower on
  her head, it hides the horn). Re-measure both if either sprite is
  redrawn. `PERCH_SPOTS` in `Sloth.js` does the same for Sloth, per pose:
  px from the top-left of `sloth-hanging-front.png` (on the branch over his
  crown) and `sloth-sitting.png` (his head, with a lean, and his back).
  Re-place them if either pose is redrawn. `BUTTERFLY.perchLift`
  (feel.js) is how far above each point the butterfly's centre sits, so its
  lower wings rest on it.

## Optional — P4 cozy extras (not built)

`flower` and `lemon` are parked under Later (`ROADMAP.md`).
