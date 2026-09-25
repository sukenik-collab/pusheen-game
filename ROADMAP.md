# Roadmap

What to do next, in order. Last updated 2026-09-25. Where the game stands
today is in `HANDOFF.md`.

Sizes are rough: **S** is a short session, **M** a full one, **L** several.
Tick items off here as they land, and add a line to **Decided** when a
choice is made.

## Now: polish what's there

1. [ ] **Fix the invisible fridge labels** (S). Item names in the peek panel
   are white text (`src/scenes/UI.js`, `populatePeekPanel`) on the fridge's
   near-white interior, so they vanish; they only read on the cabinet's dark
   drawer. A dark outline stroke works on both panels.
   *Done when:* every item name reads on both panels.

2. [ ] **Real art for the remaining placeholders** (M; you go first).
   - You: generate with `docs/art-prompts.md` (garden gate, screen door,
     glass and juice glass, OJ pitcher, milk, cheese, leftovers, fridge
     interior) and save them to `docs/concept-art/`.
   - Claude: extend the cutter so one image can yield several sprites (the
     glasses pair, the four fridge items), cut each to its target size from
     `docs/pusheen-v2-art-assets.md`, wire them in, and check them in the
     game.
   - *Done when:* no generated placeholder shapes remain apart from the
     backyard scenery that's generated on purpose (sun, clouds, hedge).

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

4. [ ] **A butterfly in the backyard** (M).
   - Flight: a meandering wander (smooth random steering) with a fluttery
     bob and a wing-flap tween that squashes its width. No physics, and it
     stays over the backyard.
   - Shy, not scared: two sensor zones (golden rule 3). Inside the outer one
     it drifts gently away from Pusheen; once she's gone it wanders back.
     Nothing to catch, nothing to chase (golden rule 4).
   - Optional delight: if she stays still near it for ~3 seconds, it lands
     on her head, and flutters off when she moves.
   - Art: prompt 7 in `docs/art-prompts.md`, or a generated shape to start.
   - *Done when:* it looks alive while idle and reads as shy when she comes
     close.

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

- 2026-09-25: Polish, then metrics, then share, before any engine refactor.
- 2026-09-25: Share publicly as an unofficial, non-commercial fan project,
  with a disclaimer on the splash screen.
- 2026-09-25: Sloth's hang and the kitchen climb signed off after playtest.
- 2026-09-24: The kitchen climb is two cardboard boxes. A step stool and a
  rolling cart were tried first and read as pasted in from another picture.
  The art is generated and cut by `tools/cut_boxes.py`.
