#!/usr/bin/env python3
"""Cut the butterfly concept art into a five-piece rig: a body+antennae
sprite and four wing quadrants, so the game can flap each wing (scaleX)
independently instead of animating one flat sprite. The key, rim un-mixing
and resize are cut_tree.py's (imported, not copied); the direct (not
border-flooded) magenta key is cut_prop.py's, for the same reason -- see
tools/README.md.

The four wings are rectangular quadrants of the full cutout, split at one
centre point: the body blob's own centre, which is also where the wings
visually attach. Each wing's Phaser origin is set to wherever that centre
point lands in its own crop -- always near one corner, not exactly on it
(see --wing-overlap) -- so all five pieces are added to their Container at
local (0,0) and a wing's scaleX (the flap) pivots where it joins the body --
no per-piece offset math in Butterfly.js.

Each wing's crop reaches a few px past the split lines into its two
neighbours' quadrants (--wing-overlap, in FINAL sprite px), rather than
stopping exactly on them: cut edge-to-edge, independent rounding when each
piece is resized to its own target size leaves a 1-2px gap at some flap
angles, thin enough to slip past the eye in a still image but not once the
wing is actually scaling -- background shows through the seam. The overlap
is pure redundancy (both pieces sample the same source pixels there), so
which one draws on top there doesn't matter.

The body piece is its own mask, not a rectangular crop: the thorax (found by
its fill colour) unioned with the antennae (found as the only non-background
content in a box above the thorax -- the wings don't reach that high, see
--antenna-box). A plain rectangular crop would duplicate a strip of real
wing pixels next to the antennae; that strip would then sit static on top of
the wing piece that's supposed to flap under it, freezing part of the flap.

Usage:
    python3 tools/cut_butterfly.py [--src IN.jpg] [--out-dir DIR]
        [--width 53] [--body-color R,G,B] [--body-tol 20]
        [--antenna-box L,T,R,B] [--preview P.png]

Needs: pillow, scipy  (pip install pillow scipy)
"""
import argparse

import numpy as np
from PIL import Image
from scipy import ndimage

from cut_tree import despeckle, resize_rgba, unmix_rim

BG_SCORE = 15
PAD = 3


def main():
    ap = argparse.ArgumentParser(description=__doc__,
                                 formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument('--src', default='docs/concept-art/butterfly.jpg')
    ap.add_argument('--out-dir', default='public/assets/sprites')
    ap.add_argument('--width', type=int, default=53, help='the whole butterfly\'s wingspan')
    ap.add_argument('--body-color', default='108,62,39', help='the thorax fill colour')
    ap.add_argument('--body-tol', type=int, default=20)
    ap.add_argument('--antenna-box', default='430,0,600,355',
                    help='L,T,R,B (source px) bounding the antennae, clear of the wings -- '
                         'see the module docstring; print with --preview to check it')
    ap.add_argument('--wing-overlap', type=float, default=2.0,
                    help='how far each wing crop reaches into its neighbours, in FINAL sprite px')
    ap.add_argument('--preview', help='also write a 3x composite on a mid-grey, with the split lines')
    args = ap.parse_args()

    a = np.array(Image.open(args.src).convert('RGB')).astype(float)
    h, w, _ = a.shape

    bg_like = np.minimum(a[..., 0], a[..., 2]) - a[..., 1] > BG_SCORE
    silhouette = despeckle(~bg_like)
    if silhouette.sum() < 500:
        raise SystemExit(f'kept component is only {int(silhouette.sum())}px -- check {args.src}')

    rgb, alpha, solid = unmix_rim(a, silhouette, np.broadcast_to(np.median(a[bg_like], axis=0), a.shape),
                                  rim=10, core_erode=6, bg_like=bg_like)

    # The thorax: the body colour's biggest blob. Its centre is where all
    # four wings meet -- also the split point between them.
    body_color = np.array([float(v) for v in args.body_color.split(',')])
    thorax = despeckle(solid & (np.abs(a - body_color).max(axis=2) <= args.body_tol))
    tys, txs = np.nonzero(thorax)
    if not len(txs):
        raise SystemExit(f'no thorax-coloured blob found -- check --body-color against {args.src}')
    bx0, by0, bx1, by1 = txs.min(), tys.min(), txs.max(), tys.max()
    cx, cy = round((bx0 + bx1) / 2), round((by0 + by1) / 2)
    print(f'thorax bbox x {bx0}..{bx1} y {by0}..{by1}; split point ({cx}, {cy})')

    # The antennae: everything solid in a box above the thorax. Nothing of
    # the wings reaches that high in the shipped source (see the docstring);
    # --preview marks the box in red so a different source can be checked
    # before trusting this.
    al, at, ar, ab = (int(v) for v in args.antenna_box.split(','))
    antenna_box = np.zeros((h, w), bool)
    antenna_box[at:ab, al:ar] = True
    antennae = solid & antenna_box
    body_mask = thorax | antennae

    # Overall scale: the butterfly's full wingspan (silhouette bbox) to
    # --width. All five pieces share it, so they stay in proportion.
    sil_ys, sil_xs = np.nonzero(solid)
    sx0, sx1 = sil_xs.min(), sil_xs.max()
    scale = args.width / (sx1 - sx0)

    def cut(mask, y0, y1, x0, x1, name):
        sub_alpha = (alpha * mask)[y0:y1, x0:x1]      # still 0..1 here
        sub_rgb = rgb[y0:y1, x0:x1]
        ys, xs = np.nonzero(sub_alpha > 0.01)
        if not len(xs):
            raise SystemExit(f'{name}: empty piece -- check the split point and antenna box')
        py0, py1 = max(0, ys.min() - PAD), min(sub_alpha.shape[0], ys.max() + 1 + PAD)
        px0, px1 = max(0, xs.min() - PAD), min(sub_alpha.shape[1], xs.max() + 1 + PAD)
        crop = np.dstack([sub_rgb, sub_alpha * 255])[py0:py1, px0:px1].astype(np.uint8)
        cw, ch = px1 - px0, py1 - py0
        tw, th = max(1, round(cw * scale)), max(1, round(ch * scale))
        sprite = resize_rgba(crop, (tw, th))
        out = f'{args.out_dir}/butterfly-{name}.png'
        Image.fromarray(sprite).save(out)
        # Where the split point (cx, cy) landed inside this crop, as an
        # origin fraction -- always close to one corner for a wing, by
        # construction of the quadrant split, but not exactly on it once
        # --wing-overlap pushes that corner's edge past the split line.
        # Butterfly.js takes these printed values directly.
        ofx = (cx - (x0 + px0)) / cw
        ofy = (cy - (y0 + py0)) / ch
        print(f'{name}: wrote {out}  {tw}x{th}  (from {cw}x{ch}); '
              f'origin ({ofx:.4f}, {ofy:.4f})')
        return sprite, (tw, th), (ofx, ofy)

    all_true = np.ones((h, w), bool)
    cut(body_mask, 0, h, 0, w, 'body')

    # Wings: quadrants of the whole silhouette split at (cx, cy), each
    # reaching --wing-overlap final px past the split into its two neighbours
    # (see the module docstring). ov is that margin converted to source px.
    ov = round(args.wing_overlap / scale)
    cut(all_true, 0, min(h, cy + ov), 0, min(w, cx + ov), 'wing-ul')
    cut(all_true, 0, min(h, cy + ov), max(0, cx - ov), w, 'wing-ur')
    cut(all_true, max(0, cy - ov), h, 0, min(w, cx + ov), 'wing-ll')
    cut(all_true, max(0, cy - ov), h, max(0, cx - ov), w, 'wing-lr')

    if args.preview:
        canvas = np.dstack([rgb, alpha * 255]).astype(np.uint8)
        prev = np.full((h, w, 3), 170, np.uint8)
        al_f = canvas[..., 3:4].astype(float) / 255
        prev = (canvas[..., :3] * al_f + prev * (1 - al_f)).astype(np.uint8)
        prev[cy, :] = (255, 0, 0)
        prev[:, cx] = (255, 0, 0)
        at_, ab_, al_, ar_ = at, ab, al, ar
        prev[at_, al_:ar_] = prev[ab_ - 1, al_:ar_] = (0, 120, 255)
        prev[at_:ab_, al_] = prev[at_:ab_, ar_ - 1] = (0, 120, 255)
        Image.fromarray(prev).resize((w // 2, h // 2)).save(args.preview)
        print(f'preview -> {args.preview}')


if __name__ == '__main__':
    main()
