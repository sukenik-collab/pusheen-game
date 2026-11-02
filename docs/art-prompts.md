# Art prompts (Gemini)

Prompts for the game's generated art, written for Gemini. Each asset is
one image: paste the **shared style block** first, then that asset's block,
and attach the reference images it lists. Prompt 8 is different: a
storyboard for exploring the Sloth's wake-up, not a sprite.

**Done:** 1-5 and 7 are generated, cut and in the game. Their prompts stay
here for regenerating, and each one's "In game" line says how it was
actually cut. **Still to generate:** 6 (Sloth walking) and 8 (the wake-up
storyboard), both for `ROADMAP.md`'s Sloth wake beat item. Sizes and status
of every sprite are in `docs/pusheen-v2-art-assets.md`; what order to do
things in is in `ROADMAP.md`.

## How to use

1. Start a new Gemini chat per asset. Earlier images in a chat bias the next.
2. Paste the style block, then the asset block. Attach the references: files
   from `public/assets/sprites/`, or a screenshot of that room from the live
   game.
3. Check the result against the checklist below. Regenerate rather than
   fixing by hand; the cutter can't repair a wrong shape.
4. Save it to `docs/concept-art/` (local only, gitignored) under the file name given, then ask Claude
   to "cut `docs/concept-art/<file>`". Claude cuts it to size with the
   scripts in `tools/`, wires it in, and checks it in the game.

## Checklist before handing an image over

- The background is one flat magenta, edge to edge: no gradient, floor,
  shadow, or white sticker-style border.
- No pink, purple, lavender or mauve anywhere on the object. The cutter
  removes that whole colour family, so those parts come out as holes.
- In multi-item images, items don't touch or overlap, with clear magenta
  between them.
- Squint test: shrunk to about a tenth of its size, the outlines should
  still read as dark lines. Thin outlines vanish at game size.
- Pairs (the two glasses, the two Sloth frames) match exactly apart from
  the intended difference.
- At least 1024px on the short side.

## Shared style block

Paste this at the top of every prompt:

```
STYLE: flat cartoon art in a cute, simple comic style for a cozy 2D game,
matching the attached reference images.
- Thick, clean, even-weight dark-brown outlines (#5F3719) around every
  shape and detail, about 1/40 of the object's height.
- Flat solid fills only: no gradients, no shading, no texture, no glow, no
  highlights except where stated.
- Soft rounded corners, chunky simple shapes, very few details.
- Straight-on view from about eye level unless stated otherwise. Not a 3/4
  view, not rotated or tilted.
BACKGROUND: one flat, solid magenta (#FF00FF) filling the whole image, edge
to edge. No floor, no ground line, no shadow or drop shadow, no white
sticker-style border around the shapes, no text, no logos, no watermark.
COLOURS: never use pink, magenta, purple, lavender or mauve in the objects
themselves. Browns, tans, oranges, yellows, greens, blues, greys and
off-whites are all fine.
```

---

## 1. Garden gate

**Save as** `docs/concept-art/garden_gate.jpg`. **In game:** `gardenGate`,
about 76×150, standing on the grass in the Backyard. It appears when Sloth
wakes and is the way through to the house. **Attach:** a Backyard
screenshot, `backyard-tree.png`. *As cut:* 128×150. The art came out
wider than asked, with posts either side of the picket panel, so the
walk-into zone is sized to the 87px panel alone (`tools/cut_prop.py
--posts`).

```
ASSET: a small wooden garden gate on its own, seen straight-on from the
front, standing upright and closed. About twice as tall as it is wide.
- Rounded-top vertical pickets with small gaps between them, joined by two
  horizontal rails and one diagonal brace.
- A gently arched top edge.
- Warm wood matching the tree trunk in the reference: #CD875F, with the
  picket faces a little lighter (#E1A578).
- A small round dark latch on the right-hand side.
- A little green ivy (#7DA569) curling up the left post.
- Just the gate: no fence, hedge, extra posts, or ground. Its bottom edge
  is flat and level.
COMPOSITION: portrait image, about 1024x1536. The gate is centred and fills
about 80% of the height.
```

## 2. Screen door

**Save as** `docs/concept-art/screen_door.jpg`. **In game:** `screenDoor`,
about 76×150, the door between the Backyard and the Kitchen; the same
sprite is used on both sides. **Attach:** a Kitchen screenshot,
`kitchen-bg.png`. *As cut:* 87×150, keeping the art's own proportions.

```
ASSET: a wooden screen door on its own, seen straight-on, closed. About
twice as tall as it is wide.
- A warm wood frame (#C8915F) with a middle rail and a small solid kick
  panel at the bottom.
- The two openings filled with screen mesh, drawn as a flat pale
  grey-green (#CFE3D8) with a faint, sparse cross-hatch (4 to 6 thin lines
  each way), not a fine grid.
- A small round brass-yellow handle (#E8B84A) on the right-hand side.
- Just the door: no wall, frame around it, or floor. Its bottom edge is
  flat and level.
COMPOSITION: portrait image, about 1024x1536. The door is centred and fills
about 80% of the height.
```

## 3. Glass, empty and full

**Save as** `docs/concept-art/glasses.jpg`. **In game:** `glass` and
`orangeJuice`, both 66×84. The empty glass sits on the kitchen counter; she
carries it at 60% size, and after the fridge it swaps to the full one, so
the two must match exactly. **Attach:** a Kitchen screenshot,
`step-boxes.png` (the most recently approved kitchen art).

```
ASSET: two drinking glasses side by side, identical in shape, size and
position except for what's inside. Left: empty. Right: filled about
three-quarters with orange juice.
- A simple tumbler, a bit taller than it is wide (about 3:5), slightly
  wider at the top, with rounded bottom corners and a thicker base.
- Draw the glass as if it were solid, NOT see-through: fill it with a flat,
  very pale blue (#DCEFF7) and one white vertical highlight stripe. The
  background must not show through the glass anywhere.
- The juice: flat orange (#FFA03C), with a lighter band at its surface
  (#FFC46B) and the pale-blue glass rim still visible above it.
- A wide gap of magenta between the two glasses.
COMPOSITION: landscape image, about 1536x1024. Each glass is about 70% of
the image height, both on the same baseline.
```

## 4. Fridge items

**Save as** `docs/concept-art/fridge_items.jpg`. **In game:** shown in a row
on the fridge shelf when it opens; tap one to take it. Target sizes:
`juicePitcher` 112×112, `itemMilk` 72×100, `itemCheese` 96×76,
`itemLeftovers` 86×68. The pitcher fills her glass; the rest are cozy
decoys. **Attach:** a Kitchen screenshot, `step-boxes.png`, and the glasses
image once you have it, so the juice matches. *As cut:* all four at one
scale, keeping their drawn sizes relative to each other (pitcher 94×100,
milk 63×99, cheese 69×64, leftovers 75×66), standing on the interior's
shelf.

```
ASSET: four separate kitchen items in a row, left to right, drawn at the
same scale, each with a wide gap of magenta around it. They must not touch
or overlap.
1. An orange-juice pitcher: a chunky jug full of orange juice (#FFA03C,
   with a lighter #FFC46B band at the top), handle on the LEFT, pouring
   spout on the RIGHT. Draw the jug's glass as a thin pale-blue (#DCEFF7)
   rim around the juice; nothing see-through. The tallest item.
2. A milk carton: gable-top carton, warm off-white body (#F6EFE2, not pure
   white), a blue band and top (#7DB7E8), and a simple blue drop shape on
   the front. No text. About 90% of the pitcher's height.
3. A wedge of cheese: yellow (#F6C945), a blunt-nosed wedge seen from the
   side, with three round holes in a darker yellow (#E0A91F). About 70% of
   the pitcher's height, and wider than it is tall.
4. Leftovers: a round food-storage tub with a snap-on lid, an opaque pale
   blue body (#BCDCE6), a darker blue lid (#8FBFD0), and a strip of tan
   masking-tape label on the front with no text. About 60% of the
   pitcher's height, and wider than it is tall.
COMPOSITION: wide landscape image, about 2048x768. The four items are
spread evenly along one baseline.
```

## 5. Fridge interior

**Save as** `docs/concept-art/fridge_inside.jpg`. **In game:**
`fridgeInside`, 640×300, the backdrop of the panel that opens when she uses
the fridge. The four items above are drawn on top of it in a row just above
the middle, with their names underneath. **Attach:** a Kitchen screenshot
(the fridge is the mint one on the right). *As cut:* 640×350. The items
stand on its painted shelf, with a row of number badges above them and
their names in the lower compartment.

```
ASSET: the inside of an open refrigerator, seen straight-on, as one wide
rounded rectangle about 2.1 times as wide as it is tall.
- A mint-green frame all round (#D2E9D4), matching the fridge in the
  reference, about 1/12 of the height thick.
- A bright, soft cool-white interior (#F4F9FA) with a slightly darker line
  where the back wall meets the sides.
- One shelf running straight across, about two-thirds of the way down, with
  a thin front edge (#BFD8DE).
- A small round light at the top centre.
- Completely empty: no food, bottles or items.
- Outlines thinner than usual on this one: about 1/100 of the height.
COMPOSITION: landscape image, about 1600x800. The panel is centred on the
magenta and fills about 90% of the width.
```

## 6. Sloth walking (two frames)

**Save as** `docs/concept-art/sloth_walk.jpg`. **In game:** two frames
alternated while he plods off after waking, in place of the single
arms-up stretch pose he walks in today. About 124×170 each, the same size
as `slothAwake`. He walks to the LEFT. **Attach:** `sloth-awake.png`,
`sloth-sitting.png`, `sloth-hanging-front.png`.

Image generators are weakest at a set of frames that stay consistent, so
check this one closely: if the head changes size or the colours shift
between the frames, regenerate.

```
ASSET: two animation frames of the same sloth character as the attached
references, side by side, both walking slowly to the LEFT.
- Standing upright on his hind legs, turned three-quarters toward the
  left. Sleepy closed eyes, a small content smile, long arms hanging
  loosely forward.
- Frame 1 (left): his left foot forward. Frame 2 (right): his right foot
  forward. His arms swing opposite to his legs.
- Everything else identical between the frames: same size, same head
  position and height, same face, same colours, same outline weight.
- Colours as in the references: light-brown fur (#D7AF87), the lighter
  rounded face patch (#F5D7C3), dark-brown eye bands and claws (#552D0F).
- The same proportions as the standing reference: about 3:4, taller than
  wide.
- A wide gap of magenta between the two frames.
COMPOSITION: landscape image, about 1536x1024. Each frame is about 80% of
the image height, both standing on the same baseline.
```

## 7. Butterfly

**Save as** `docs/concept-art/butterfly.jpg`. **In game:** `butterfly`,
about 44×36, flying around the Backyard. One sprite is enough: the wing flap
is done in code by squashing its width. **Attach:** a Backyard screenshot.
*As cut:* a 53px wingspan, split into five pieces (body and antennae, four
wings) so each wing flaps on its own (`tools/cut_butterfly.py`). One image
was still all it needed.

```
ASSET: one small butterfly seen from directly in front, wings fully open
and symmetrical.
- Four simple rounded wings in sunny yellow (#FFD95A), with orange
  (#FFA03C) edges and two small dark-brown dots.
- A short, rounded dark-brown body and two curled antennae.
- Cute and chunky, not realistic.
COMPOSITION: square image, about 1024x1024. The butterfly is centred and
fills about 70% of the width.
```

## 8. Sloth wake-up storyboard (for exploring, not for the game)

**Save as** `docs/concept-art/sloth_wake_storyboard.jpg`. This one isn't cut
into sprites. It's for deciding which poses the wake beat should pass
through between hanging and lying down, before generating the real ones
(`ROADMAP.md`, Now, item 3). Try a few variations and keep the one that
reads best. **Attach:** `sloth-hanging-front.png`, `sloth-awake.png`,
`sloth-sitting.png`.

```
ASSET: a storyboard of the same sloth character as the attached references:
six small keyframes in a row, left to right, the character the same size
in every frame, each frame separated by a wide gap of magenta.
1. Hanging asleep under a branch by all four paws, like the hanging
   reference.
2. Waking with a big slow yawn, still hanging.
3. Letting go: dropping straight down, arms still raised above his head.
4. Landing on his feet with a soft squash, knees bent.
5. Walking slowly to the LEFT, upright, arms hanging loosely.
6. Lying down on his belly to rest, eyes open, like the lying reference.
Draw the branch only in frames 1 to 3, as a simple brown bar.
COMPOSITION: wide landscape image, about 2400x800. All six frames share
one baseline.
```
