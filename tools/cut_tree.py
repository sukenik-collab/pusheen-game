#!/usr/bin/env python3
"""Clip the backyard tree out of its concept image into a transparent PNG.

The source is a whole scene painted on flat sky and flat grass, with a scalloped
hedge along the horizon. The game draws sky and grass as rectangles and the hedge
as a generated texture (see Preloader.js), so all this needs to lift out is
canopy + branch + trunk + root flare.

The one awkward part: the tree is fused to the hedge through the horizon outline
that runs behind both. So the cut is -- sever those rows, label what's left, keep
the canopy's component plus the root flare below the horizon, then rebuild the
severed rows across the trunk by interpolating the bark either side of them.
Restoring the source pixels there instead would drag the horizon line's stubs
back in, poking out past the bark.

Usage:
    python3 tools/cut_tree.py [--src IN.png] [--out OUT.png] [--preview P.png]

Needs: pillow, scipy  (pip install pillow scipy)
"""
import argparse

import numpy as np
from PIL import Image
from scipy import ndimage

# Sampled from the concept art. The scene's BACKYARD palette (Preloader.js)
# matches these, which is why the flat rectangles join the clip invisibly.
SKY = np.array([186, 203, 244], float)
GRASS = np.array([128, 166, 111], float)

# The horizon outline, generously bracketed so its anti-aliased fringe is cut
# too -- a couple of stray rows here leave dark nubs on the finished trunk.
HZ_TOP, HZ_BOT = 728, 747

# Seeds identifying the two parts of the tree, in source pixels: somewhere well
# inside the canopy, and inside the root flare below the horizon.
CANOPY_SEED = (200, 500)
ROOT_SEED = (780, 662)

RIM = 3       # px of anti-aliasing to un-mix around the silhouette
PAD = 2       # transparent margin left on the crop


def flood(seed, allow):
    """Grow `seed` through `allow` until it stops changing."""
    m = seed & allow
    active = m.copy()
    while active.any():
        g = np.zeros_like(active)
        g[1:, :] |= active[:-1, :]
        g[:-1, :] |= active[1:, :]
        g[:, 1:] |= active[:, :-1]
        g[:, :-1] |= active[:, 1:]
        g &= allow & ~m
        if not g.any():
            break
        m |= g
        active = g
    return m


def main():
    ap = argparse.ArgumentParser(description=__doc__,
                                 formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument('--src', default='docs/concept-art/backyard-tree-source.png')
    ap.add_argument('--out', default='public/assets/sprites/backyard-tree.png')
    ap.add_argument('--preview', help='also composite the result on the scene palette')
    args = ap.parse_args()

    a = np.array(Image.open(args.src).convert('RGB')).astype(float)
    h, w, _ = a.shape
    near = lambda c, tol: np.abs(a - c).max(axis=2) <= tol

    top = np.zeros((h, w), bool)
    top[0, :] = True
    sky = flood(top, near(SKY, 14))

    # The hedge is the same green as the grass, so the grass flood has to be
    # fenced off below the horizon or it swallows the hedge's interiors too.
    bot = np.zeros((h, w), bool)
    bot[-1, :] = True
    grass_allow = near(GRASS, 14).copy()
    grass_allow[:HZ_BOT, :] = False
    grass = flood(bot, grass_allow)

    scenery = ~sky & ~grass

    cut = scenery.copy()
    cut[HZ_TOP:HZ_BOT + 1, :] = False
    lab, _ = ndimage.label(cut, structure=np.ones((3, 3)))
    canopy_lab, root_lab = lab[CANOPY_SEED], lab[ROOT_SEED]
    if not (canopy_lab and root_lab and canopy_lab != root_lab):
        raise SystemExit(f'seeds did not land in two distinct parts '
                         f'(canopy={canopy_lab}, root={root_lab}) -- check them against {args.src}')
    tree = (lab == canopy_lab) | (lab == root_lab)

    # Rebuild the severed rows as plain trunk: only columns that are trunk on
    # BOTH sides of the cut, filled by interpolating those two rows.
    cols = tree[HZ_TOP - 1, :] & tree[HZ_BOT + 1, :]
    tree[HZ_TOP:HZ_BOT + 1, :] |= cols[None, :]
    span = HZ_BOT + 1 - HZ_TOP
    for i, y in enumerate(range(HZ_TOP, HZ_BOT + 1)):
        f = (i + 1) / (span + 1)
        a[y, cols] = a[HZ_TOP - 1, cols] * (1 - f) + a[HZ_BOT + 1, cols] * f
    xs = np.nonzero(cols)[0]
    print(f'trunk stitched across x {xs.min()}..{xs.max()}; tree = {int(tree.sum())}px')

    # Alpha: solid inside, and the rim solved by un-mixing each edge pixel
    # against the background it fades into -- sky above the horizon, grass below,
    # or the root flare picks up a green halo.
    alpha = tree.astype(float)
    rgb = a.copy()

    dil = tree.copy()
    for _ in range(RIM):
        g = dil.copy()
        g[1:, :] |= dil[:-1, :]
        g[:-1, :] |= dil[1:, :]
        g[:, 1:] |= dil[:, :-1]
        g[:, :-1] |= dil[:, 1:]
        dil = g
    rim = dil & ~tree

    idx = ndimage.distance_transform_edt(~tree, return_distances=False, return_indices=True)
    fg = a[idx[0], idx[1]]
    bg = np.where((np.arange(h) < HZ_BOT)[:, None, None], SKY, GRASS)

    d = fg - bg
    den = (d * d).sum(axis=2)
    num = ((a - bg) * d).sum(axis=2)
    with np.errstate(divide='ignore', invalid='ignore'):
        t = np.where(den > 1e-6, num / den, 0.0)
    resid = np.linalg.norm((a - bg) - t[..., None] * d, axis=2)
    t = np.clip(t, 0.0, 1.0)
    t[resid > 40] = 1.0          # too far off the bg->fg line to be a blend
    alpha[rim] = t[rim]
    with np.errstate(divide='ignore', invalid='ignore'):
        un = bg + (a - bg) / np.clip(alpha, 1e-3, 1)[..., None]
    rgb[rim] = np.clip(un[rim], 0, 255)

    # Bleed colour outward so mipmaps never sample raw transparent pixels.
    solid = alpha > 0.01
    idx2 = ndimage.distance_transform_edt(~solid, return_distances=False, return_indices=True)
    rgb[~solid] = rgb[idx2[0], idx2[1]][~solid]

    out = np.dstack([rgb, alpha * 255]).astype(np.uint8)
    ys, xs = np.nonzero(solid)
    y0, y1 = max(0, ys.min() - PAD), min(h, ys.max() + 1 + PAD)
    x0, x1 = max(0, xs.min() - PAD), min(w, xs.max() + 1 + PAD)
    crop = out[y0:y1, x0:x1]
    Image.fromarray(crop).save(args.out)
    print(f'wrote {args.out}  {crop.shape[1]}x{crop.shape[0]}  '
          f'(source bbox x {x0}..{x1} y {y0}..{y1})')

    # Backyard.js pins the trunk base to groundTop, so it needs to be the
    # bottom of the art. Report it, and where the branch sits above it --
    # SLOTH.restHeight is derived from these two numbers.
    opaque = crop[..., 3] > 10
    base = np.nonzero(opaque.any(axis=1))[0].max()
    print(f'trunk base at crop row {base} of {crop.shape[0]}')

    # Measure the branch by bark colour rather than alpha: out past the trunk an
    # alpha column runs canopy and branch together, which reads as one huge run.
    ch, cw = crop.shape[:2]
    r, g, b = (crop[..., i].astype(int) for i in range(3))
    bark = opaque & (r - b > 50) & (r - g > 25) & (r > 140) & (r < 235)
    for frac in (0.60, 0.65, 0.70):
        col = np.nonzero(bark[:, int(cw * frac)])[0]
        if not len(col):
            continue
        runs = [x for x in np.split(col, np.nonzero(np.diff(col) > 1)[0] + 1) if 15 <= len(x) <= 90]
        if runs:
            br = max(runs, key=len)
            print(f'branch at x={frac:.0%}: rows {br[0]}..{br[-1]} ({len(br)}px thick), '
                  f'underside {base - br[-1]}px above the base')
            break

    if args.preview:
        prev = np.zeros((crop.shape[0], crop.shape[1], 3), np.uint8)
        prev[:] = SKY.astype(np.uint8)
        prev[HZ_BOT - y0:] = GRASS.astype(np.uint8)
        al = crop[..., 3:4].astype(float) / 255
        Image.fromarray((crop[..., :3] * al + prev * (1 - al)).astype(np.uint8)).save(args.preview)
        print(f'preview -> {args.preview}')


if __name__ == '__main__':
    main()
