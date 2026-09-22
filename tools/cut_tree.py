#!/usr/bin/env python3
"""Clip the backyard tree out of its concept image into a transparent PNG.

The shipped source is now a tree painted alone on flat magenta -- a plain
colour key plus rim un-mixing, no different from `cut_sloth.py --simple`'s
branch removal. Resized to the currently-shipped tree's own size (850x771),
since the new art was composed at the same aspect ratio to the pixel.

The very first source instead painted the whole scene -- tree, hedge, sky,
grass -- in one image, with the tree fused to the hedge through the horizon
outline that runs behind both. `--no-magenta` keeps that harder path working:
sever those rows, label what's left, keep the canopy's component plus the
root flare below the horizon, then rebuild the severed rows across the trunk
by interpolating the bark either side of them. Restoring the source pixels
there instead would drag the horizon line's stubs back in, poking out past
the bark.

Usage:
    python3 tools/cut_tree.py [--src IN.png] [--out OUT.png]
                              [--width 850] [--height 771] [--preview P.png]

Needs: pillow, scipy  (pip install pillow scipy)
"""
import argparse

import numpy as np
from PIL import Image
from scipy import ndimage

RIM = 3       # px of anti-aliasing to un-mix around the silhouette
PAD = 2       # transparent margin left on the crop
MIN_PIECE = 500  # px; below this a leftover component is a speck, not scenery

# The magenta source's background, sampled from its corners and border.
MAGENTA = np.array([253., 2., 249.])

# The old whole-scene source. The scene's BACKYARD palette (Preloader.js)
# matches these, which is why the flat rectangles join that clip invisibly.
SKY = np.array([186, 203, 244], float)
GRASS = np.array([128, 166, 111], float)

# The horizon outline, generously bracketed so its anti-aliased fringe is cut
# too -- a couple of stray rows here leave dark nubs on the finished trunk.
HZ_TOP, HZ_BOT = 728, 747

# Seeds identifying the two parts of the tree, in source pixels: somewhere well
# inside the canopy, and inside the root flare below the horizon.
CANOPY_SEED = (200, 500)
ROOT_SEED = (780, 662)


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


def resize_rgba(arr, size):
    """Resize an RGBA array the colour-correct way: premultiplied, so a fully
    transparent neighbour's colour never leaks into a partly-opaque output
    pixel. PIL's own Image.resize on RGBA resizes colour and alpha
    independently, which is exactly that leak.

    Box, not Lanczos: even premultiplied, Lanczos's negative lobes ring on a
    sharp edge, and un-dividing by a resized alpha that itself rang low
    amplifies that ring into a faint colour fringe along every edge. Box
    averaging has no negative lobes, so nothing to amplify.
    """
    a = arr[..., 3].astype(np.float32) / 255
    premult = arr[..., :3].astype(np.float32) * a[..., None]
    chans = [np.array(Image.fromarray(premult[..., i], mode='F').resize(size, Image.BOX))
             for i in range(3)]
    a_r = np.clip(np.array(Image.fromarray(a, mode='F').resize(size, Image.BOX)), 0, 1)
    with np.errstate(divide='ignore', invalid='ignore'):
        rgb_r = np.clip(np.stack(chans, axis=-1) / np.clip(a_r[..., None], 1e-6, None), 0, 255)
    return np.dstack([rgb_r, a_r * 255]).astype(np.uint8)


def despeckle(mask):
    """Drop every component but the largest -- specks, not scenery."""
    lab, n = ndimage.label(mask, structure=np.ones((3, 3)))
    if n <= 1:
        return mask
    sizes = ndimage.sum(mask, lab, index=np.arange(1, n + 1))
    kept = 1 + int(np.argmax(sizes))
    dropped = int(mask.sum() - sizes[kept - 1])
    if dropped:
        print(f'{n} components; kept 1 ({int(sizes[kept - 1])}px), '
              f'dropped {n - 1} specks ({dropped}px)')
    return lab == kept


def unmix_rim(a, tree, bg, rim=RIM, core_erode=0, bg_like=None):
    """Alpha: solid inside, rim solved by un-mixing each edge pixel against
    whichever background colour it fades into.

    `core_erode` sources the un-mix's foreground reference from well inside
    `tree` rather than right at its boundary. A JPEG source's edge isn't a
    crisp 1-2px anti-alias -- it's a soft several-px gradient -- so the
    pixels immediately inside the boundary are themselves still partway
    blended toward the background, and un-mixing against a contaminated
    reference just relocates the halo instead of removing it.

    `bg_like`, when given, is the caller's own (context-specific) test for
    "still looks like background" -- reused here to guard the off-line
    fallback below. Without it, a pixel that doesn't fit a straight blend
    between fg and bg is assumed genuinely opaque; a soft rendered shadow
    the source drew under the trunk, straight onto the magenta, doesn't fit
    that line either, but it isn't opaque tree -- it's still background, so
    forcing it solid bakes a halo of shadow right into the silhouette.
    """
    h, w, _ = a.shape
    alpha = tree.astype(float)
    rgb = a.copy()

    dil = tree.copy()
    for _ in range(rim):
        g = dil.copy()
        g[1:, :] |= dil[:-1, :]
        g[:-1, :] |= dil[1:, :]
        g[:, 1:] |= dil[:, :-1]
        g[:, :-1] |= dil[:, 1:]
        dil = g
    rim_px = dil & ~tree

    core = tree
    if core_erode:
        core = ndimage.binary_erosion(tree, iterations=core_erode, border_value=1)
        if not core.any():
            core = tree
    idx = ndimage.distance_transform_edt(~core, return_distances=False, return_indices=True)
    fg = a[idx[0], idx[1]]

    d = fg - bg
    den = (d * d).sum(axis=2)
    num = ((a - bg) * d).sum(axis=2)
    with np.errstate(divide='ignore', invalid='ignore'):
        t = np.where(den > 1e-6, num / den, 0.0)
    resid = np.linalg.norm((a - bg) - t[..., None] * d, axis=2)
    t = np.clip(t, 0.0, 1.0)
    force_opaque = resid > 40    # too far off the bg->fg line to be a blend
    if bg_like is not None:
        force_opaque &= ~bg_like
    t[force_opaque] = 1.0
    alpha[rim_px] = t[rim_px]
    # At low alpha the un-mix divides by a near-zero fraction, which amplifies
    # any noise in the observed pixel into a wildly wrong colour -- a halo of
    # the background tint. Below that, the rim is thin enough that the nearest
    # solid colour reads the same and carries none of that noise.
    with np.errstate(divide='ignore', invalid='ignore'):
        un = bg + (a - bg) / np.clip(alpha, 1e-3, 1)[..., None]
    low = alpha < 0.25
    un = np.where(low[..., None], fg, un)
    rgb[rim_px] = np.clip(un[rim_px], 0, 255)

    solid = alpha > 0.01
    idx2 = ndimage.distance_transform_edt(~solid, return_distances=False, return_indices=True)
    rgb[~solid] = rgb[idx2[0], idx2[1]][~solid]
    return rgb, alpha, solid


def report(crop):
    """Backyard.js pins the trunk base to groundTop, so it needs to be the
    bottom of the art. Report it, and where the branch sits above it --
    SLOTH.restHeight is derived from these two numbers."""
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
            return
    print('no branch run found -- check the bark colour test against the crop')


def cut_magenta(args):
    a = np.array(Image.open(args.src).convert('RGB')).astype(float)
    h, w, _ = a.shape

    # A JPEG source's edge is a soft several-px gradient, not a crisp 1-2px
    # anti-alias, and over that stretch plain distance-from-magenta isn't a
    # safe test: the canopy's own green sits only about as far from magenta
    # (~160-175) as the gradient is by the point it's actually resolved. What
    # actually marks a background blend is supressed green relative to red
    # and blue -- real tree colours never have that -- so key on that instead.
    score = np.minimum(a[..., 0], a[..., 2]) - a[..., 1]
    bg_like = score > 15
    border = np.zeros((h, w), bool)
    border[0, :] = border[-1, :] = True
    border[:, 0] = border[:, -1] = True
    bg = flood(border, bg_like)
    tree = despeckle(~bg)
    if tree.sum() < MIN_PIECE:
        raise SystemExit(f'kept component is only {int(tree.sum())}px -- '
                          f'check MAGENTA against {args.src}')

    rgb, alpha, solid = unmix_rim(a, tree, np.broadcast_to(MAGENTA, a.shape),
                                  rim=10, core_erode=6, bg_like=bg_like)

    out = np.dstack([rgb, alpha * 255]).astype(np.uint8)
    ys, xs = np.nonzero(solid)
    y0, y1 = max(0, ys.min() - PAD), min(h, ys.max() + 1 + PAD)
    x0, x1 = max(0, xs.min() - PAD), min(w, xs.max() + 1 + PAD)
    crop = out[y0:y1, x0:x1]
    resized = resize_rgba(crop, (args.width, args.height))
    Image.fromarray(resized).save(args.out)
    print(f'wrote {args.out}  {args.width}x{args.height}  '
          f'(from {crop.shape[1]}x{crop.shape[0]}, source bbox x {x0}..{x1} y {y0}..{y1})')
    report(resized)

    if args.preview:
        prev = np.zeros((args.height, args.width, 3), np.uint8)
        prev[:] = SKY.astype(np.uint8)
        al = resized[..., 3:4].astype(float) / 255
        base_row = int(args.height * 0.9)
        prev[base_row:] = GRASS.astype(np.uint8)
        Image.fromarray((resized[..., :3] * al + prev * (1 - al)).astype(np.uint8)).save(args.preview)
        print(f'preview -> {args.preview}')


def cut_hedge_fused(args):
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

    bg = np.where((np.arange(h) < HZ_BOT)[:, None, None], SKY, GRASS)
    rgb, alpha, solid = unmix_rim(a, tree, bg)

    out = np.dstack([rgb, alpha * 255]).astype(np.uint8)
    ys, xs = np.nonzero(solid)
    y0, y1 = max(0, ys.min() - PAD), min(h, ys.max() + 1 + PAD)
    x0, x1 = max(0, xs.min() - PAD), min(w, xs.max() + 1 + PAD)
    crop = out[y0:y1, x0:x1]
    Image.fromarray(crop).save(args.out)
    print(f'wrote {args.out}  {crop.shape[1]}x{crop.shape[0]}  '
          f'(source bbox x {x0}..{x1} y {y0}..{y1})')
    report(crop)

    if args.preview:
        prev = np.zeros((crop.shape[0], crop.shape[1], 3), np.uint8)
        prev[:] = SKY.astype(np.uint8)
        prev[HZ_BOT - y0:] = GRASS.astype(np.uint8)
        al = crop[..., 3:4].astype(float) / 255
        Image.fromarray((crop[..., :3] * al + prev * (1 - al)).astype(np.uint8)).save(args.preview)
        print(f'preview -> {args.preview}')


def main():
    ap = argparse.ArgumentParser(description=__doc__,
                                 formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument('--src', help='defaults to the magenta or hedge-fused source, '
                    'matching --magenta/--no-magenta')
    ap.add_argument('--out', default='public/assets/sprites/backyard-tree.png')
    ap.add_argument('--width', type=int, default=850,
                    help='output size -- matches the currently-shipped tree so '
                         'Backyard.js\'s placement numbers keep working')
    ap.add_argument('--height', type=int, default=771)
    ap.add_argument('--magenta', action=argparse.BooleanOptionalAction, default=True,
                    help='tree alone on flat magenta (default); --no-magenta for the '
                         'original whole-scene source, tree fused to the hedge')
    ap.add_argument('--preview', help='also composite the result on the scene palette')
    args = ap.parse_args()
    if args.src is None:
        args.src = ('docs/concept-art/new_tree.jpeg' if args.magenta
                    else 'docs/concept-art/backyard-tree-source.png')

    (cut_magenta if args.magenta else cut_hedge_fused)(args)


if __name__ == '__main__':
    main()
