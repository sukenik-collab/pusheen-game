#!/usr/bin/env python3
"""Split one concept-art image into several sprites: the empty/full glasses
pair, the four fridge items. The key and rim un-mixing are cut_tree.py's
(imported, not copied), so its halo fixes apply as-is; the direct (not
border-flooded) magenta key is cut_prop.py's, for the same reason -- nothing
here paints a legitimate colour close enough to magenta to need the flood's
protection, and the pitcher's handle encloses a pocket of background a
border flood would miss.

Items are found as separate connected components (the prompts ask for a wide
magenta gap between them, precisely so this works) and matched to --item
specs by x position, left to right. Each is cropped to its own content, then
sized one of two ways:

- `--item name=WxH:out.png` resizes it straight to WxH, independently of the
  others. For a pair that must match to the pixel (the empty and full glass
  swap in place of each other).
- `--same-scale PX` with `--item name:out.png` gives every item one shared
  scale, the tallest coming out PX tall. Each keeps its own aspect ratio and
  its size relative to the others, as drawn -- for a group shown side by
  side (the fridge items on their shelf), where forcing each into its own box
  stretches some and makes the row's sizes arbitrary.

Usage:
    python3 tools/cut_items.py --src IN.jpg \
        --item name1=W1xH1:out1.png --item name2=W2xH2:out2.png ...
        [--preview P.png]
    python3 tools/cut_items.py --src IN.jpg --same-scale PX \
        --item name1:out1.png --item name2:out2.png ... [--preview P.png]

Needs: pillow, scipy  (pip install pillow scipy)
"""
import argparse

import numpy as np
from PIL import Image
from scipy import ndimage

from cut_tree import despeckle, resize_rgba, unmix_rim

BG_SCORE = 15
PAD = 2
MIN_ITEM = 0.0005   # fraction of image area below which a component is a speck


def main():
    ap = argparse.ArgumentParser(description=__doc__,
                                 formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument('--src', required=True)
    ap.add_argument('--item', action='append', required=True, dest='items',
                    metavar='name=WxH:out.png | name:out.png',
                    help='one per item, left to right in the source; repeatable')
    ap.add_argument('--same-scale', type=int, metavar='PX',
                    help='one scale for all items, the tallest coming out PX tall')
    ap.add_argument('--preview', help='also write each cut item at 3x on a mid-grey')
    args = ap.parse_args()

    specs = []
    for item in args.items:
        head, out = item.split(':', 1)
        spec = {'out': out}
        if '=' in head:
            spec['name'], size = head.split('=', 1)
            spec['w'], spec['h'] = (int(v) for v in size.split('x'))
        else:
            spec['name'] = head
        if args.same_scale is None and 'w' not in spec:
            raise SystemExit(f"--item {item}: give it a size (name=WxH:out.png) or pass --same-scale")
        specs.append(spec)

    a = np.array(Image.open(args.src).convert('RGB')).astype(float)
    h, w, _ = a.shape

    # Direct key, not border-flooded -- see the module docstring.
    score = np.minimum(a[..., 0], a[..., 2]) - a[..., 1]
    bg_like = score > BG_SCORE
    fg = ~bg_like

    lab, n = ndimage.label(fg, structure=np.ones((3, 3)))
    sizes = ndimage.sum(fg, lab, index=np.arange(1, n + 1))
    min_size = MIN_ITEM * h * w
    keep_ids = [i + 1 for i, s in enumerate(sizes) if s > min_size]
    if len(keep_ids) != len(specs):
        raise SystemExit(f'found {len(keep_ids)} items > {min_size:.0f}px but got '
                          f'{len(specs)} --item specs -- check the source or the specs')

    # Left to right by each component's own centre column, matching --item order.
    centres = [(cid, np.nonzero(lab == cid)[1].mean()) for cid in keep_ids]
    centres.sort(key=lambda t: t[1])

    bg_ref = np.broadcast_to(np.median(a[bg_like], axis=0), a.shape)

    crops = []
    for (cid, _), spec in zip(centres, specs):
        comp = lab == cid
        rgb, alpha, solid = unmix_rim(a, comp, bg_ref, rim=10, core_erode=6, bg_like=bg_like)

        ys, xs = np.nonzero(solid)
        y0, y1 = max(0, ys.min() - PAD), min(h, ys.max() + 1 + PAD)
        x0, x1 = max(0, xs.min() - PAD), min(w, xs.max() + 1 + PAD)
        crops.append((np.dstack([rgb, alpha * 255])[y0:y1, x0:x1].astype(np.uint8), (x0, x1, y0, y1)))

    if args.same_scale is not None:
        s = args.same_scale / max(crop.shape[0] for crop, _ in crops)
        for (crop, _), spec in zip(crops, specs):
            spec['w'], spec['h'] = round(crop.shape[1] * s), round(crop.shape[0] * s)
        print(f'shared scale {s:.4f}: tallest item {args.same_scale}px')

    for (crop, (x0, x1, y0, y1)), spec in zip(crops, specs):
        sprite = resize_rgba(crop, (spec['w'], spec['h']))
        Image.fromarray(sprite).save(spec['out'])
        print(f"{spec['name']}: wrote {spec['out']}  {spec['w']}x{spec['h']}  "
              f"(from {x1 - x0}x{y1 - y0}, source bbox x {x0}..{x1} y {y0}..{y1})")

        if args.preview:
            prev = np.full((spec['h'], spec['w'], 3), 170, np.uint8)
            al = sprite[..., 3:4].astype(float) / 255
            prev = (sprite[..., :3] * al + prev * (1 - al)).astype(np.uint8)
            big = Image.fromarray(prev).resize((spec['w'] * 3, spec['h'] * 3), Image.NEAREST)
            out_prev = f"{args.preview.rsplit('.', 1)[0]}-{spec['name']}.png"
            big.save(out_prev)
            print(f'  preview -> {out_prev}')


if __name__ == '__main__':
    main()
