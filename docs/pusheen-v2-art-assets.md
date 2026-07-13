# Pusheen v2 — Art Asset List (Room Pair #2: Backyard + Kitchen)

Every item below currently ships as a **generated placeholder shape** (flat
graphics in `Preloader.makeTexture`, or a flat color rectangle in a scene) — the
game is fully playable on placeholders. This list is the punch-list for
replacing them with real art.

## Conventions (important)

- **Size art to its footprint exactly.** By repo convention a sprite's PNG is
  pre-cropped/pre-scaled to match the size the code places it at — `buildLayout`
  and the entities do **not** resize sprites. The "Size" column is the target
  pixel dimension; deliver at that size (or update the constant noted).
- **One PNG per key**, loaded in `Preloader.preload()` as
  `this.load.image('<key>', 'assets/sprites/<file>.png')`, replacing the
  matching `this.makeTexture('<key>', …)` call.
- Logical canvas is **1280×720**; floor/ground band is **40px** tall
  (`groundTop = 680`).
- Placeholder cues (sparkles/hearts/notes) are **text glyphs**, not art — see
  the last section.

---

## Backyard

| Key | Size (px) | Kind | States | Purpose / notes |
|---|---|---|---|---|
| *(sky backdrop)* | 1280×720 | background | — | Currently a flat `BACKYARD.sky` rectangle. Optional painted afternoon-sky backdrop. |
| *(grass ground)* | 1280×40 | ground band | — | Currently a flat `BACKYARD.grass` rectangle (the physics floor). Optional grass texture. |
| `tree` | 130×230 | background | — | Trunk + canopy. Drawn only (no collision). x≈1080. |
| `hammock` | 280×70 | background | — | Slung cloth Sloth rests on. x≈350. Drawn behind Sloth. |
| `sloth` | 130×110 | NPC | **asleep** | Dozing in the hammock (default state). |
| `slothAwake` | 130×110 | NPC | **awake** | After juice delivery. Swaps in during the wake beat; same footprint/origin as `sloth`. |
| *(screen door → Kitchen)* | 76×150 | door | — | **Reuses existing `door.png`.** A dedicated `screenDoor` sprite would need `Door` to accept a texture opt (small change) — optional. Right wall, x≈1240. |
| *(hidden path → LivingRoom)* | 76×150 | door | hidden → revealed | **Reuses `door.png`**, drawn only after waking Sloth (fades in). Left wall, x≈140. A "garden gate / path opening" reveal sprite would sell §S3 better — optional but recommended. |
| *(fence / back wall)* | — | background | — | Listed in spec §3; **not built**. Add as a background sprite or color band if desired. |

## Kitchen

| Key | Size (px) | Kind | States | Purpose / notes |
|---|---|---|---|---|
| *(wall backdrop)* | 1280×720 | background | — | Currently a flat `KITCHEN.wall` rectangle. |
| *(floor)* | 1280×40 | ground band | — | Currently a flat `KITCHEN.floor` rectangle (physics floor). |
| *(counter)* | 1000×64 | background | — | Currently a flat `0xc9a97a` rectangle band. Optional counter/countertop art. Drawn behind the appliances. |
| `fridge` | 150×160 | container | closed (+ optional open) | The refrigerator (a `Container`; peek opens the panel). Sized to 160 tall so its zone is reachable from the floor — **if you want a taller fridge, keep the interaction zone reachable** (see `FRIDGE_HEIGHT` in `Kitchen.js`). Spec mentions a closed/open pair; the peek panel currently stands in for "open," so an `open` sprite is optional. x≈1050. |
| `cupboard` | 130×130 | container | closed (+ optional open) | Holds the glass. x≈300. Optional `open` variant for cozy toggling (§5). |
| *(screen door → Backyard)* | 76×150 | door | — | **Reuses `door.png`.** Left wall, x≈40. |

## Items (peek-panel icons + carried accessory)

These render both as **icons in the peek panel** (~66–90px) and, for glass/juice,
as the **carried accessory** on Pusheen (reused at 0.6 scale, offset in front of
her). Spec §6 calls for an "in-glass + carried" pair — currently the same sprite
serves both; deliver distinct carried-pose art only if desired.

| Key | Size (px) | Purpose / notes |
|---|---|---|
| `glass` | 66×84 | Empty glass. Cupboard content (`takeHeld`) **and** carried accessory. |
| `orangeJuice` | 66×84 | Glass filled with OJ. Fridge content (`fillHeld`) **and** carried accessory once filled. |
| `mug` | 66×74 | Cozy decoy in the glass cupboard (gentle "nope"). |

---

## Reused / shared (already exist — no new art required)

| Key | Where | Note |
|---|---|---|
| `door` | both screen doors + the hidden path | One sprite serves all three doorways. |
| `drawer` | peek panel background | The container "open" UI; already used by the LivingRoom cabinet. |
| `pusheen`, `pusheencorn` | player | Unchanged; the carry accessory is a separate child sprite. |

---

## Optional — P4 cozy extras (not built; ship only if the core loop lands)

Spec §5. Each is small and behind the core loop.

| Key | Kind | Note |
|---|---|---|
| `butterfly` | wandering sprite | Chase toy; reacts (`playSniffReact`) on approach. |
| `flower` | background + sniff cue | Sniffable, no action. |
| `lemon` | movable arcade body | Battable toy she nudges on overlap. |
| `cupboardOpen` | container state | Open-cupboard variant for cozy toggling. |

---

## Not art (generated at runtime — listed so they aren't mistaken for assets)

- **Cue glyphs:** Sloth's sparkles (`✦`), Stormy's hearts (`♥`), sniff notes
  (`♪`) are `add.text` glyphs, not sprites. Could become particle textures
  later, but need no art now.
- **Sky/floor/counter fills:** flat color rectangles from `feel.js`
  (`BACKYARD`, `KITCHEN`, and the counter color) — replace with backdrops only
  if art is wanted; the game needs none.
