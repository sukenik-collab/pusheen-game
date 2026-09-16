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
In the current source that branch is tan with an outline in the same dark brown
as the sloth's own, so no colour test separates them — hence the two outline
passes and the sliver close described in the file.

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
| `hanging-sloth-source.png` | `cut_sloth.py` | Magenta background, **tan** branch. Cut the sprite in the game today. |
| `updated_hanging_sloth_manual_edit.png` | — | Newer: fur matched to the awake poses, and the branch painted green so it keys in one pass. Not adopted yet. |

To cut the newer source, `--simple` swaps the outline passes for a single
brightness-invariant key on the branch colour, which takes its fill and its
darker outline together:

```bash
python3 tools/cut_sloth.py \
  --src docs/concept-art/updated_hanging_sloth_manual_edit.png \
  --branch 74,250,21 --branch-tol 70 --band 10,300 --simple
```

That produces a clean 180×159 sprite with no green left. It is **not** wired
into the game — adopting it means re-deriving `SLOTH.restHeight` against its
grip gap (45px, against the current sprite's 42px) and a playtest.
