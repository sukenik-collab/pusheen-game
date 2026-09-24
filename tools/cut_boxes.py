#!/usr/bin/env python3
"""Cut the kitchen's two climbing boxes out of their concept art: one sprite.

Floor -> short box -> tall box -> counter top. The source draws both boxes
together on flat magenta, the short one standing in front of the tall one's
lower-left corner, so they're cut as one sprite and Kitchen.js gives each box
its own invisible ledge. The key and the rim un-mixing are cut_tree.py's
(imported, not copied), so its halo fixes apply as-is.

Sized by gameplay, not to a pixel size. Both boxes show their tops a little
from above, so she stands halfway back across a top face, not on the
sprite's top edge (that face's far rim). Each face is measured in the source
between the outlines along its back and front edges, down a column clear of
tape and labels, and one scale is fit to put both middles at their step
heights: 80 and 160px above the floor (Kitchen.js's LOW_BOX_TOP /
TALL_BOX_TOP). Every rise to the counter's 240 is just inside a hop, so it
refuses a source whose two faces aren't close enough to 1:2 to land both.

Usage:
    python3 tools/cut_boxes.py [--src IN] [--out OUT] [--preview P.png]

Needs: pillow, scipy  (pip install pillow scipy)
"""
import argparse

import numpy as np
from PIL import Image

from cut_tree import despeckle, resize_rgba, unmix_rim

BG_SCORE = 15    # magenta blend test, as cut_tree.py's: green suppressed below red and blue
INK_LUM = 100    # below this luminance a pixel is outline
MAX_MISS = 1.5   # px a box's standing line may land from its step height

# Each box: its step height, and a (row, column) probe inside its front face
# in the source. The row must cross only this box (it measures the box's
# width); the column must run clear of tape and labels up through its top face.
BOXES = [
    {'name': 'short', 'stand': 80, 'probe': (745, 300)},
    {'name': 'tall', 'stand': 160, 'probe': (300, 1100)},
]

# The cabinet front the boxes stand against, for --preview.
CABINET = np.array([244, 222, 185], float)


def runs(mask):
    """(first, last) index of each run of True in a 1-D mask."""
    idx = np.nonzero(mask)[0]
    return [(r[0], r[-1]) for r in np.split(idx, np.nonzero(np.diff(idx) > 1)[0] + 1)] if len(idx) else []


def measure(ink, solid, probe):
    """A box's top face (rows of its back and front edge lines) and its columns."""
    row, col = probe
    above = runs(ink[:row, col])
    back, front = np.mean(above[0]), np.mean(above[-1])   # its top outline; the line just above the front face
    left, right = next((a, b) for a, b in runs(solid[row]) if a <= col <= b)
    return back, front, left, right + 1


def main():
    ap = argparse.ArgumentParser(description=__doc__,
                                 formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument('--src', default='docs/concept-art/kitchen_boxes.jpg')
    ap.add_argument('--out', default='public/assets/sprites/step-boxes.png')
    ap.add_argument('--preview', help='also write it at 3x on the cabinet colour, stand lines in red')
    args = ap.parse_args()

    a = np.array(Image.open(args.src).convert('RGB')).astype(float)
    bg_like = np.minimum(a[..., 0], a[..., 2]) - a[..., 1] > BG_SCORE
    prop = despeckle(~bg_like)
    rgb, alpha, solid = unmix_rim(a, prop, np.broadcast_to(np.median(a[bg_like], axis=0), a.shape),
                                  rim=10, core_erode=6, bg_like=bg_like)
    ink = prop & (a @ np.array([0.299, 0.587, 0.114]) < INK_LUM)

    # Crop tight. The bottom edge is where the front box meets the floor, so
    # it's that box's solid edge -- not the faint rim below, which would stand
    # the boxes a pixel above the floor.
    ys, xs = np.nonzero(solid)
    y0, x0, x1 = ys.min(), xs.min(), xs.max() + 1
    y1 = np.nonzero((alpha > 0.5).any(axis=1))[0].max() + 1

    faces = [measure(ink, alpha > 0.5, b['probe']) for b in BOXES]
    heights = np.array([y1 - (back + front) / 2 for back, front, _, _ in faces])
    stands = np.array([b['stand'] for b in BOXES], float)
    s = (heights @ stands) / (heights @ heights)          # least-squares fit of one scale
    w, h = round((x1 - x0) * s), round((y1 - y0) * s)

    crop = np.dstack([rgb, alpha * 255])[y0:y1, x0:x1].astype(np.uint8)
    sprite = resize_rgba(crop, (w, h))
    Image.fromarray(sprite).save(args.out)
    print(f'wrote {args.out}  {w}x{h}  (scale {s:.4f} from {x1 - x0}x{y1 - y0})')

    sy, sx = h / (y1 - y0), w / (x1 - x0)
    for b, (back, front, left, right), hgt in zip(BOXES, faces, heights):
        got = hgt * sy
        centre = ((left + right) / 2 - x0) * sx - w / 2
        print(f"  {b['name']} box: stands {got:.1f}px above the floor (wants {b['stand']}), "
              f"its top face runs {(y1 - front) * sy:.0f}..{(y1 - back) * sy:.0f}; "
              f"{(right - left) * sx:.0f}px wide, centre {centre:+.1f}px from the sprite's")
        if abs(got - b['stand']) > MAX_MISS:
            raise SystemExit(f"{b['name']} box lands {got - b['stand']:+.1f}px off its step: the "
                             'source\'s two top faces aren\'t close enough to 1:2 -- regenerate it')

    if args.preview:
        al = sprite[..., 3:4].astype(float) / 255
        prev = sprite[..., :3] * al + CABINET * (1 - al)
        for b in BOXES:
            prev[h - b['stand']] = (255, 0, 0)
        big = Image.fromarray(prev.astype(np.uint8)).resize((w * 3, h * 3), Image.NEAREST)
        big.save(args.preview)
        print(f'preview -> {args.preview}')


if __name__ == '__main__':
    main()
