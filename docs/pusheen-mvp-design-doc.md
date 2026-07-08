# Pusheen Cozy Game — MVP Design Doc
*"The Living Room Snack Hunt" vertical slice*

Status: draft v0.1 · Companion to: MVP Product Brief · Implementation detail lives in: Tech Spec

This doc turns the brief's *feelings* into concrete, tunable specifics. All numbers assume a ~1280×720 logical canvas and are **starting seeds to tune by feel during playtest**, not fixed values. Phaser API specifics (tweens, physics config, sensor geometry) live in the tech spec.

---

## 1. Scene layout
One fixed screen (no scroll for v0), cozy living-room corner:
- **Left** — a cabinet against a counter. Holds the snack.
- **Center** — a couch with one squashable cushion at jump height.
- **Right** — a window with a sunbeam pooled on the carpet (the nap spot).
- **Floor** — continuous ground plane the cat walks on.
- Optional: one cardboard box (hiding spot) somewhere between center and right.

Whimsical arrangement over realism — place things for pleasant left-to-right flow: start near cabinet, play on the couch, end in the sunbeam.

## 2. The cat: movement feel
She should read as **plump and unhurried** — eases into motion, coasts to a stop with a little slide.
- Horizontal accel: ~1200 px/s² · max speed: ~180 px/s (a gentle stroll) · deceleration/drag: ~1000 px/s² so she glides to rest rather than snapping.
- Jump: gravity ~1400 px/s², jump velocity ~-480 px/s — a modest, arcy hop. She is not an athlete.
- **Idle life:** never fully static. Subtle vertical bob (±2–3 px, slow sine) plus faint scale "breathing" so a resting cat still feels alive.

## 3. Squash & stretch (the tactile core)
Driven entirely by **tweens**, not physics.
- **On landing:** cat oval → `y 0.85 / x 1.12` over ~80–100 ms, then return to `1.0` over ~120 ms with a slight overshoot (`Back.easeOut`). The x-stretch paired with y-squash fakes volume conservation — that's what sells weight.
- **On the couch cushion:** cushion → `y 0.9 / x 1.05` over ~100 ms, rebound with a small yoyo. Cat does its own squash simultaneously. Soft *boing/squish* SFX on contact.

## 4. Snack radar (anticipation, done right)
Two **concentric sensor zones** around the cabinet:
- **Outer "sniff" radius (~140 px):** on entry, trigger the cue — a small nose-twitch/sniff animation + one floating music note or "!" that fades. Fires once per entry; ambient, never nagging.
- **Inner "can-open" radius (~64 px):** enables the peek interaction.
Outer must be meaningfully larger than inner so the cue *leads* the player — the gap between "I sense something" and "I can act" is the whole "ooh, what's over there?" moment.

## 5. The cabinet peek
- Approach (inner zone) → press interact → a soft **cozy-zoom overlay** eases in (slight scale-up, gentle ease — reads as leaning in to look, not opening a menu).
- Overlay shows the inside: three items in a simple grid — a pair of socks, a folded t-shirt, and a bag of popcorn (the snack).
- This adds a second interaction beyond peek: the player taps/clicks one item to choose it.
  - Choosing the popcorn: it lifts out of the panel, the `0/1 → 1/1` counter ticks, overlay eases closed.
  - Choosing a decoy (socks or t-shirt): *open question — nothing happens vs. a small "nope" reaction (a tiny shake/bounce)*. Either way the overlay stays open so the player can try again; no fail state.
- No inventory. The snack is now "got"; that's all the state we track.

## 6. The payoff: the sunbeam nap (level complete)
The finale matches the goal — no flagpole.
- Once the snack is collected, entering the sunbeam locks controls.
- Beat sequence: ~0.5 s settle → curl-up tween (~0.6 s, rotate/scale or sprite swap) → "So Cozy!" text fades in and holds ~2 s → soft dust-mote particles drift in the sunbeam → background music gently softens/swells.
- After the "So Cozy!" beat, show a **"Play again!" button**. Tapping it resets the scene (uncollect the snack, clear the counter, cat back at the start) for another lap — no page reload needed.
- Slow, warm, unhurried. This beat is the emotional dividend of the whole loop — give it room to breathe.

## 7. Optional: the hiding box
Climb in → brief pause → pop back out. No effect, no reward — purely delightful, and it tests the box *interaction feel* that the full game's identity is built on. Costs almost nothing; skip if it adds any friction.

## 8. Art & audio for this slice
- **Art:** placeholder shapes throughout — a plump gray oval is a valid Pusheen. Do not make real art before the feel is proven. The oval is designed to *grow into* the final character (ears, stripes, dot eyes) later, so nothing here is throwaway.
- **Audio is not optional** — it carries ~half the vibe. Drop in a royalty-free lo-fi loop + CC0 SFX (soft squish, gentle collect chime, a "so cozy" sigh). See the asset-pipeline plan for sources.

## 9. Feel-tuning checklist (the knobs for playtest)
- Move accel / max speed / deceleration — does she feel plump, or sluggish / twitchy?
- Squash amount & rebound overshoot — tactile, or mushy / stiff?
- Sniff-radius size vs. interact-radius — does the cue genuinely *anticipate*, or arrive too late?
- Nap-beat length — does the payoff land, or drag / feel rushed?
- Audio mix — is the loop soothing under everything without getting old across a 3-minute session?
