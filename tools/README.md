# tools — art cutting

Two scripts that turn the concept art in `docs/concept-art/` into the
transparent PNGs the game loads. They are how `backyard-tree.png` and
`sloth-hanging.png` were made; re-running either with no arguments reproduces
the shipped file byte for byte.

```bash
pip install pillow scipy          # not part of the npm toolchain

python3 tools/cut_tree.py         # -> public/assets/sprites/backyard-tree.png
python3 tools/cut_sloth.py        # -> public/assets/sprites/sloth-hanging.png
```

Add `--preview out.png` to either to composite the result on the scene's
palette, which is the fastest way to spot a halo or a leftover fringe.

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
branch, so the generated one has to come back out leaving the gap his paws wrap.
The shipped source paints that branch bright green, a colour the sloth's own
palette never uses, so `--simple` (the default) takes it in one chromaticity
key. The very first source instead painted it tan, close enough to the sloth's
own outline colour to defeat a colour key outright — `--no-simple` keeps that
harder path working: walk-out-then-sideways-grow outline passes and a sliver
close, described in the file. The green branch also isn't drawn all the way
into the crook of each bent arm -- that part was always meant to sit under the
game's own branch and so was never inked -- so once it's keyed out the fur
there is left with a bare, un-outlined edge. `--simple` detects that (fur
touching keyed branch with no ink between; a real seam always has ink there
already) and strokes one in, matching the sprite's own line weight and colour.

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

## The numbers they print

`cut_tree.py` reports the trunk base row and the branch's thickness and height
above it. `cut_sloth.py` reports the grip gap. **`SLOTH.restHeight` in
`feel.js` is derived from exactly these**, so if you re-cut either asset with
different geometry, re-derive it — the comment on that constant shows the
working. The rule: the scene's branch must be at least as thick as the grip gap.
Thicker is fine and reads naturally, since the surplus shows between his arms.
Thinner shows sky through the grip, which is the failure this whole arrangement
exists to avoid.

## Sources

| Source | Used by | Notes |
|---|---|---|
| `new_tree.jpeg` | `cut_tree.py` (default) | Tree alone on flat magenta, JPEG. Cuts the tree in the game today. |
| `backyard-tree-source.png` | `cut_tree.py --no-magenta` | The original source: a whole scene on flat sky + grass, tree fused to the hedge. Superseded, but its cut is still reproducible. |
| `updated_hanging_sloth_manual_edit.png` | `cut_sloth.py` (default) | Magenta background, **green** branch, fur re-matched to the awake poses. Cuts the sprite in the game today. |
| `hanging-sloth-source.png` | `cut_sloth.py --no-simple` | The original source: magenta background, **tan** branch close enough to the sloth's own outline colour to defeat a plain colour key. Superseded, but its cut is still reproducible. |

`SLOTH.restHeight` in `feel.js` is derived from whichever sprites are
currently cut in — re-derive it (the comment on that constant shows the
working) after switching sources, even though in practice they've all landed
within a couple of px of each other.
