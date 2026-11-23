# HANDOFF

Where the game stands and how it hangs together. Last updated 2026-11-23.
**What to do next is in [`ROADMAP.md`](ROADMAP.md)**; this file is the state
of play.

## Start here next time

0. **The Laundry Room is built and browser-checked, not yet playtested.**
   Branch `ccr-30ca541b-l5u4wn` (the mirrored LivingRoom, the reshuffled
   Bedroom, the cabinet move, the Laundry Room, a crash fix) builds, and
   each room was played in headless Chromium with real key input and
   screenshots. What's owed is a look by eye and the tablet (the checklist
   is under "Where things stand"), then the merge.
1. Open `ROADMAP.md` at **Now**. Items 1 (fridge labels), 2 (the art batch)
   and 4 (the butterfly, landing on Pusheen and on Sloth) are done, and
   item 5 (first impressions) is mostly in: the title, favicon, the music on
   her first move, the splash (`src/splash.js`) and the "?" chip beside
   the ♪. Only the ending card's feedback link is left (with Next, item 7).
   Usage metrics are in too (`src/analytics.js`, GoatCounter, production
   host only). Item 3 (Sloth's wake beat) is
   next. The butterfly has only had a look on a deploy preview, not a
   tablet playtest — see "Where things stand".
2. `npm run dev` serves the game at http://localhost:8080 (it boots in the
   Backyard). `npm run build` must pass before any PR.
3. Work on a branch; `main` is what's live.

## Where things stand

- **`main` is the playable build.** Netlify deploys it to
  https://pusheen-game.netlify.app/ on every merge, and every PR gets its
  own deploy preview (the Netlify bot comments the link).
- **In flight: the Laundry Room** (branch `ccr-30ca541b-l5u4wn`, not
  merged; see "Start here"). Already checked in Playwright: every item
  below that's a yes/no (cues on approach not arrival, floor hop short of
  the dryer, swipe only from the table, heap -> dryer -> yarn, heap
  persists, Pusheencorn onto the shelf, 4/4 completes Stormy, Play again
  resets). Still owed on the deploy preview and the tablet, by eye:
  - *LivingRoom, mirrored:* she arrives from the garden by the sunbeam on
    the left; Stormy (flipped) stands on her spot with the hearts over her
    head; the couch yarn peeks out past the couch's right arm; the cabinet
    (now x 970) cues as she walks up, not on arrival from the right door;
    the nap still fires and "Play again" still goes to the Backyard.
  - *Laundry Room:* the yarn sparkles as she nears the dryer, but a floor
    hop falls short and she can't take it from the floor. The basket
    wobbles as she nears the table; E is offered only once she's up on the
    table. Does the swipe read as a swipe? Does the basket's arc read as
    "tipped off", or as flying too far (it travels ~230px)? Is the heap's
    plop satisfying, and the heap-to-dryer hop fair but not trivial (heap
    50 + hop 82 vs dryer 110)? Leave and come back: the heap should still
    be there.
  - *Bedroom, reshuffled:* door on the left; the too-high shelf and its
    yarn are the first thing she meets; the costume box at the far right
    pops her out clear of the headboard; Pusheencorn reaches the shelf.
  - *Whole loop:* Stormy now asks for 4 balls and the HUD reads `x/4`;
    the fourth ball completes her quest.
  - *Feel:* does the extra room make the wing feel fuller, or longer?
    (The definition of done in `CLAUDE.md`.)
- **Known, not fixed:** arriving in the LivingRoom from the Backyard puts
  her inside the sunbeam's nap zone, so if the snack is already found
  (she went back out to the yard and came in again), the nap starts the
  moment she arrives. It predates the mirror. The likely fix is a sunbeam
  that arms only once she's been outside it, as doors do. Also, the
  Backyard's return spot from the LivingRoom (x 880) is east of the gate,
  which may now read backwards; judge it by eye.
- **Signed off at the last playtest:** Sloth's hang from the branch and the
  kitchen climb.
- **The butterfly has had one look, on a deploy preview, not a tablet
  playtest.** That look gave us her bank, her off-screen entrance, the
  smaller cut, the wider roaming and the slow perched flap; it signed off
  the approach and landing. Still owed on the tablet: does the wander read
  as alive, and is the landing rare enough to surprise but common enough
  that a player standing still gets to see it? (Standing still, she lands
  about once every 60-90s, first after ~30s, but the gaps vary a lot
  because she roams the whole sky.) Her visits to Sloth are newer still:
  about one every 2-3 minutes while Pusheen keeps moving, fewer while she
  stands still. Are they seen often enough to be worth having?

## The game today

*Pusheen's Lazy Afternoon* (the tab title; the repo and specs call it the
Pusheen Cozy Game). One small connected house. It boots in the Backyard:

> Meet **Sloth**, asleep on the backyard tree. He'd like juice. In the
> **Kitchen**, climb two cardboard boxes onto the counter for a **glass**,
> fill it at the **fridge**, and carry it back. He wakes, drops down, ambles
> off, and a **garden gate** appears. Through it is the **LivingRoom**, the
> original slice: the snack in the cabinet, Stormy's lost yarn and the
> sunbeam nap, then "Play again".

Past the LivingRoom, the house wing runs left to right like Backyard →
Kitchen: **LivingRoom → Laundry Room → Bedroom**. In the **Laundry Room**
(on the branch, see above) a yarn ball sits on a dryer a bit too high to
hop onto; she hops onto the low folding table, paw-swipes the laundry
basket off it, and it lands as a squishy heap beside the dryer that she
hops on and up from. The **Bedroom** is last: the too-high shelf is just
inside its door, and the costume box at the far end turns Pusheen into
Pusheencorn, whose floatier jump reaches it. Four yarn balls in all
(couch, dryer, bed, shelf). There are no fail
states, timers or enemies anywhere. The music starts with her first move.

A shy **butterfly** flutters into the Backyard from one side ~10s after it
opens, then wanders the sky on its own; it drifts away if
Pusheen gets close and resumes wandering once she's gone. Now and then, if
Pusheen stands still, it lands on her head (on the horn tip, as
Pusheencorn) and flutters off when she moves. Less often it lands on Sloth
— on the branch over his head while he hangs, on his head or back once
he's lying down. Nothing to catch, nothing to chase — purely ambient.

## Art: what's real and what isn't

- **Real, cut from `docs/concept-art/` (local only, gitignored) by the scripts in `tools/`:** the
  backyard tree, the hanging Sloth (two layers), the kitchen boxes, the
  garden gate, the screen door, the fridge interior, the glass and juice
  glass, the four fridge items (OJ pitcher, milk, cheese, leftovers), the
  butterfly's five-piece rig (body+antennae, four wings), and the page's
  favicon and home-screen icon (from `cat.png`, Pusheen's own concept
  art). See `tools/README.md`.
- **Real, from earlier work:** the kitchen backdrop, Sloth's awake and
  sitting poses, and the original rooms' sprites (Pusheen, Pusheencorn,
  Stormy, furniture). Some of those were cut from concept art; others are
  SVGs in `scripts/new-room-art.html`, rasterized by
  `scripts/gen-new-room-art.mjs`.
- **Still placeholder shapes** (drawn in `Preloader.makeTexture`): the
  backyard's generated-on-purpose scenery (sun, clouds, hedge), the
  unused `fridge` closed-door texture (the fridge is painted into
  `kitchenBg`), and the whole Laundry Room (`Preloader.makeLaundryTextures`:
  dryer, washer, folding table, basket, heap, round window). Its heights
  come from `LAUNDRY` in `feel.js`; real art must be cut to those sizes.
  Its Gemini prompts are 9-11 in `docs/art-prompts.md` (11 is optional). Sizes and status of every sprite are in
  `docs/pusheen-v2-art-assets.md`.
- **Audio** is synthesized CC0 placeholders;
  `public/assets/audio/CREDITS.md` suggests real replacements.

## Load-bearing details (don't "fix" these)

- **Doors arm only once Pusheen is clear of their zone.** The garden gate
  appears exactly where she stands to hand over the juice. Without this,
  the delivery warped her to the LivingRoom mid wake-up.
- **Sloth's post-wake line is a costume Easter egg.** He settles past the
  gate, so hearing it takes Pusheencorn's jump (a normal jump is 36px
  short). A grounded-only door trigger or a shorter `SLOTH.amblePx` would
  quietly remove it; the v2 spec §4 has the numbers.
- **The kitchen hops are tight on purpose.** Each rise is 80px of a ~82px
  hop. `LOW_BOX_TOP`, `TALL_BOX_TOP` and `COUNTER_TOP_FROM_GROUND` in
  `Kitchen.js` and the box art are cut to each other, so change them
  together (`tools/README.md`).
- **The box ledges are narrower than the boxes on purpose:** inset by her
  half-width less 10px, so she can't stand on thin air past an edge. The
  counter's ledge isn't inset, because its painted top runs on past both
  ends.
- **The garden gate's sprite is wider than its walk-into zone on purpose.**
  Its art includes two decorative posts flanking the picket panel that
  actually swings; `Door`'s `zoneWidth` (Backyard.js) is sized to the panel
  alone, narrower than the sprite. Widening the zone to match the full
  sprite would let her trigger the transition from a stride still visibly
  short of the gate's opening.
- **The butterfly's wander heading drifts by `noise * sqrt(dt)`, not
  `noise * dt`.** It's a random walk, and a walk's accumulated turning over
  real time only comes out the same regardless of frame rate if each step's
  noise scales with the *square root* of its own timestep. Scaling by `dt`
  itself (the obvious-looking version) quietly makes her turn more
  sluggishly on a slower machine — she read as barely curving at all before
  this was caught. `Butterfly.js`'s `steer()` has the comment.
- **The butterfly's wander heading follows the direction she's actually
  being steered** (`BUTTERFLY.headingFollow`). Without it, a wall's push
  and a wander still pointing into that wall balanced out, and she hovered
  pinned against it, often in the top-left corner near where she used to
  spawn, for ~20s at a time. With it, a wall turns her and she flies on.
- **The hanging Sloth is two layers with the tree drawn between them.** The
  back layer lives outside his container, and `Sloth.syncBackLayer` copies
  his transforms onto it every frame. The hang pivots on `SLOTH.gripRow`,
  so breathing keeps his paws on the branch. `SLOTH.restHeight` is derived
  from the tree and sprite geometry: re-derive it, don't eyeball it (the
  comment on it in `feel.js` shows how).
- **The butterfly is created after Pusheen and Sloth** in `Backyard.js`,
  so it draws over whichever it perches on. Move it earlier and a landed
  butterfly sits behind them.
- **Each landing target rolls its own chance** (`chooseTarget()` in
  `Butterfly.js`). "Pick the nearest, then roll its chance" looks
  equivalent but isn't: Sloth's chance is low, so whenever he was nearer
  the check was mostly spent on a roll he failed, and Pusheen's landings
  dropped noticeably.
- **Headless test browsers run the game slow.** This container's Chromium
  manages ~11fps, and Phaser caps each frame's step at 1/60s for 120
  frames after boot or a refocus, so game time runs at about a sixth of
  real time for ~11s after each. In Playwright, keep
  `window.__pusheen.loop._coolDown = 0` on an interval when timing
  matters. Real devices at 60fps never see it.
- **The butterfly judges "Pusheen is still" by her position, not her
  velocity**, so a scripted slide (Sloth's shove, with her physics body off)
  still counts as moving and sends a perched butterfly off.
- **The music starts from Pusheen's movement methods** (`moveLeft`,
  `moveRight` and `jump` call `startMusicOnFirstMove`), which only the
  rooms' input code calls. A scripted move that called them would start
  the music without the player doing anything, so script her with tweens
  or the physics body, as Sloth's shove does.
- **The Laundry Room's heights are derived from the jump** (`LAUNDRY` in
  `feel.js`): the dryer sits 28px above her best floor hop and the heap is
  sized so heap + hop clears the dryer by 22px. Retune `JUMP` and they
  follow, and so do the placeholder textures. Fix a height by hand and the
  puzzle can quietly break either way (dryer reachable from the floor, or
  not from the heap).
- **The dryer yarn is only takeable from the dryer top** (`YarnBall`'s
  `standOnY`). Yarn pickup radii are generous (95px) and the ball sits
  only ~85px above her centre on the floor, so without it she'd take the
  yarn from the floor and the puzzle would be skipped. Likewise the
  basket swipe checks her feet are on the table top.
- **The dryer and table are one-way platforms she walks in front of.** A
  solid dryer just inside the door would wall off the way back to the
  LivingRoom until the heap exists.
- **The laundry heap is built before Pusheen, hidden, with its body off,**
  and the basket's landing reveals it (`LaundryHeap.plopIn`). That keeps
  it drawn behind her without any depth sorting; don't create it on
  landing instead.
- **Phaser 4 has no `Geom.Point`** (the basket's tip arc crashed on it).
  Use plain `{ x, y }` objects or `Math.Vector2`.
- **The Bedroom's shelf yarn never cues from the floor**: it's ~155px
  above her centre, past the yarn's 150px sniff radius. It was like this
  before the reshuffle too; the yarn is in plain sight, so it may not
  matter, but if playtesters miss it, that's why.
- **Room arrival spots sit outside every sniff zone** (LivingRoom cabinet at
  x 970; Laundry dryer at x 330), so cues lead her rather than firing the
  moment she arrives. Moving furniture toward a door can quietly undo it.
- **In the Backyard, creation order is depth order** (sky, clouds, sun,
  grass, hedge, tree). There's no `setDepth`.

## How the pieces fit

- **The house:** Backyard ↔ Kitchen, and the garden gate (revealed once
  Sloth is awake) into LivingRoom ↔ Laundry Room ↔ Bedroom, each door on
  the wall facing the next room.
- **Rooms** are data-driven (the v1.5 refactor): each scene has a `LAYOUT`
  of passive furniture (`src/systems/roomBuilder.js`), interactables
  register with `InteractionController`, and doors name the room and spawn
  point they lead to (`src/scenes/roomTransition.js`).
- **Run state** lives in the Phaser registry (`src/config/gameState.js`:
  `held:item`, `sloth:met`, `glass:taken`, `juice:delivered`, …). "Play
  again" resets it.
- **Carrying:** `held:item` (none, glass or juice) sets Pusheen's accessory
  sprite and a gentler jump (`CARRY` in `feel.js`).
- **Reveals:** `bindReveal(flag, …)` (`src/systems/Reveal.js`) fades the
  garden gate in when `juice:delivered` flips.
- **The UI scene** (`src/scenes/UI.js`) runs alongside the rooms: the HUD,
  the touch buttons, and the peek panel for the cabinet and fridge.
- **Tunables** are all in `src/config/feel.js`.

## Docs map

| File | What it's for |
|---|---|
| `ROADMAP.md` | What's next, in order, and a log of decisions |
| `HANDOFF.md` | This file: the state of play |
| `CLAUDE.md` | Working rules for Claude sessions |
| `docs/art-prompts.md` | Gemini prompts for the game's art: which are done, which are still to generate |
| `docs/pusheen-v2-art-assets.md` | Every v2 sprite: size, status, tuning notes |
| `tools/README.md` | How concept art becomes sprites |
| `docs/pusheen-mvp-product-brief.md` | The why, plus the success and kill criteria |
| `docs/pusheen-mvp-design-doc.md`, `pusheen-mvp-tech-spec.md`, `pusheen-v1.5-refactor-spec.md`, `pusheen-v2-room-pair-2-spec.md` | The specs as built: feel targets and architecture history |
