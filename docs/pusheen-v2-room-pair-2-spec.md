# Pusheen — v2 Spec: Room Pair #2, "Wake Me for Juice"

**Status:** authoritative. **Depends on v1.5** (`pusheen-v1.5-refactor-spec.md`) —
every room here is expressed in v1.5's vocabulary (data layout + typed
interactable factory + interaction controller + container/gate/reveal + named
spawn points + the jump-modifier seam). Only **three** genuinely new systems.

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
  (not to `this.visual`) at a `CARRY.offset`, so it moves/flips with her and is
  *not* scaled by the squash/idle tweens that target `this.visual` — same
  reasoning as the costume-sprite note. On room `create()` it re-attaches itself
  from `held:item`, exactly like the costume re-applies from its registry flag.
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

- **Boot room moves to the Backyard.** `main.js` starts in `Backyard` (not
  `LivingRoom`); `resetRunState` + the nap's "Play again" restart target move to
  the garden start. The LivingRoom keeps working exactly as built, just reached
  later and now owning **two** doors (Bedroom + the revealed Backyard door — the
  reason v1.5 M7 added multi-door / named-spawn support).
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
