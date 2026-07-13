# Pusheen v2 — Art Asset List (Room Pair #2: Backyard + Kitchen)

Every item below currently ships as a **generated placeholder** (flat graphics in
`Preloader.makeTexture`) — the game is fully playable on placeholders. This list
is the punch-list for replacing them with real art.

## Conventions (important)

- **Size art to its footprint exactly.** By repo convention a sprite's PNG is
  pre-cropped/pre-scaled to match the size the code places it at — the scenes do
  **not** resize sprites. The "Size" column is the target pixel dimension.
- **Backdrops are full-bleed 1280×720** (no transparency). **Sprites are
  transparent PNGs**, subject centered.
- One PNG per key, loaded in `Preloader.preload()` as
  `this.load.image('<key>', 'assets/sprites/<file>.png')`, replacing the matching
  `this.makeTexture('<key>', …)` call.
- Logical canvas **1280×720**; floor band **40px** (`groundTop = 680`). Some
  placements are **tuned to the backdrop** (Sloth's branch height, the kitchen
  counter height) — noted below; expect a small tuning pass once real art lands.
- Style for everything: *flat cartoon illustration in the Pusheen style — thick
  clean outlines, flat solid colors, no gradients/shading, soft rounded corners,
  chunky cute proportions.*

---

## Backyard

| Key | Size (px) | Kind | Notes |
|---|---|---|---|
| `backyardBg` | 1280×720 | backdrop | Afternoon sky + sun + cloud; **large tree on the left with a low, thick horizontal branch** Sloth hangs from; grass along the bottom. Full-bleed. |
| `sloth` | 130×110 | NPC (asleep) | Hanging from the low branch, dozing. Default state. |
| `slothAwake` | 130×110 | NPC (awake) | Same footprint/origin; swaps in during the wake beat (he then drops to the ground and ambles off). |
| *(hidden path)* | 76×150 | door | **Reuses `door.png`.** Sits *behind* where Sloth hangs (x≈300) and is revealed as he ambles clear on waking. A dedicated "garden gate / path opening" sprite would sell it better — optional (needs `Door` to accept a texture opt). |
| *(screen door → Kitchen)* | 76×150 | door | **Reuses `door.png`.** Right wall. Optional dedicated `screenDoor`. |

> **Tuning:** Sloth's hang height is `SLOTH.restHeight` (feel.js) and his x is set
> in `Backyard.js` (currently 300, on the branch). Match to the branch in the
> final `backyardBg`.

## Kitchen

| Key | Size (px) | Kind | Notes |
|---|---|---|---|
| `kitchenBg` | 1280×720 | backdrop | Warm wall + **a window looking onto the backyard** (same sun + tree, for continuity) + a **countertop** running along, cabinets below. The glass and fridge stand on this counter. Full-bleed. |
| `fridge` | 150×160 | container (closed) | The closed fridge in the room. 160 tall so its interaction zone is reachable from the floor (see `FRIDGE_HEIGHT` in `Kitchen.js`). |
| `fridgeInside` | 640×300 | peek-panel backdrop | The **lit fridge interior** shown when it opens — holds the four item icons (juice + three decoys). Analogous to `drawer.png` (520×260) but wider for four items. |
| *(screen door → Backyard)* | 76×150 | door | **Reuses `door.png`.** Left wall. |

## Items (peek-panel icons + counter/carried sprites)

| Key | Size (px) | Notes |
|---|---|---|
| `glass` | 66×84 | Empty glass. Sits **on the counter** (pick it up), and is the carried accessory while holding the empty glass. |
| `orangeJuice` | 66×84 | The **filled glass** she carries after filling it (carried accessory for `held:item === 'juice'`). |
| `juicePitcher` | 96×112 | The **OJ pitcher inside the fridge** — the fridge item that fills her glass. |
| `itemMilk` | 72×96 | Fridge decoy (gentle "nope"). |
| `itemCheese` | 88×66 | Fridge decoy. |
| `itemLeftovers` | 86×68 | Fridge decoy. |

> **Tuning:** the glass's counter seat is `groundTop - 116` in `Kitchen.js`
> (base on the countertop); adjust to the counter height in the final `kitchenBg`.

---

## Reused / shared (already exist — no new art required)

| Key | Where | Note |
|---|---|---|
| `door` | both screen doors + the hidden path | One sprite serves all three doorways. |
| `drawer` | LivingRoom cabinet peek panel | Still used; the fridge uses `fridgeInside` instead. |
| `pusheen`, `pusheencorn` | player | Unchanged; the carry accessory is a separate child sprite (`glass` / `orangeJuice`). |

---

## Optional — P4 cozy extras (not built)

Spec §5, ship only if the core loop lands: `butterfly`, `flower`, `lemon`.

## Not art (generated at runtime)

Cue glyphs — Sloth's sparkles (`✦`), Stormy's hearts (`♥`), sniff notes (`♪`) —
are `add.text`, not sprites. No art needed.
