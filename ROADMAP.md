# Roadmap

What to do next, in order. Last updated 2026-09-25. Where the game stands
today is in `HANDOFF.md`.

Sizes are rough: **S** is a short session, **M** a full one, **L** several.
Tick items off here as they land, and add a line to **Decided** when a
choice is made.

## Now: polish what's there

1. [x] **Fix the invisible fridge labels** (S). Item names in the peek panel
   are white text (`src/scenes/UI.js`, `populatePeekPanel`) on the fridge's
   near-white interior, so they vanish; they only read on the cabinet's dark
   drawer. A dark outline stroke works on both panels.
   *Done when:* every item name reads on both panels.

2. [x] **Real art for the remaining placeholders** (M; you go first).
   - You: generate with `docs/art-prompts.md` (garden gate, screen door,
     glass and juice glass, OJ pitcher, milk, cheese, leftovers, fridge
     interior) and save them to `docs/concept-art/`.
   - Claude: extend the cutter so one image can yield several sprites (the
     glasses pair, the four fridge items), cut each to its target size from
     `docs/pusheen-v2-art-assets.md`, wire them in, and check them in the
     game.
   - *Done when:* no generated placeholder shapes remain apart from the
     backyard scenery that's generated on purpose (sun, clouds, hedge). Still
     generated on purpose: `sun`, `cloud`, `bushes` (Backyard), and the
     unused `fridge` closed-door texture (the fridge is painted into
     `kitchenBg`; nothing draws this key).

3. [ ] **Sloth's wake beat: poses, walk art, animation, pacing** (M to L).
   Today he yawns on the branch, drops onto the arms-up stretch pose, plods
   left in that pose (a waddle tween), then flops onto the lying-down pose.
   It's not settled which poses the move from hanging to lying down should
   pass through, so explore that before making art:
   - **Storyboard the poses (you, in Gemini).** Prompt 8 in
     `docs/art-prompts.md` asks for six keyframes in one image: hanging,
     yawning, letting go, landing, walking, lying down. Pick the sequence
     that reads best; it decides which new poses to generate for real. One
     thought to test: the arms-up pose may fit best right at the drop, arms
     still raised from the branch, rather than for the walk.
   - **An animation lab (Claude builds it, S to M).** A dev-only page (not
     linked from the game) that loops the wake beat on its own, with
     sliders for each timing and ease, buttons to swap the pose used at
     each step, and play, pause and step controls. You tune by eye without
     replaying the quest; the values it lands on go into `SLOTH` in
     `src/config/feel.js`. Plain HTML controls over the real `Sloth`
     entity, so no new dependencies.
   - **Walk:** two frames, left step and right step (prompt 6), alternated
     in time with the waddle tween.
   - **Pacing:** note at the next playtest what feels off (the drop? the
     plod speed? the wait before the gate appears?), then settle it in the
     lab. Today: a yawn of 420ms there and back, a 550ms drop, a 180px plod
     over 3s, and 550ms per waddle step.
   - Only if you want to hand-animate: Piskel (free, in the browser) for
     frame-by-frame drawing, or Rive for rigged 2D animation. Rive adds a
     runtime dependency, so it's not a first step.
   - *Done when:* the beat reads as one continuous, sleepy motion on the
     tablet.

4. [x] **A butterfly in the backyard** (M).
   - Flight is steering, not waypoints: a wander (a slowly-drifting heading,
     never per-frame jitter) blended with a gentle pull away from Pusheen and
     a soft pull back from the yard's edges into one desired velocity, eased
     toward every frame -- she never target-chases or target-flees, so
     there's no scripted "return to start" once Pusheen leaves, just the
     wander that was always running underneath. All tuning in `BUTTERFLY`,
     `src/config/feel.js`. She isn't on screen when the yard opens: she
     flutters in from just past one side after ~10s, roams the whole sky
     from then on, and now and then slips briefly off the left or right.
   - Shy, not scared: the two sensor zones (golden rule 3) ramp avoidance
     strength continuously rather than switching a behaviour on, and never
     override the wander, just add to it, so she curves off her existing
     heading instead of snapping to face away. Nothing to catch, nothing to
     chase (golden rule 4) -- not registered with `InteractionController`.
   - Art: a five-piece rig, not one flat sprite -- body+antennae and four
     wing quadrants (`tools/cut_butterfly.py`, prompt 7 in
     `docs/art-prompts.md`), each wing flapped independently (scaleX around
     its own attachment corner) in bursts with gliding pauses between, never
     a constant metronome.
   - Now and then she lands on Pusheen's head (on the horn tip, as
     Pusheencorn): only once Pusheen has been still ~2s, only on a random
     roll every few seconds, then not again for 20-40s, so it's a surprise
     rather than a rule. She curves in, drops onto the head along a short
     Bezier curve, sits 1.5-5s with one slow open-and-close flap, and
     flutters off when Pusheen moves or the time runs out.
   - Less often she lands on Sloth: on the branch right over his head while
     he hangs, or on his head or back once he's lying down, for 3-8s. Only
     while Pusheen is clear of him, and she leaves if Pusheen comes right up
     beside her, or when his wake beat starts.
   - *Done when:* it looks alive while idle and reads as shy when she comes
     close. Playtest still owed: does it actually feel alive on the tablet,
     and does the wander ever look like it's heading somewhere specific?

5. [ ] **First-impression pass** (M): for strangers, before sharing.
   - A splash overlay on load: the title, "a fan project", a disclaimer, and
     how to play (keys and touch). Dismissed by any key, a tap, or its
     button. Suggested disclaimer (the final wording is yours): *"An
     unofficial, non-commercial fan project. Pusheen and friends belong to
     Pusheen Corp.; this game isn't affiliated with or endorsed by them."*
   - A small "?" button next to the ♪ reopens it, with the feedback link
     (see Next, item 7).
   - Sound starts on Pusheen's first move. Today the music is queued at
     start-up and plays on the first key or tap of any kind
     (`AudioController.startMusic`); call it from her first movement input
     instead.
   - Phones held upright get a "turn your phone sideways" hint.
   - The ending card ("Play again") also shows the feedback link.
   - *Done when:* someone who's never seen it can start playing without
     being told anything.

## Next: share it and measure

6. [ ] **Usage metrics** (S to M).
   - First, amend the "no server calls" line in `CLAUDE.md` for this one
     exception.
   - Cookieless, privacy-friendly analytics through a script tag, not an npm
     package: GoatCounter (free for non-commercial use), Plausible (paid) or
     Umami (free tier). Pick one.
   - Decide the questions first, then track only the events that answer
     them: game started (splash dismissed), reached the Kitchen, got the
     glass, filled it, woke Sloth, reached the LivingRoom, napped, pressed
     Play again (the product brief's "again?" signal), and time played.

7. [ ] **A feedback link** (S): pick where it goes (a short Google Form or
   Tally form, or the Reddit thread) and wire it into the splash's "?" and
   the ending card.

8. [ ] **Post on Reddit** (S). Candidate subreddits: r/WebGames,
   r/cozygames, r/pusheen. Check each one's self-promotion rules first.
   Post it as a fan project, and try the link on a phone and a tablet
   before posting.

## Later: not scheduled

- **Grow the engine** (the v1.5 spec's non-goals), only once there's a
  reason to grow: rooms as pure data with a small behaviour language, a
  multi-step quest system, named dialogue states, "sniff" as a real action,
  more than one costume.
- **Grow the world** (the product brief's deferred decisions): a Room Pair
  #3 (no spec yet); characters named but not built (Pip, the hedgehogs);
  rooms with several states (time × weather × quest) once a sleep system
  exists; fast travel (hedgehog-guided, or shipping-box warp points).
- **More cozy extras** (v2 spec §5): sniff flowers, open cupboards, a
  hammock with a bounce, a lemon to bat around.
- **Real audio.** The music and SFX are synthesized placeholders;
  `public/assets/audio/CREDITS.md` suggests replacements.

## Decided

- 2026-10-07: The butterfly can land on Sloth as well as Pusheen. Each
  check, each target she could land on rolls its own chance (Sloth's much
  lower, since he's nearly always free), so a nearer Sloth never uses up a
  check Pusheen could have won. "In range" and "nearer" are horizontal
  only, since the hanging Sloth is far higher than Pusheen's head and
  counting height would favour him. If both rolls come up, the nearer wins,
  counted in 140px bands so it only wins by being clearly nearer, and
  Pusheen wins a tie. While he hangs, his crown is tucked under the branch,
  so she perches on the branch right over it.
- 2026-10-07: After the first look at the butterfly (PR #20's preview), four
  changes. She enters from just past a side edge ~10s after the yard opens,
  instead of being on screen at the start. She's cut 5% smaller (53px
  wingspan). Her roaming is wider, because her wander heading now follows
  where the walls and Pusheen turn her: she had been pinning herself
  against walls and in corners (the top-left one most, near her old spawn
  point). Her wing flap is slow and steady while perched. Her bounds now
  reach past the screen's sides, so she can slip briefly off-screen and
  come back.
- 2026-09-28: The butterfly lands on Pusheen's head now and then, as a rare
  roll while she's still -- never a rule the player can learn. Its states
  are wander, approach, land and perched; there are no separate "shy"
  states, since the avoidance already ramps with distance. The last stretch
  of the landing is a short Bezier curve, tweened along directly (Phaser's
  `PathFollower` only drives a single sprite, and the butterfly is a
  container). Its bob and sway moved from per-frame maths to tweens
  (golden rule 1). A sprite-sheet flap was considered and not taken: it
  needs matching frames from Gemini, and squeezing each wing's width
  already reads as the flap.
- 2026-09-28: The butterfly is a five-piece rig (body+antennae, four wing
  quadrants), not one flat sprite, so each wing can flap independently
  (scaleX around its own attachment corner). Cut by `tools/cut_butterfly.py`,
  which splits the concept art at the body's own centre point; each wing's
  crop reaches a couple of final px past that split into its neighbours
  (`--wing-overlap`), since cutting exactly on the line left a 1-2px gap at
  some flap angles once each piece's independent rounding was in play.
- 2026-09-28: Her movement is steering (wander + avoidance + soft boundaries
  blended into one desired velocity, eased toward) rather than a waypoint
  list or a flee-on-sight state machine -- she has her own life and Pusheen
  only ever leans on it. Full rationale and the tuning knobs are in
  `BUTTERFLY`, `src/config/feel.js`.
- 2026-09-28: The fridge items stand on the fridge art's shelf, spread
  inside its back wall, rather than in the fixed-spacing row the cabinet
  uses (that row ran past the fridge's frame and left short items floating
  above the shelf). They're cut at one shared scale, keeping their drawn
  proportions, instead of each being forced into its own box.
- 2026-09-28: The garden gate's generated art came out wider than the
  prompt's "twice as tall as wide" (posts flanking a picket panel, closer to
  square overall). Rather than regenerate, its walk-into zone is sized to
  just the picket panel (the part that would actually swing); the posts are
  decorative and can extend past it. `Door.js` gained a per-instance
  `zoneWidth` for this — the screen door still uses the shared default.
- 2026-09-25: Polish, then metrics, then share, before any engine refactor.
- 2026-09-25: Share publicly as an unofficial, non-commercial fan project,
  with a disclaimer on the splash screen.
- 2026-09-25: Sloth's hang and the kitchen climb signed off after playtest.
- 2026-09-24: The kitchen climb is two cardboard boxes. A step stool and a
  rolling cart were tried first and read as pasted in from another picture.
  The art is generated and cut by `tools/cut_boxes.py`.
