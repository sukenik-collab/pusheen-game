# tools — art cutting

Scripts that turn the concept art in `docs/concept-art/` into the transparent
PNGs the game loads. They are how `backyard-tree.png`, the two hanging-sloth
layers, the kitchen's climbing boxes, the two doorways, the fridge interior,
the glasses and the fridge items were made; re-running any of them with no
arguments reproduces the shipped files byte for byte (`cut_prop.py` and
`cut_items.py` need their `--src`/`--out`/size flags every time -- they cut
whichever prop or item image you point them at, not one fixed source).

```bash
pip install pillow scipy          # not part of the npm toolchain

python3 tools/cut_tree.py         # -> public/assets/sprites/backyard-tree.png
python3 tools/cut_sloth.py        # -> public/assets/sprites/sloth-hanging-{front,back}.png
python3 tools/cut_boxes.py        # -> public/assets/sprites/step-boxes.png

# A single free-standing prop (a door, the fridge interior): fit to one
# target dimension, the other follows the source's own aspect ratio.
python3 tools/cut_prop.py --src docs/concept-art/screen_door.jpg \
    --out public/assets/sprites/screen-door.png --height 150

# One image, several items: split by connected component, left to right.
# Each to its own box (the glasses, which must match to the pixel)...
python3 tools/cut_items.py --src docs/concept-art/glasses.jpg \
    --item "glass=66x84:public/assets/sprites/glass.png" \
    --item "orangeJuice=66x84:public/assets/sprites/orange-juice.png"
# ...or all at one scale, keeping their drawn proportions (the fridge items).
python3 tools/cut_items.py --src docs/concept-art/fridge_items.jpg --same-scale 100 \
    --item "itemMilk:public/assets/sprites/item-milk.png" \
    --item "itemCheese:public/assets/sprites/item-cheese.png" \
    --item "itemLeftovers:public/assets/sprites/item-leftovers.png" \
    --item "juicePitcher:public/assets/sprites/juice-pitcher.png"
```

Add `--preview out.png` to any of them to see the result on the scene's
palette, which is the fastest way to spot a halo or a leftover fringe
(`cut_boxes.py`'s also marks the lines she stands on, in red; `cut_prop.py`'s
marks a `--posts` split; `cut_items.py` writes one preview per item).

## Why these aren't just a background delete

Both sources are flat-colour cartoons with thick outlines, so a naive colour key
leaves two artefacts: a fringe of half-background pixels around every edge, and
raw transparent pixels that mipmapping later samples into the sprite. Both
scripts therefore solve the anti-aliased rim by un-mixing it against the
background it fades into, then bleed the colour outward under the transparency.

Beyond that, each has its own problem, and both share two more that only
showed up once a source stopped being a small, clean vector export:

**`cut_tree.py`** (`--magenta`, the default) — the tree is painted alone on
flat magenta. A plain colour key, except the source is a JPEG: its edge is a
soft several-px gradient, not a crisp 1-2px anti-alias, and over that stretch
plain distance-from-magenta isn't a safe background test -- the canopy's own
green sits only about as far from magenta as the gradient is by the point
it's actually resolved. What actually marks a magenta blend, at any
strength, is green suppressed relative to red and blue, so that's the key
instead of raw distance. `--no-magenta` keeps the very first source working:
a whole scene on flat sky + grass, tree fused to the hedge through the
horizon outline that runs behind both. It severs those rows, keeps the
canopy's component plus the root flare below, then rebuilds the trunk across
the gap by interpolating, and un-mixes against sky above the horizon and
grass below so the root flare doesn't pick up a green halo.

**`cut_sloth.py`** — the art is generated *with* a branch drawn through it (a
generator asked for a grip on nothing draws mush), and the scene draws its own
branch, so the generated one has to come back out. The shipped source paints
that branch bright green, a colour the sloth's own palette never uses, so
`--simple` (the default) takes it in one chromaticity key. The very first
source instead painted it tan, close enough to the sloth's own outline colour
to defeat a colour key outright — `--no-simple` keeps that harder path
working: walk-out-then-sideways-grow outline passes and a sliver close,
described in the file.

He *wraps* the branch, so the cut is two same-size layers the scene draws
either side of the tree: a **back** layer holding just his far arms, and a
**front** layer with everything else (head, body, near arms, and all four paws
where they hook over the top). The far arms are the only regions of their
darker shade that touch the branch -- the same shade also shades his head and
belly, but never there -- plus the ink along their open sides; ink an arm
shares with his near arm or head stays with that near shape, in front. Each
far arm's top was cut flat by the generated branch, so it's extended a few px
up behind where that branch ran, to tuck under the scene's branch rather than
stop on its lower edge. The legacy tan source paints its far arms a different
shade -- pass `--far` to split them.

**Both scripts**, and this is what a hand-authored vector source never
exposed: (1) a background pixel can still read as fully opaque with the
background's own colour, when it doesn't fit the plain blend line between the
sampled foreground and background closely enough -- both scripts' fallback
for that case used to just assume "solid foreground", which is right at a
genuine hard corner but wrong for, say, a soft rendered shadow the source
drew under the tree trunk straight onto the magenta; `cut_tree.py` guards it
with the same background test used for the initial key. (2) PIL's own
`Image.resize` on an RGBA array resizes colour and alpha independently, so a
fully-transparent neighbour's leftover colour (here, magenta) leaks into
partly-opaque output pixels at the final downsize to sprite resolution --
worse, visibly, with Lanczos, whose negative lobes ring that leak into a
faint but real colour fringe. Both scripts resize premultiplied, through a
shared `resize_rgba`, with a box filter rather than Lanczos since this is a
big downsample either way and box has no lobes to ring.

## `cut_boxes.py`

The two cardboard boxes she climbs to the kitchen counter, drawn together on
flat magenta and cut as one sprite. The key, rim un-mixing and resize are
imported from `cut_tree.py`, so the fixes above apply as-is. What's its own
is the sizing, which comes from gameplay rather than a pixel size: the boxes
show their tops a little from above, so she stands halfway back across a
top face, not on the sprite's top edge (that face's far rim). The script
measures each top face between the outlines along its back and front edges,
and fits one scale that puts both middles at their step heights, 80 and
160px above the floor. That only works if the source's two faces sit close
to 1:2, so it refuses a source where either would land more than 1.5px off.

## `cut_prop.py` and `cut_items.py`

Both key the background directly (every bg-scored pixel is background),
rather than flood-filling out from the border like `cut_tree.py`'s magenta
path. A flood only reaches background that's connected to the edge, and two
of these sources have background pockets that aren't: the garden gate's
picket tops touch at their rounded peak, sealing off the magenta gap between
each picket from the sky above it, and the OJ pitcher's handle encloses a
pocket of background. A flood would leave both baked in as opaque magenta. Nothing else in these sources paints a colour close enough
to magenta for the direct key to over-trigger.

`cut_prop.py`'s `--posts` split (the garden gate's picket panel vs. its two
posts) classifies one row rather than voting over each column's full height,
because two things share the posts' own dark wood colour without being post:
the diagonal brace, which can dominate whichever picket it lands near the top
of, and the post's own ivy overlay, which eats into *its* colour the same
way. A single clean row (`--posts-row`, picked clear of both) sidesteps the
ambiguity entirely; `--preview` marks where it landed in red, so a bad
`--posts-row` is obvious at a glance.

`cut_items.py` sizes items one of two ways. `--item name=WxH:out.png`
resizes each straight to its own box -- for the glasses, which swap in for
each other and must match to the pixel. `--same-scale PX` gives every item
one scale, the tallest coming out PX tall -- for the fridge items, which
stand side by side on a shelf: forcing each into its own box stretched some
(the cheese by 17%) and made their sizes relative to each other arbitrary.

## The numbers they print

`cut_tree.py` reports the trunk base row and the branch's thickness and height
above it. `cut_sloth.py` reports the band his art's own branch ran through
(rows, measured under the paws) and how high the far arms reach. **`SLOTH.
restHeight` and `SLOTH.gripRow` in `feel.js` are derived from exactly these**,
so if you re-cut either asset with different geometry, re-derive them — the
comments on those constants show the working. The rules: the scene's branch
must cover the far arms' cut tops and their extension (or they show), and its
top edge sits a few px above his art's branch so his paws hook over it rather
than rest on it.

`cut_boxes.py` reports the sprite's size and, for each box, the height she
stands at (the middle of its top face) and the rows that face spans, its
width, and its offset from the sprite's centre. `LAYOUT` and `LEDGES` in
`Kitchen.js` are copied from these. The heights are the script's `stand`
values and must match `LOW_BOX_TOP` / `TALL_BOX_TOP` there: every rise to
the counter's 240 is just inside a hop, so change them together or not at
all.

## Sources

| Source | Used by | Notes |
|---|---|---|
| `new_tree.jpeg` | `cut_tree.py` (default) | Tree alone on flat magenta, JPEG. Cuts the tree in the game today. |
| `backyard-tree-source.png` | `cut_tree.py --no-magenta` | The original source: a whole scene on flat sky + grass, tree fused to the hedge. Superseded, but its cut is still reproducible. |
| `updated_hanging_sloth_manual_edit.png` | `cut_sloth.py` (default) | Magenta background, **green** branch, fur re-matched to the awake poses. Cuts both layers in the game today. |
| `hanging-sloth-source.png` | `cut_sloth.py --no-simple` | The original source: magenta background, **tan** branch close enough to the sloth's own outline colour to defeat a plain colour key. Superseded, but it still cuts (its far arms need `--far`). |
| `kitchen_boxes.jpg` | `cut_boxes.py` | Both boxes together on flat magenta, JPEG. The tall box's top face sits at 2.01x the short one's height, which is what lets one scale land both on their steps. |
| `garden_gate.jpg` | `cut_prop.py --posts` | The gate alone on flat magenta. Posts `202,124,76`, panel (picket faces) `227,159,110`; `--posts-row 0.247` lands clear of the rails, brace and ivy. |
| `screen_door.jpg` | `cut_prop.py` | The door alone on flat magenta. |
| `fridge_inside.jpg` | `cut_prop.py` | The empty interior alone on flat magenta. |
| `glasses.jpg` | `cut_items.py` | Empty and full glass, side by side. |
| `fridge_items.jpg` | `cut_items.py --same-scale 100` | Milk, cheese, leftovers tub and the OJ pitcher, left to right in the source (not the prompt's pitcher-first order -- match `--item` specs by shape, not by re-reading the prompt). |

`SLOTH.restHeight` and `SLOTH.gripRow` in `feel.js` are derived from whichever
sprites are currently cut in — re-derive them (the comments on those
constants show the working) after switching sources.
