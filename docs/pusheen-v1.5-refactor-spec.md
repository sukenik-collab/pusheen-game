# Pusheen — v1.5 Refactor Spec (pre-Room-Pair-#2)

> **Update (2026-09):** shipped. Its non-goals (§1) are the engine work parked in `ROADMAP.md`, Later.

**Status:** authoritative (supersedes the stale `pusheen-mvp-tech-spec.md`).
**Scope:** internal refactor only. **Zero player-visible change.** The existing
playtest — snack peek, nap payoff, the 3-yarn quest across both rooms, the
Pusheencorn costume, door transitions — must behave *identically* afterward.
That equivalence **is** the acceptance test.

Written against the code as it actually is (four scenes: Preloader, LivingRoom,
Bedroom, UI; entities Pusheen/Cabinet/Cushion/Pillow/Sunbeam/Door/Stormy/
YarnBall/CostumeBox), not against the old tech-spec doc.

---

## 1. Why now / high-level plan

Room Pair #2 ("Wake Me for Juice", see the v2 spec) adds two rooms, an NPC, a
carry mechanic, containers with contents, a gate, and a hidden-path reveal.
Today the engine can't express most of that as data:

- **Two rooms are built two different ways** — Bedroom is data-driven (a
  `LAYOUT` array + `buildLayoutItem` loop); LivingRoom is fully imperative.
- **Interaction is bespoke per room** — each room hand-writes an `E`-press
  `if/else` chain and a hand-OR of every entity's `inInnerZone` to publish
  `interact:available`. There is no dispatcher.
- **"Container with contents" is hardcoded** to exactly one cabinet + one
  snack, with the contents living in the UI scene (`ITEMS` array, keyed on
  `cabinet:peekOpen`).
- **Doors hardcode the target room + a single spawn point**, placed
  asymmetrically. No convention for two doors into one room, or a door that
  only opens after a quest step.
- **Jump velocity is a binary `costumed ? … : …`** with no seam for a second,
  independent modifier (the held item).

v1.5 unifies all four rooms on **one construction path** and installs the small
seams v2 needs — **without** building the full declarative YAML engine, a
multi-step quest DSL, or a named-dialogue-state system (all deferred).

**Decision (this refactor):** full retrofit — LivingRoom *and* Bedroom both move
onto the shared factory + dispatcher, so all four rooms end up one style.

### Non-goals (explicitly deferred past v1.5)
- Full data-only room YAML / a behavior DSL. Interactables stay real classes.
- Multi-step quest engine; named dialogue states; "sniff" as a first-class verb.
- Multi-costume generalization (v2 needs a *held item*, which is a different
  axis — see M8). Costume stays binary.

---

## 2. Target architecture (after v1.5)

```
src/
  systems/
    roomBuilder.js        # buildLayout(scene, layout, groundTop) -> solids[]  (M2)
    InteractionController.js  # register/update/pressInteract; owns interact:available (M1)
    Reveal.js             # bind a world object/door to a registry flag (M6)
    registryHelpers.js    # subscribeRegistry(scene, key, fn) auto-off on shutdown (M9)
  entities/
    Interactable.js       # (doc-only) the shared contract every interactive entity meets (M1)
    Container.js          # generic peek-with-contents; replaces Cabinet (M4)
    ...existing entities, lightly conformed to the contract...
  scenes/
    LivingRoom.js  Bedroom.js  # now: build bg -> buildLayout -> factory -> register -> wire
    roomTransition.js          # gains named-spawn resolution (M7)
```

A scene's `create()` shrinks to orchestration: draw background + ground, call
`buildLayout`, instantiate interactables via the factory, register them with the
`InteractionController`, wire physics colliders. Movement / jump / door / nap
sequencing stays in the scene (those aren't interactables).

---

## 3. Modules (detailed)

### M1 — Interactable contract + InteractionController
**Problem:** the `E`-press dispatch and `interact:available` OR are copy-pasted
and hand-ordered in every room's `update()`.

**Contract** (every interactive entity already meets ~90% of this):
```
outerZone, innerZone            : Phaser.Geom.Circle
inOuterZone, inInnerZone        : bool
update(pusheen)                 : recompute zones; fire lead cue on outer-enter (once/approach)
verb                            : 'talk' | 'peek' | 'take'   (advisory metadata for now)
isActionable(scene)             : bool — is the verb valid right now? (default: true)
interact(pusheen, scene)        : perform the verb
```
Note `inInnerZone` may bake in physical readiness (YarnBall already ANDs
`pusheen.isGrounded()` — keep that). `isActionable` covers *semantic* gating
(e.g. cabinet only while the snack is unfound).

**`InteractionController`** (a room owns one instance — this is not a premature
"manager": four rooms × many interactables = enough real callers):
- `register(interactable)`
- `update(pusheen)`: update each; `interactAvailable = any(inInnerZone && isActionable)`;
  publish to `interact:available` **guarded** (only on change — Phaser fires
  `changedata` on every `set`).
- `pressInteract(pusheen)`: pick the **nearest** inner-zone actionable
  (distance from pusheen to zone center; ties → registration order) and call its
  `interact()`.

**Retrofit / equivalence risk:** today's priority is positional
(cabinet > Stormy > yarn). With current layouts the zones don't overlap, so
"nearest" reproduces it — **but verify the LivingRoom cabinet/Stormy/yarn cluster
explicitly** in playtest. Doors stay *out* of the controller (they're walk-into
triggers, not `E`-press). CostumeBox joins as an interactable (verb `'peek'`;
`busy`-guard stays in the box).

### M2 — Data-driven passive layout (extract + retrofit LivingRoom)
Extract Bedroom's `buildLayoutItem` verbatim into
`roomBuilder.buildLayout(scene, layout, groundTop) -> solids[]` (roles:
`background` / `solid` / `standable`+`oneWay`, `yFromGround`, sprite-or-rect).
Express LivingRoom's couch base + floor/ground as a `LAYOUT`.

**Keep the escape hatch.** Bedroom already builds the bed's inset mattress body
and the Pillow in `create()` (not in LAYOUT), and LivingRoom spawns the couch
yarn *before* the couch so it renders behind. `buildLayout` handles the common
case; genuinely bespoke bodies / render-ordering stay in `create()`. **Do not
purify this away** — that nuance is deliberate.

### M3 — Room definition + typed interactable factory
`ENTITY_TYPES = { container: Container, stormy: Stormy, yarn: YarnBall,
costumeBox: CostumeBox, sunbeam: Sunbeam, ... }`. Interactable descriptors are
`{ type, x, ...opts }`; a small factory maps `type → constructor`. This is the
"just-enough" cut: **types resolve to classes**, not to a behavior DSL.
Constructors stay as-is wherever possible.

### M4 — Container with contents (generalize the cabinet/snack)
**Today:** `Cabinet` is a proximity entity; the drawer art + 3 items + snack +
number-key select + nope-shake all live in `UI.js` (`ITEMS`, keyed on
`cabinet:peekOpen`).

**Target:** a generic `Container` interactable (verb `'peek'`) +
a data-driven peek panel:
- Descriptor: `{ type:'container', x, sprite, contents:[…], gate? }`.
- Content item: `{ key, label, sprite, effect }`, `effect ∈`
  `takeSnack` (set `snack:collected` + `snack:count`) | `nope` (shake) |
  `fillHeld`/`takeHeld` *(v2)*.
- Registry generalization: `cabinet:peekOpen` → **`peek:open`** (bool) +
  **`peek:contents`** (the open container's contents). `UI.js` renders
  `peek:contents` instead of the hardcoded `ITEMS`; the drawer art, number keys,
  and nope-shake stay pixel-identical.
- The cabinet becomes a `Container` instance: popcorn→`takeSnack`,
  socks/tshirt→`nope`. **Recommend deleting `Cabinet.js`** (Container subsumes
  it). This is the single biggest retrofit — verify the snack peek UX is
  unchanged frame-for-frame.

### M5 — Gate primitive
`gate: { requires: <registry flag / predicate> }` on a container or a content
item; checked in `isActionable` / content selection. **v1.5 ships the seam
unused** (the cabinet is ungated). v2 uses it for the fridge's OJ (`requires`
holding the glass). A gated-but-in-range interaction gives the gentle `nope`
reaction — never a hard block, never stress.

### M6 — Reveal / unlock primitive
`Reveal` binds a world object (or a `Door`'s active state) to a registry flag:
on `flag → true`, run a reveal (tween in a sprite / activate a Door zone).
Net-new (nothing to retrofit — the sunbeam-on-snack and Stormy sad→happy stay
bespoke cosmetic reactions; don't force them onto this). Kept tiny; v2 wires
Sloth's delivery flag → the backyard hidden path.

### M7 — Door targets + named spawn points
- Rooms declare `spawnPoints: { default, fromKitchen, fromBackyard, … }`.
- Door descriptor: `{ type:'door', x, side, to:'SceneKey', enterAt:'<name>' }`,
  plus `initiallyActive` (default true; **false** = reveal-gated hidden door).
- `fadeToRoom(scene, key, { spawn })`; target resolves
  `data?.spawn → spawnPoints[name] → spawnPoints.default`.
- Retrofit both existing doors (LivingRoom↔Bedroom) onto named spawn points.
  Supports multiple doors into one room and the v2 hidden path.

### M8 — Jump-modifier seam (held item ≠ costume; never conflate)
**Today:** `jump()` does `setVelocityY(this.costumed ? COSTUME.jumpVelocity :
JUMP.velocity)`, and `setCostume` swaps gravity + the whole sprite.

**Target seam** in `Pusheen`:
- `resolveJumpVelocity()` = `(costumed ? COSTUME.jumpVelocity : JUMP.velocity)`
  `* this.jumpVelocityMultiplier` (default `1`).
- `jump()` calls `resolveJumpVelocity()`. Gravity resolution unchanged.
- **v1.5 leaves the multiplier at 1** (no behavior change). v2 sets it via a
  held-item flag.

**Contract:** *costume* = a worn ability (absolute velocity + gravity swap,
whole-sprite swap, persists in `costume:pusheencorn`). *Held item* = a temporary
multiplier on whatever the current jump is (+ an accessory sprite). Two flags,
two systems; **neither reads the other**. They simply compose at jump time.

### M9 — Run-state + listener hygiene
Add `registryHelpers.subscribeRegistry(scene, key, fn)` that registers a
`changedata-<key>` listener and auto-`off`s it on `scene` `shutdown` —
generalizing the manual cleanup LivingRoom already does for its one snack
listener (a leak that's easy to reintroduce as rooms multiply). Retrofit that
listener onto it. `resetRunState` grows its v2 keys in the v2 work, not here.

---

## 4. Sequencing (each step = one commit on a working branch; `main` stays playable)

1. **Extract, no behavior change:** `buildLayout` + `subscribeRegistry`. Retrofit
   Bedroom's loop + LivingRoom's snack listener onto them. Playtest = identical.
2. **Interaction contract + controller;** retrofit **Bedroom** first (smaller:
   yarn + costume box). Verify.
3. **Retrofit LivingRoom** onto the controller + a `LAYOUT`. Verify the full
   living-room playtest, especially the cabinet/Stormy/yarn dispatch cluster.
4. **Container generalization** + data-driven peek panel; cabinet → `Container`;
   delete `Cabinet.js`. Verify the snack peek UX is frame-identical.
5. **Door targets + named spawn points;** retrofit both doors. Verify both
   transitions + spawn placement.
6. **Infra-only seams:** jump-velocity multiplier hook (=1), `Reveal`, `gate`
   (all unused). Verify nothing changed.
7. **Final full-playtest checkpoint** — the pure-refactor gate before any v2 work.

**Risk & mitigation:** full retrofit touches tested rooms. Mitigate by doing
Bedroom before LivingRoom, keeping every step reversible, playtesting after each,
and preserving the "nuance in `create()`" escape hatch (bed body, couch render
order). If any step can't reproduce current feel exactly, stop and flag it — a
refactor that changes the feel has failed its one job.
