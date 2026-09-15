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
- Style: *flat cartoon Pusheen style — thick clean outlines, flat solid colors,
  no gradients/shading, soft rounded corners, chunky cute proportions.*

---

## Backyard

| Key | Size | Status | Notes |
|---|---|---|---|
| `backyardBg` | 1376×768 | ✅ `backyard-bg.png` | Tree + low branch (left), sun, clouds, grass. Sloth hangs from the branch (~x=700). |
| `sloth` | 1376×768 frame | ✅ `sloth-sleeping.png` | Transparent hanging sloth, prescaled 0.31 in-engine. |
| `slothAwake` | 124×170 | ✅ `sloth-awake.png` | Standing mid-stretch, arms up (from `concept-art/sloth3.png`). Swapped in as he drops off the branch, and worn for the plod. There's no walk-cycle art, so the steps are a waddle tween (`SLOTH.waddleDeg`/`waddleMs`) — real walk frames would replace that, not add to it. |
| `slothSitting` | 190×110 | ✅ `sloth-sitting.png` | Settled on his belly, eyes open (from `concept-art/sloth1.png`). Where the plod ends, and how he's found on re-entry. |
| `gardenGate` | 76×150 | ▫️ placeholder | The revealed hidden path, behind where Sloth hangs. |
| `screenDoor` | 76×150 | ▫️ placeholder | The Backyard→Kitchen screen door (shared with the Kitchen side). |

## Kitchen

| Key | Size | Status | Notes |
|---|---|---|---|
| `kitchenBg` | 1376×768 | ✅ `kitchen-bg.png` | Wall, window-to-backyard, countertop, **and the fridge** all painted in. |
| *(fridge)* | — | ✅ in backdrop | No separate sprite — the fridge is part of `kitchenBg`; the Container is an invisible zone over it (`hidden: true`). |
| `fridgeInside` | 640×300 | ▫️ placeholder | The lit fridge interior shown as the peek-panel backdrop when it opens. |
| `stepStool` | 140×80 | ▫️ placeholder | First climbing step up to the counter. |
| `stepBox` | 120×160 | ▫️ placeholder | Second climbing step. |
| `screenDoor` | 76×150 | ▫️ placeholder | Kitchen→Backyard screen door (same key as above). |

## Items (peek-panel icons + counter/carried sprites)

| Key | Size | Status | Notes |
|---|---|---|---|
| `glass` | 66×84 | ▫️ placeholder | Empty glass — sits on the counter (climb up to take it) + carried accessory. |
| `orangeJuice` | 66×84 | ▫️ placeholder | Filled glass — carried accessory after filling. |
| `juicePitcher` | 96×112 | ▫️ placeholder | The OJ pitcher inside the fridge. |
| `itemMilk` | 72×96 | ▫️ placeholder | Fridge decoy (gentle "nope"). |
| `itemCheese` | 88×66 | ▫️ placeholder | Fridge decoy. |
| `itemLeftovers` | 86×68 | ▫️ placeholder | Fridge decoy. |

---

## Reused / shared (no new art)

`door` (LivingRoom↔Bedroom↔Backyard interior doors), `drawer` (cabinet peek
panel), `pusheen` / `pusheencorn` (carry accessory is a separate child sprite).

## Tuning notes (placement tied to the real backdrops)

- **Sloth** hang height/scale: `SLOTH.restHeight` (feel.js) + `SLOTH_ART_SCALE`
  (Sloth.js) + `SLOTH_X` (Backyard.js).
- **Kitchen counter** climb: the standable counter body sits ~20px below the
  painted counter surface — nudge `COUNTER_TOP_FROM_GROUND` / step heights in
  `Kitchen.js` to line up once art placement is confirmed.

## Optional — P4 cozy extras (not built)

`butterfly`, `flower`, `lemon`.
