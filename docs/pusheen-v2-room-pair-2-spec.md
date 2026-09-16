# Pusheen — v2 Spec: Room Pair #2, "Wake Me for Juice"

**Status:** authoritative. **Depends on v1.5** (`pusheen-v1.5-refactor-spec.md`) —
every room here is expressed in v1.5's vocabulary (data layout + typed
interactable factory + interaction controller + container/gate/reveal + named
spawn points + the jump-modifier seam). Only **three** genuinely new systems.

> **v1.5 is now implemented** (branch `feat/v1.5-refactor`, pending playtest +
> merge as of 2026-07-13). Building it surfaced several concrete lessons that
> revise the sections below — they're marked ⚠️ inline (S1, S2, §2a) and
> collected in **§7**. Read those before starting a phase.

Golden rules still bind: **no fail states, no timers, no urgency.** Placeholder
art is fine. Tweens for expressive motion; arcade physics only for movement.

---

## 1. The slice

- **Title:** Wake Me for Juice
- **Theme:** lazy summer afternoon.
- **Emotional goal:** help a sleepy friend; the world quietly opens up.
- **Rooms:** Backyard ⇄ Kitchen (screen door between them).
- **New mechanic:** carrying a held item.

**Quest flow:** meet **Sloth** (asleep in a hammock, asks for juice) → in the
**Kitchen** find a **glass** in a cupboard → **fill it** with orange juice at the
**refrigerator** → carry it back → **give it to Sloth** → Sloth wakes, leaves the
hammock, and a **hidden path** is revealed. Permanent (within the run; a
"Play again" resets it).

---

## 2. The three new systems

### S1 — Held-item state (the carry mechanic)
- Registry key **`held:item`** ∈ `'none' | 'glass' | 'juice'`. Add to
  `resetRunState`.
- **Visual:** a small accessory sprite parented to the **Pusheen container**
  (not to `this.visual`) at a `CARRY.offset`, so it is *not* scaled by the
  squash/idle tweens that target `this.visual` — same reasoning as the costume-
  sprite note.
  - ⚠️ **Flip is NOT automatic (v1.5 lesson).** Facing is stored as
    `this.visual.setFlipX(...)` inside `moveLeft`/`moveRight` — on the *visual*,
    not the container. A container-child accessory therefore does **not** turn
    with her for free (the "flips with her" assumption is wrong against the real
    code). Cleanest fix: add a `Pusheen.setFacing(dir)` that flips `this.visual`
    **and** the accessory (mirroring its x-offset), and call it from
    `moveLeft`/`moveRight`.
- ⚠️ **Re-apply in the Pusheen *constructor*, not room `create()` (v1.5
  lesson).** Pusheen is **reconstructed every room**, and `jumpVelocityMultiplier`
  resets to its default `1` on each construction. So the constructor must
  re-derive *both* the accessory sprite **and** the carry multiplier from
  `held:item` — the same place and pattern by which the costume re-applies from
  `costume:pusheencorn`. Miss the multiplier and the carry jump silently reverts
  to normal on every single door transition.
- **Feel:** while carrying, `Pusheen.jumpVelocityMultiplier = CARRY.jumpMultiplier`
  (`< 1`) via the v1.5 seam (M8). **Purely feel — no gating** (decided): the
  return path is always reachable while carrying; zero soft-lock risk.
- **No fail:** the item can't be dropped or lost. Picking up sets `held`; giving
  / placing clears it. You can only hold one thing.
- **Separate from costume.** Costume = worn ability (whole-sprite swap + gravity).
  Held item = accessory sprite + a jump multiplier. Two flags, never conflated.

### S2 — Glass & juice items (content-item effects on Containers)
- Reuses v1.5's `Container` + content-`effect` + `gate`. New effects:
  - `takeHeld('glass')` — offered only while `held:item === 'none'`; sets
    `held:item='glass'`.
  - `fillHeld('juice')` — on the fridge's OJ content, `gate:{ requires: held:item === 'glass' }`;
    turns the held glass into juice (`held:item='juice'`).
- **Cupboard (glass):** a `Container` whose contents include the glass
  (`takeHeld`). Other cupboards can be cozy empties (see S4).
- **Refrigerator:** a `Container`; opening it always shows the OJ, but selecting
  it while not holding the glass gives the gentle `nope` reaction (no stress, no
  scolding) — the gate leads you to find the glass first.
- ⚠️ **This gate is CONTENT-ITEM-level — new work, not the shipped seam (v1.5
  lesson).** v1.5 shipped only a **container-level** gate (folded into
  `Container.isActionable`, and deliberately left unused). The fridge instead
  needs the *OJ content item* gated at **selection** time: `UI.selectItem` must
  check the item's `gate` before applying its `effect` and give `nope` if it
  fails (so the fridge still opens and shows the OJ). Budget this as new `UI`
  code, alongside the new `takeHeld` / `fillHeld` `effect` branches (they sit
  beside the existing `takeSnack` / `nope` in the same `selectItem` dispatch).
- ⚠️ **`gate.requires` is a registry key OR a predicate `(scene) => bool`** —
  that's how v1.5's `passesGate` reads it. "`held:item === 'glass'`" is a
  *predicate*, so write `requires: (scene) => scene.registry.get('held:item')
  === 'glass'`, not a bare string.

### S3 — Reveal / unlock (permanent world change)
- On delivery, set **`juice:delivered = true`**. A `Reveal` (v1.5 M6) bound to
  that flag:
  1. plays Sloth's wake beat and empties the hammock (sprite swap), and
  2. activates the backyard's **hidden-path Door** (built `initiallyActive:false`)
     and reveals its art.
- **The revealed path leads to the LivingRoom** (`to:'LivingRoom',
  enterAt:'fromBackyard'`), unifying both room pairs into **one connected house**
  (see §2a). Waking Sloth is the gateway that opens the house — not a stub to
  nowhere. Until delivery, the LivingRoom + Bedroom are unreachable (the door is
  reveal-gated), so the first stretch of play is garden+kitchen only.

---

## 2a. One connected house (world graph)

Room Pair #2 does **not** stand alone — its reveal wires the two pairs into a
single house:

```
   Backyard  ⇄  Kitchen
      ⇅  (revealed by waking Sloth)
   LivingRoom  ⇄  Bedroom
```

**Consequences (be deliberate about these):**

- **Boot room moves to the Backyard.** `Preloader` starts `Backyard`, not
  `LivingRoom` (it currently ends with `this.scene.start('LivingRoom')`). The
  LivingRoom keeps working exactly as built, just reached later. Two concrete
  v1.5-grounded changes fall out of this:
  - ⚠️ **Play-again changes *mechanism*, not just target (v1.5 lesson).** Today
    the nap's Play-again handler (`LivingRoom.update`, on `game:restartRequested`)
    does `resetRunState(...)` + `this.scene.restart({ fadeIn: false })` — it
    restarts LivingRoom *in place*. For the connected house it must reset run
    state and then **transition to the Backyard start** (`fadeToRoom(this,
    'Backyard', …)` / scene-start), since a fresh lap now begins in the garden.
  - **LivingRoom gains a `fromBackyard` spawn point + a second door.** Its
    `SPAWN_POINTS` is `{ default, fromBedroom }` today — add `fromBackyard`, and
    add the revealed hidden path as a **second `Door` in LivingRoom** pointing
    back to the Backyard, placed clear of the existing far-left Bedroom door
    (x≈40). This is exactly the multi-door / named-spawn case v1.5 M7 was built
    for.
- **The emotional arc re-frames.** Flow becomes: garden → **wake Sloth (gateway
  / midpoint)** → house opens → LivingRoom → snack → **nap (finale)**. The juice
  quest is the appetizer; the existing nap payoff stays the dessert. Nothing
  about the LivingRoom/Bedroom content changes — only where it sits in the arc.
- **Build isolation.** Because the connecting door is reveal-gated, garden+kitchen
  build and playtest standalone (P0–P3); the house is wired in only at P3's
  reveal. Low risk to the already-shipped rooms.

---

## 3. Rooms (as v1.5 data)

### Backyard
- **Mood:** warm afternoon light; slow.
- **Layout:** tree (`solid` or `background`), hammock (background art; Sloth rests
  on it), fence/back wall.
- **Interactables:** **Sloth** (`talk`); optional hammock-bounce, flowers,
  butterflies (S4).
- **Doors:** screen door → `Kitchen` (`enterAt:'fromBackyard'`); hidden-path door
  (`initiallyActive:false`, revealed by S3).
- **Spawn points:** `default` (scene start, near Sloth), `fromKitchen`.

### Kitchen
- **Mood:** bright, homey, connected to the yard.
- **Layout:** counters, floor.
- **Interactables:** **refrigerator** (`Container`, holds OJ), **cupboards**
  (`Container`s — one holds the glass, others cozy/empty), optional lemon (S4).
- **Doors:** screen door → `Backyard` (`enterAt:'fromBackyard'` on that side).
- **Spawn points:** `fromBackyard`.

---

## 4. Sloth (NPC)

Same shape as `Stormy` (verb `talk`, concentric zones, speech bubble) — **flag-
branched dialogue, not a named-dialogue-state engine** (that engine is deferred
in v1.5). Two visible states: **asleep** and **awake** (sprite swap), driven by
`juice:delivered`.

`Sloth.interact()` branch (mirrors Stormy's `quest:complete` pattern):
- `juice:delivered` → she's up / already thanked (short line, or gone).
- else if `held:item === 'juice'` → **accept:** set `juice:delivered`, run the
  wake beat + reveal (S3).
- else if `sloth:met` → sleepy reminder ("mmf… still so thirsty…").
- else → the ask ("could you get me some juice?"), set `sloth:met`.

**Wake beat** (tweens): stretch/yawn, hop off the hammock, amble off (or fade),
a little burst of sparkles. Constants in `feel.js` (`SLOTH`, `SLOTH_RADAR`).

**Registry keys (new; add all to `resetRunState`):** `sloth:met`,
`held:item`, `juice:delivered`.

### Sloth's post-wake line is a costume Easter egg (intended, not a bug)

After the beat Sloth settles at **x≈520**, which is on the far side of the
garden gate (zone **x ∈ [662, 738]**) from every spawn point. His talk range is
**[300, 645]**, so walking over to him means entering the gate first and leaving
for the LivingRoom. Reaching his "so cozy now… thanks, Pusheen ♥" line therefore
takes the **Pusheencorn costume**, whose high jump clears the gate outright:

| | jump apex | gate top edge | outcome |
|---|---|---|---|
| Normal Pusheen | y=566 | y=530 | 36px short — always walks in |
| Pusheencorn | y=455 | y=530 | clears by 75px, lands at x≈55 |

This is the same gating principle as the Bedroom's high shelf and needs no
constants of its own — it falls out of `COSTUME` (`gravity: 1000`,
`jumpVelocity: -620`) against the door zone's height. The margin is forgiving:
~0.8s above the gate's top edge against the ~0.42s needed to cross it.

The ordering works out for free — the costume lives in the Bedroom, which is
only reachable *through* the gate — so the egg can't be found early, and it
gives the Backyard a reason to be revisited late in a lap.

**Two things this rests on, so don't "fix" them:**

1. **`Door.checkTrigger` tests Pusheen's centre point against the full-height
   zone.** Making it require her to be grounded would read as tidier and would
   quietly destroy the gate: a normal running jump covers ~123px of airtime
   against a 76px zone, so she'd sail over it without the costume.
2. **`SLOTH.amblePx` (180) is what puts him past the gate.** Shortening it to
   bring him back within reach removes the egg.

Known rough edge, deliberately left alone for now: there's no breadcrumb. She
enters the gate zone at x=738 but Sloth's sniff cue doesn't fire until x=708, so
she's pulled through 30px before the game hints he's over there. The cheap
levers are `SLOTH.amblePx` and `SLOTH_RADAR.sniffRadius`; both were considered
and deferred.

---

## 5. Optional cozy interactions (behind the core loop; each small)
Trivial (reuse existing patterns):
- **Sniff flowers** — outer-zone lead cue only, no action (reuse the sniff cue).
- **Chase butterflies** — wandering tween sprites that react (`playSniffReact`)
  on approach.
- **Open cupboards** — `Container`s left open or toggled shut; cozy, no contents.

Needs a smidge of engine:
- **Hammock bounce** — a `Cushion`-style squash-on-land surface.
- **Bat a lemon** — a light movable **arcade body** she nudges on overlap. This
  is a legit use of arcade physics for movement (golden rule 1) — a pure toy, no
  goal, no fail.

Ship these only if the core loop already feels good; if any adds fuss, cut it.

---

## 6. Build phases (checkpoints = playtest feel questions; no timers/fail ever)

- **P0 — Rooms + traversal:** Backyard ⇄ Kitchen as data, screen door works,
  Pusheen walks both. *Does the lazy-summer vibe read on sight?*
- **P1 — Carry:** held-item system, glass pickup, carry visual, jump multiplier.
  *Does carrying feel cozy/weighty — or annoying?* (If annoying, that's a finding.)
- **P2 — Fill:** fridge `Container` + gate + `fillHeld` → juice.
- **P3 — Sloth + payoff:** Sloth NPC, full quest branch, wake beat, reveal.
  *Does waking her + the world opening land as a payoff?*
- **P4 — Cozy extras (§5), as time allows.**

**Assets (placeholder OK):** Sloth (asleep/awake), hammock, tree, screen door,
kitchen background, refrigerator (closed/open), glass, orange juice (in-glass +
carried), + extras (butterfly, flower, lemon, open-cupboard). Add to Preloader.

**`feel.js` additions:** `CARRY = { jumpMultiplier, offset:{x,y} }`,
`SLOTH_RADAR`, `SLOTH = { …wake anim… }`, backyard/kitchen colors.

---

## 6b. Open questions (defaults chosen; flag before building)
1. ~~**Where does the revealed hidden path lead?**~~ **Resolved:** it leads to the
   **LivingRoom**, unifying both pairs into one connected house (§2a). Boot room
   moves to the Backyard.
2. **Is the glass in a cupboard (`peek` → select) or lying in the open (`take`)?**
   Default: in a cupboard, to exercise/showcase the generalized `Container`.
3. **Fridge without the glass:** OJ shown-but-gated (`nope`) vs not offered?
   Default: shown-but-gently-gated, so the fridge still reads as "the juice is
   here — go find a glass."

---

## 7. v1.5 implementation lessons (cross-cutting gotchas to budget for)

These surfaced while building v1.5 and don't belong to a single system above, so
budget for them up front. (The system-specific lessons live inline: held-item
flip + constructor re-apply in **S1**; content-item gate in **S2**; Play-again +
LivingRoom door/spawn in **§2a**.)

- **The peek panel centers for exactly 3 items.** `UI.populatePeekPanel` lays
  contents out as `startX = -ITEM_SPACING; itemX = startX + i * ITEM_SPACING` —
  dead-center only for 3 items. A cupboard or fridge with a different count will
  render off-center. Generalize the layout to N (`startX = -(n - 1) / 2 *
  ITEM_SPACING`) before shipping any container whose contents length ≠ 3.
- **A container room needs the peek-modal branch in its `update()`.** LivingRoom
  handles an open panel with a dedicated branch (`if (peekOpen) { stopMoving();
  E-to-cancel }`) that sits *outside* the InteractionController. Bedroom has no
  container, so it has none. The **Kitchen** (fridge + cupboards) is the second
  such room and needs that same branch. That makes two callers — if it reads as
  copy-paste, lift it into a small shared helper; otherwise inline is fine
  (Backyard has no container, so it stays at two).
- **Modal beats must freeze input.** Sloth's wake beat — and any multi-second
  scripted tween that owns Pusheen — needs the scene to stop reading input while
  it runs. Mirror `CostumeBox.busy` (the scene `return`s early from `update`
  while the flag is set) and/or use `InteractionController.update(pusheen,
  { suppress: true })` so the interact button can't flicker under the beat (the
  `suppress` option was added in v1.5 for exactly this, for the nap).
- **The reveal seam is already in place.** `Door` ships `initiallyActive:false` +
  `activate()` (M7), and `bindReveal(scene, flag, onReveal)` (M6, in
  `systems/Reveal.js`) runs `onReveal` once when a flag flips true — or
  immediately on room re-entry if it's already true. So S3's reveal is just:
  `bindReveal(scene, 'juice:delivered', () => { tween in the hidden door's art;
  door.activate(); run Sloth's wake beat })`. Nothing new to build here.
