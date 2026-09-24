# tools — art cutting

Three scripts that turn the concept art in `docs/concept-art/` into the
transparent PNGs the game loads. They are how `backyard-tree.png`, the two
hanging-sloth layers and the kitchen's two climbing steps were made;
re-running any of them with no arguments reproduces the shipped files byte
for byte.

```bash
pip install pillow scipy          # not part of the npm toolchain

python3 tools/cut_tree.py         # -> public/assets/sprites/backyard-tree.png
python3 tools/cut_sloth.py        # -> public/assets/sprites/sloth-hanging-{front,back}.png
python3 tools/cut_prop.py         # -> public/assets/sprites/step-{stool,cart}.png
```

Add `--preview out.png` to the first two to composite the result on the
scene's palette, which is the fastest way to spot a halo or a leftover
fringe. `cut_prop.py --preview DIR` writes each prop at 4x on the kitchen's
cabinet colour, with the line she stands on drawn in red.

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

**`cut_prop.py`** — single props drawn alone on flat magenta: `stool` and
`cart` presets, both by default. The key and rim un-mixing are imported from
`cut_tree.py`, so its fixes below apply as-is. What differs: the key is
global rather than a flood in from the border, since the cart shows
background through gaps it fully encloses (between its tiers, inside the
wheel frame, between its twin front poles). And each prop is **sized by
gameplay**: both are drawn in 3/4 view, so the sprite's top edge is the far
rim of its top face, and she stands halfway back across that face instead.
A preset's `stand` is that height above the floor (the step's height in
`Kitchen.js`), and the prop is scaled to put it exactly there. The cart gets
two more fixes: its outlines are drawn at ~4px against the stool's ~10, which
would land well under a pixel in game, so `ink` thickens them before the
downsize; and `tint` moves its fills from a pinkish cream that vanished
against the cream cabinets onto a mint from the fridge's family.

**`cut_tree.py` and `cut_sloth.py`**, and this is what a hand-authored
vector source never exposed: (1) a background pixel can still read as fully opaque with the
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

`cut_prop.py` reports each sprite's size, the row she stands on (and its
height above the feet, which should match `stand`), and the top face's width
and offset from the sprite's centre. The `LAYOUT` sprite sizes and `LEDGES`
widths in `Kitchen.js` are copied from these. To change a step's height,
change its `stand` here and `STOOL_TOP`/`CART_TOP` there together, then
re-cut.

## Sources

| Source | Used by | Notes |
|---|---|---|
| `new_tree.jpeg` | `cut_tree.py` (default) | Tree alone on flat magenta, JPEG. Cuts the tree in the game today. |
| `backyard-tree-source.png` | `cut_tree.py --no-magenta` | The original source: a whole scene on flat sky + grass, tree fused to the hedge. Superseded, but its cut is still reproducible. |
| `updated_hanging_sloth_manual_edit.png` | `cut_sloth.py` (default) | Magenta background, **green** branch, fur re-matched to the awake poses. Cuts both layers in the game today. |
| `hanging-sloth-source.png` | `cut_sloth.py --no-simple` | The original source: magenta background, **tan** branch close enough to the sloth's own outline colour to defeat a plain colour key. Superseded, but it still cuts (its far arms need `--far`). |
| `stool1.jpg` | `cut_prop.py stool` | The step stool, alone on magenta, JPEG. (`stool2.jpg`, a round stool with a white sticker border, was the alternative not taken.) |
| `kitchen_drawers2.jpg` | `cut_prop.py cart` | The rolling cart, alone on magenta, JPEG; outlines thickened and recoloured in the cut. (`kitchen_drawers1.jpg`, a cubby shelf, is superseded by it.) |

`SLOTH.restHeight` and `SLOTH.gripRow` in `feel.js` are derived from whichever
sprites are currently cut in — re-derive them (the comments on those
constants show the working) after switching sources.
