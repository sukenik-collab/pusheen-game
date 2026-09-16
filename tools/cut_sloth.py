#!/usr/bin/env python3
"""Key the hanging sloth out of its concept image, branch and all.

The art is generated on flat magenta WITH a branch drawn through it. The branch
is there on purpose -- an image generator asked for a grip on nothing draws mush
-- but the scene draws its own branch from the tree art, so this has to take the
generated one back out and leave the gap his paws wrap. Backyard.js then lines
the real branch up with that gap (SLOTH.restHeight is derived from it).

Keying the branch's flat fill is easy. Its *outline* is the fiddly part, because
in the current source it is the same dark brown as the sloth's own, so no colour
test separates them. Two passes do it:

  1. Walk out from the fill and take the dark run only where background lies
     beyond it. At a paw the walk reaches fur or claw instead, and that outline
     belongs to the sloth, so it stays.
  2. Grow what pass 1 found sideways along its own rows, sweeping up the stubs
     flanking each paw that pass 1 had to refuse.

Then a third pass closes the fill-to-outline anti-aliasing, which is neither
flat enough for the colour key nor dark enough for the outline test and
otherwise survives as a hairline stretched across the grip.

If your source paints the branch a colour the sloth doesn't use -- a bright
green, say -- all of that is unnecessary: a single --branch key takes the fill
and the outline together, and --simple skips passes 1 and 2.

Usage:
    python3 tools/cut_sloth.py [--width 180] [--src IN.png] [--out OUT.png]
                               [--branch R,G,B] [--simple] [--preview P.png]

Needs: pillow, scipy  (pip install pillow scipy)
"""
import argparse

import numpy as np
from PIL import Image
from scipy import ndimage

MIN_PIECE = 500      # px; below this a leftover component is a speck, not a limb
RIM = 3              # px of anti-aliasing to un-mix around the silhouette


def main():
    ap = argparse.ArgumentParser(description=__doc__,
                                 formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument('--src', default='docs/concept-art/hanging-sloth-source.png')
    ap.add_argument('--out', default='public/assets/sprites/sloth-hanging.png')
    ap.add_argument('--width', type=int, default=180,
                    help='display width; the sprite is baked to size and drawn at scale 1')
    ap.add_argument('--branch', default='197,138,98',
                    help='the branch fill colour to key out')
    ap.add_argument('--branch-tol', type=int, default=12)
    ap.add_argument('--band', default='215,360',
                    help='rows the branch crosses, as "top,bottom"')
    ap.add_argument('--simple', action='store_true',
                    help='branch outline is its own colour, so skip the outline passes')
    ap.add_argument('--preview', help='also composite the result on a mock branch')
    args = ap.parse_args()

    BRANCH = np.array([float(v) for v in args.branch.split(',')])
    BAND = tuple(int(v) for v in args.band.split(','))
    K = 16               # the branch outline is ~12px thick in the current source

    a = np.array(Image.open(args.src).convert('RGB')).astype(float)
    h, w, _ = a.shape
    rows = np.arange(h)[:, None]

    magenta = (a[..., 0] > 190) & (a[..., 2] > 190) & (a[..., 1] < 90)
    if args.simple:
        # A branch painted in its own colour is shaded: the fill is bright and
        # its outline is a darker version of the same hue. Compare chromaticity
        # (colour normalised by brightness) so one key takes both.
        chroma = lambda p: p / np.clip(p.sum(axis=-1, keepdims=True), 1e-6, None)
        fill = np.abs(chroma(a) - chroma(BRANCH)).max(axis=2) <= args.branch_tol / 255
    else:
        fill = np.abs(a - BRANCH).max(axis=2) <= args.branch_tol
    dark = a.sum(axis=2) < 330
    # Magenta and anything blended toward it. Every colour on the sloth has
    # green above blue; the background is the other way round.
    bgish = a[..., 2] > a[..., 1] + 30

    outline = np.zeros((h, w), bool)
    if not args.simple:
        for x in range(w):
            col = fill[:, x]
            if not col.any():
                continue
            edges = np.nonzero(np.diff(col.astype(np.int8)))[0]
            starts = ([0] if col[0] else []) + [e + 1 for e in edges if col[e + 1]]
            ends = [e for e in edges if col[e]] + ([h - 1] if col[-1] else [])
            for t0, t1 in zip(starts, ends):
                for y0, step in ((t0 - 1, -1), (t1 + 1, 1)):
                    y, run = y0, []
                    while 0 <= y < h and dark[y, x] and len(run) <= K:
                        run.append(y)
                        y += step
                    # Look past the anti-aliasing: what matters is whether
                    # background, rather than fur, lies beyond the dark run.
                    probe = [yy for yy in range(y, y + 5 * step, step) if 0 <= yy < h]
                    if run and any(bgish[yy, x] for yy in probe):
                        outline[run, x] = True
        outline &= (rows >= BAND[0]) & (rows <= BAND[1])
        found = int(outline.sum())

        grow = outline.copy()
        while True:
            g = grow.copy()
            g[:, 1:] |= grow[:, :-1]
            g[:, :-1] |= grow[:, 1:]
            g &= dark
            if (g == grow).all():
                break
            grow = g
        outline = grow
        print(f'branch fill {int(fill.sum())}px, outline {found} -> {int(outline.sum())}px '
              f'after the row sweep')

    drop = magenta | fill | outline

    inband = ((rows >= BAND[0]) & (rows <= BAND[1])) & np.ones((1, w), bool)
    for _ in range(3):
        up = np.zeros((h, w), bool)
        dn = np.zeros((h, w), bool)
        for k in range(1, 5):
            up[k:, :] |= drop[:-k, :]
            dn[:-k, :] |= drop[k:, :]
        sliver = ~drop & inband & up & dn
        if not sliver.any():
            break
        drop |= sliver
        print(f'  closed {int(sliver.sum())}px of branch-edge sliver')

    # Drop specks, not pieces. A paw whose limb passes behind the branch is
    # joined to the sloth only through it, so removing the branch legitimately
    # leaves that paw as its own component -- the scene's branch reconnects it.
    keep = ~drop
    lab, n = ndimage.label(keep, structure=np.ones((3, 3)))
    sizes = ndimage.sum(keep, lab, index=np.arange(1, n + 1))
    small = 1 + np.nonzero(sizes < MIN_PIECE)[0]
    stray = keep & np.isin(lab, small)
    kept = ', '.join(str(int(v)) for v in sorted(sizes[sizes >= MIN_PIECE], reverse=True))
    print(f'{n} components; kept {n - len(small)} ({kept}px), '
          f'dropped {len(small)} specks ({int(stray.sum())}px)')
    keep &= ~stray
    drop |= stray

    # Un-mix the rim against whichever background it fades into: magenta on the
    # outside, the branch's own colour inside the grip.
    alpha = keep.astype(float)
    rgb = a.copy()
    rim = (ndimage.distance_transform_edt(~keep) <= RIM) & ~keep
    idx_f = ndimage.distance_transform_edt(~keep, return_distances=False, return_indices=True)
    idx_b = ndimage.distance_transform_edt(~drop, return_distances=False, return_indices=True)
    fg, bg = a[idx_f[0], idx_f[1]], a[idx_b[0], idx_b[1]]

    d = fg - bg
    den = (d * d).sum(axis=2)
    num = ((a - bg) * d).sum(axis=2)
    with np.errstate(divide='ignore', invalid='ignore'):
        t = np.where(den > 1e-6, num / den, 0.0)
    resid = np.linalg.norm((a - bg) - t[..., None] * d, axis=2)
    t = np.clip(t, 0.0, 1.0)
    t[resid > 40] = 1.0
    alpha[rim] = t[rim]
    with np.errstate(divide='ignore', invalid='ignore'):
        un = bg + (a - bg) / np.clip(alpha, 1e-3, 1)[..., None]
    rgb[rim] = np.clip(un[rim], 0, 255)

    solid = alpha > 0.01
    idx2 = ndimage.distance_transform_edt(~solid, return_distances=False, return_indices=True)
    rgb[~solid] = rgb[idx2[0], idx2[1]][~solid]

    out = np.dstack([rgb, alpha * 255]).astype(np.uint8)
    ys, xs = np.nonzero(solid)
    crop = out[ys.min():ys.max() + 1, xs.min():xs.max() + 1]
    ch, cw = crop.shape[:2]
    th = round(ch * args.width / cw)
    Image.fromarray(crop).resize((args.width, th), Image.LANCZOS).save(args.out)
    print(f'wrote {args.out}  {args.width}x{th}  (from {cw}x{ch})')

    # The grip gap, measured on the finished sprite. The scene's branch must be
    # at least this thick or sky shows through it -- thicker is fine and reads
    # naturally, since the surplus just shows between his arms.
    al = np.array(Image.open(args.out))[..., 3] > 10
    gap = []
    for x in range(args.width):
        col = np.nonzero(al[:, x])[0]
        if not len(col):
            continue
        brk = np.nonzero(np.diff(col) > 1)[0]
        if len(brk) and col[brk[0]] < th * 0.35 and col[brk[0] + 1] < th * 0.35:
            gap.append((col[brk[0]], col[brk[0] + 1]))
    if not gap:
        print('no grip gap found -- check --band and --branch against the source')
        return
    top, bot = min(g[0] for g in gap), max(g[1] for g in gap)
    print(f'grip gap: rows {top}..{bot} over {len(gap)} columns; '
          f'the scene branch must cover {bot - top}px of this {th}px sprite, '
          f'and he hangs {th - bot}px below it')

    if args.preview:
        pad = 60
        prev = np.zeros((th + pad * 2, args.width + pad * 2, 3), np.uint8)
        prev[:] = (186, 203, 244)
        prev[pad + top - 4:pad + bot + 4] = (207, 140, 94)
        sp = np.array(Image.open(args.out)).astype(float)
        al3 = sp[..., 3:4] / 255
        reg = prev[pad:pad + th, pad:pad + args.width]
        prev[pad:pad + th, pad:pad + args.width] = (sp[..., :3] * al3 + reg * (1 - al3)).astype(np.uint8)
        Image.fromarray(prev).save(args.preview)
        print(f'preview -> {args.preview}')


if __name__ == '__main__':
    main()
