# Pusheen v2 — Art Asset List (Room Pair #2: Backyard + Kitchen)

Status of each asset: **✅ real art** (wired from `docs/concept-art`), or
**▫️ placeholder** (generated shape in `Preloader.makeTexture`, awaiting art).
The game is fully playable either way.

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
| `gardenGate` | 76×150 | ▫️ placeholder | The revealed hidden path, behind where Sloth hangs. |
| `backyardBg` | — | ⛔ retired | Replaced by the layer stack above. |
| `screenDoor` | 76×150 | ▫️ placeholder | The Backyard→Kitchen screen door (shared with the Kitchen side). |

## Kitchen

| Key | Size | Status | Notes |
|---|---|---|---|
| `kitchenBg` | 1376×768 | ✅ `kitchen-bg.png` | Wall, window-to-backyard, countertop, **and the fridge** all painted in. |
| *(fridge)* | — | ✅ in backdrop | No separate sprite — the fridge is part of `kitchenBg`; the Container is an invisible zone over it (`hidden: true`). |
| `fridgeInside` | 640×300 | ▫️ placeholder | The lit fridge interior shown as the peek-panel backdrop when it opens. |
| `stepBoxes` | 295×176 | ✅ `step-boxes.png` | The climb to the counter: a short and a tall cardboard box, one sprite, taped shut with shipping labels (from `concept-art/kitchen_boxes.jpg`). Cut by `tools/cut_boxes.py`, scaled so the middle of each top face sits 80 and 160px up, where she lands on invisible ledges -- not the sprite's top edge, which is a top face's far rim. Replaced the `stepStool` / `stepBox` placeholders. |
| `screenDoor` | 76×150 | ▫️ placeholder | Kitchen→Backyard screen door (same key as above). |

## Items (peek-panel icons + counter/carried sprites)

| Key | Size | Status | Notes |
|---|---|---|---|
| `glass` | 66×84 | ▫️ placeholder | Empty glass — sits on the counter (climb up to take it) + carried accessory. |
| `orangeJuice` | 66×84 | ▫️ placeholder | Filled glass — carried accessory after filling. |
| `juicePitcher` | 112×112 | ▫️ placeholder | The OJ pitcher inside the fridge. |
| `itemMilk` | 72×100 | ▫️ placeholder | Fridge decoy (gentle "nope"). |
| `itemCheese` | 96×76 | ▫️ placeholder | Fridge decoy. |
| `itemLeftovers` | 86×68 | ▫️ placeholder | Fridge decoy. |

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

## Optional — P4 cozy extras (not built)

`butterfly`, `flower`, `lemon`.
