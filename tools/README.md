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

Beyond that, each has one specific problem:

**`cut_tree.py`** — the tree is fused to the hedge through the horizon outline
that runs behind both. It severs those rows, keeps the canopy's component plus
the root flare below, then rebuilds the trunk across the gap by interpolating.
It also un-mixes against sky above the horizon and grass below, or the root
flare picks up a green halo.

**`cut_sloth.py`** — the art is generated *with* a branch drawn through it (a
generator asked for a grip on nothing draws mush), and the scene draws its own
branch, so the generated one has to come back out leaving the gap his paws wrap.
The shipped source paints that branch bright green, a colour the sloth's own
palette never uses, so `--simple` (the default) takes it in one chromaticity
key. The very first source instead painted it tan, close enough to the sloth's
own outline colour to defeat a colour key outright — `--no-simple` keeps that
harder path working: walk-out-then-sideways-grow outline passes and a sliver
close, described in the file.

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
| `backyard-tree-source.png` | `cut_tree.py` | Whole scene on flat sky + grass. |
| `updated_hanging_sloth_manual_edit.png` | `cut_sloth.py` (default) | Magenta background, **green** branch, fur re-matched to the awake poses. Cuts the sprite in the game today. |
| `hanging-sloth-source.png` | `cut_sloth.py --no-simple` | The original source: magenta background, **tan** branch close enough to the sloth's own outline colour to defeat a plain colour key. Superseded, but its cut is still reproducible. |

`SLOTH.restHeight` in `feel.js` is derived from whichever sprite is currently
cut in — re-derive it (the comment on that constant shows the working) after
switching sources, even though in practice the two so far have landed within a
pixel of each other.
