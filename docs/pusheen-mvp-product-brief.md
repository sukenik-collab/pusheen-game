# Pusheen Cozy Game — MVP Product Brief

> **Update (2026-09):** the MVP slice shipped and the game has grown past it (`HANDOFF.md`). This brief still holds the why and the success and kill criteria; its out-of-scope and deferred lists feed `ROADMAP.md`.

*"The Living Room Snack Hunt" vertical slice*

Status: draft v0.1 · Owner: [you] · Collaborator: [your kid] · Target build: web (Phaser)

> **Reconciliation note (2026-07).** The original slice proved out, so the game
> is now **deliberately expanding past it.** What's changed since this brief:
> a second room (Bedroom) + door transitions shipped; the Pusheencorn **costume
> with an ability** shipped; **Stormy** (an NPC) + a hidden-yarn quest shipped.
> Next is **Room Pair #2 ("Wake Me for Juice")** — a Backyard + Kitchen with a
> Sloth NPC and a carry mechanic, whose payoff **connects all four rooms into
> one house.**
>
> The durable heart of this brief still holds and is still the bar: the
> **hypothesis** (§"the scary question"), the **core loop**, and the **feel-based
> success / kill criteria**. The two forward-looking lists below — *Out of scope*
> and *Deferred decisions* — described how to protect the *original* slice and are
> now partly overtaken by the expansion; they're annotated inline. Architecture
> and the expansion plan are authoritative in **`pusheen-v1.5-refactor-spec.md`**
> and **`pusheen-v2-room-pair-2-spec.md`**.

---

## One-liner
A tiny, single-screen playable slice where a plump cat wanders a cozy living-room corner, peeks inside a cabinet, finds a snack, and curls up in a sunbeam. No enemies, no timer, no fail state. We are testing a *feeling*, not a feature set.

## The hypothesis we're actually testing
> In a game with no challenge, no failure, and no urgency, is guided-but-aimless pottering around a room genuinely satisfying — or is it pleasant-but-boring after ~90 seconds?

This is the scary question the whole game concept rests on. If the answer here is "boring," no amount of costumes, boxes, dreams, or friends fixes it — those are garnish on top of this loop. So this slice exists to give an honest yes/no *before* any of that gets built.

## The core loop (the irreducible thing)
1. **Move** — walk/jump a plump cat with weight and squash.
2. **Sense** — get near a hidden thing, get a gentle non-intrusive cue (sniff / notes).
3. **Peek & find** — open a cabinet, rifle inside, take the snack.
4. **Payoff** — carry it to the sunbeam, curl up, cozy "level complete" beat.

If this four-beat loop isn't quietly delightful with placeholder art, the concept needs rework, not expansion.

## Success criteria (feel-based, behavioral)
Not "does the cabinet open" — that's a checklist, not a signal. Watch for:
- **Unprompted lingering** — after finishing the goal, does the player keep poking at things instead of stopping?
- **A reaction at the payoff** — a smile, an "aww," a re-watch of the nap animation.
- **"Again?"** — does the tester (especially your kid) want to replay it, or open it again the next day?
- **Attention holds** for the full ~2–3 min without a "what's the point" moment.
- **The squash and the sniff cue land** — people notice and enjoy the small physical touches, not just the goal.

## Kill / pivot criteria (the honest bar)
With placeholder shapes but *good feel and audio in place*:
- If moving around and finding the snack is boring within 60–90 seconds → the pure no-fail cozy-exploration premise is weak. Pivot before building the metroidvania: either add more toy-like richness to interactions, or reconsider whether zero-challenge holds attention for your audience.
- If the *only* fun part is the payoff cutscene and the moment-to-moment is flat → the loop is thin; fix the loop, don't paper over it with more content.

Naming these now so a mediocre result can't be rationalized into a green light later.

## In scope — the slice
- One fixed (or minimally scrolling) 2D screen: cozy living-room corner.
- Left: a cabinet/counter. Center: a couch with a squashable cushion. Right: a window with a sunbeam on the carpet.
- Placeholder cat (a plump gray oval is fine). Placeholder art throughout.
- The four core mechanics above.
- Lo-fi background track + squish/boing SFX. **Audio is not optional** — it carries ~half the vibe.
- Optional cheap win: one *no-ability* cardboard box as a hiding spot (climb in, peek out, nothing else). Tests box feel; adds almost no scope.

## Explicitly out of scope (protect the slice from the vision)
*Written to protect the **original** slice. Struck-through items have since been
deliberately built as the game expands past the MVP — see the reconciliation note.*
- ~~No costumes, no costume abilities.~~ → Pusheencorn costume + floaty-jump ability shipped.
- ~~No other characters (Pip, Stormy, hedgehogs, Sloth) — later.~~ → Stormy shipped; Sloth is next (v2).
- No inventory system — a found snack just increments a `0/1 → 1/1` counter and disappears. *(Still holds. v2's carry mechanic is a single **held item**, not an inventory.)*
- No time/sleep/weather system, no dreams. *(Still holds.)*
- ~~No room interconnection / metroidvania map — discrete single scene only.~~ → Two rooms + doors shipped; v2 connects all four into one house.
- No final art. We are testing feel, not fidelity. *(Still holds — placeholder art throughout.)*

The full vision GDD stays a *separate* north-star doc. This slice is deliberately not trying to satisfy it.

## Platform decision
Web, built in **Phaser**. Rationale: runs anywhere via a shareable link (frictionless playtesting for you and your kid on any device), most mature 2D web framework, and best-represented in AI training data for reliable Claude Code assistance. Alternative considered: KAPLAY (lighter, charming, but newer/thinner AI coverage).

## Deferred decisions (park these until the slice proves out)
- ~~Whether v1 stays discrete cozy vignettes or grows into a true interconnected house.~~ **Decided: interconnected house.** v2's Sloth reveal wires Backyard/Kitchen to LivingRoom/Bedroom into one connected space.
- How many states a room can hold (time × weather × quest) once the sleep engine exists.
- The art pipeline for "real" (post-placeholder) visuals — the classic hobby-dev stall point.
- Fast-travel model (hedgehog-mediated vs. shipping-box warp points).

## How your kid stays in the loop
This started as their idea, so bake in decision points they own: pick the snack, name the room, choose Pusheen's nap pose, doodle a sprite — and be the first and most honest playtester. Their "again?" is one of your clearest success signals.
