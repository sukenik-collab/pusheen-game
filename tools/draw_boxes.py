#!/usr/bin/env python3
"""Draw the kitchen's two climbing boxes -- one sprite, both boxes.

Floor -> short box -> tall box -> counter top. They're drawn, not cut from
generated art: boxes are plain geometry, and drawing them puts each top face
exactly where the climb needs it. She stands halfway back across a box's
top face, and that line is 80px above the floor on the short box and 160 on
the tall one (Kitchen.js's LOW_BOX_TOP / TALL_BOX_TOP), so every rise up to
the counter's 240 is just inside a normal hop.

Square-on and seen a little from above, like the counter in the kitchen
backdrop, in the backdrop's outline colour and weight. The tall box stands a
few px further back, so its base sits higher. Both are taped shut with
shipping labels: a delivery, not the Bedroom's open costume box.

Drawn at 4x and box-filtered down, premultiplied (cut_tree.py's resize_rgba),
for clean anti-aliased edges. Prints the numbers Kitchen.js places the sprite
and its two ledges from.

Usage:
    python3 tools/draw_boxes.py [--out PATH] [--preview P.png]

Needs: pillow, scipy  (pip install pillow scipy)
"""
import argparse

import numpy as np
from PIL import Image, ImageDraw

from cut_tree import resize_rgba

SS = 4           # supersampling factor
LINE = 3         # outline weight, game px -- the backdrop's is ~3.7
PAD = 2          # transparent margin on the sides and top

# The kitchen backdrop's outline colour, and cardboard sampled from the
# mock-up these were designed from. The tall box is a shade darker: it
# stands behind, and it keeps the two apart where they overlap.
INK = (100, 55, 22)
TAPE = (249, 229, 194)
LABEL = (250, 246, 238)
LABEL_TEXT = (150, 128, 108)
NOTE = (178, 212, 132)

# Each box in game px: x across the sprite from its left edge, heights up
# from the floor. `stand` is the middle of the top face, where she stands;
# `depth` is how deep that face shows. The short box's top is further below
# eye level than the tall one's, so it shows deeper.
SHORT = {'x0': 0, 'x1': 164, 'base': 0, 'stand': 80, 'depth': 28, 'inset': 7,
         'front': (236, 179, 112), 'top': (245, 200, 142)}
TALL = {'x0': 126, 'x1': 294, 'base': 7, 'stand': 160, 'depth': 24, 'inset': 8,
        'front': (224, 165, 101), 'top': (238, 189, 130)}

WIDTH = TALL['x1'] + 2 * PAD
HEIGHT = TALL['stand'] + TALL['depth'] // 2 + PAD


class Canvas:
    """Game-px drawing calls onto the supersampled image, y up from the floor."""

    def __init__(self):
        self.img = Image.new('RGBA', (WIDTH * SS, HEIGHT * SS), (0, 0, 0, 0))
        self.draw = ImageDraw.Draw(self.img)

    def pt(self, x, y):
        return ((x + PAD) * SS, (HEIGHT - y) * SS)

    def poly(self, pts, fill, width=LINE):
        self.draw.polygon([self.pt(x, y) for x, y in pts], fill=fill + (255,),
                          outline=INK + (255,), width=width * SS)

    def rect(self, x0, y0, x1, y1, fill, radius=3, width=LINE):
        (a, b), (c, d) = self.pt(x0, y1), self.pt(x1, y0)
        # PIL's bounds are inclusive: the far edges are the last pixel inside.
        self.draw.rounded_rectangle([a, b, c - 1, d - 1], radius=radius * SS, fill=fill + (255,),
                                    outline=INK + (255,), width=width * SS)

    def line(self, x0, y0, x1, y1, fill, width):
        self.draw.line([self.pt(x0, y0), self.pt(x1, y1)], fill=fill + (255,), width=width * SS)


def faces(b):
    """The top face's front and back edges' heights."""
    return b['stand'] - b['depth'] / 2, b['stand'] + b['depth'] / 2


def draw_box(c, b):
    front, back = faces(b)
    x0, x1, i = b['x0'], b['x1'], b['inset']
    # A polygon's outline is centred on its edges, a rectangle's drawn inside
    # its bounds: pull the top face's front corners in by half a line so the
    # two strokes coincide instead of doubling up along the front edge.
    h = LINE / 2
    c.poly([(x0 + h, front - h), (x1 - h, front - h), (x1 - i, back), (x0 + i, back)], b['top'])
    c.rect(x0, b['base'], x1, front, b['front'])


def label(c, x, y):
    """A shipping label, its top-left corner at (x, y)."""
    c.rect(x, y - 21, x + 33, y, LABEL, radius=2, width=2)
    for k, w in enumerate((21, 17, 10)):
        c.line(x + 6, y - 6 - 5 * k, x + 6 + w, y - 6 - 5 * k, LABEL_TEXT, 2)


def draw(c):
    # The tall box first: the short one stands in front of it.
    draw_box(c, TALL)
    front, back = faces(TALL)
    mid = (TALL['x0'] + TALL['x1']) / 2
    # Tape along the seam, front to back, folding down the front with a torn end.
    c.poly([(mid - 10, back - 1), (mid + 10, back - 1), (mid + 12, front), (mid - 12, front)], TAPE, width=2)
    c.poly([(mid - 12, front), (mid + 12, front), (mid + 12, front - 20), (mid + 5, front - 15),
            (mid - 2, front - 22), (mid - 12, front - 17)], TAPE, width=2)
    label(c, TALL['x0'] + 22, front - 16)
    c.poly([(TALL['x1'] - 52, front - 60), (TALL['x1'] - 34, front - 57),
            (TALL['x1'] - 37, front - 75), (TALL['x1'] - 55, front - 78)], NOTE, width=2)

    draw_box(c, SHORT)
    front, back = faces(SHORT)
    x0, x1, i = SHORT['x0'], SHORT['x1'], SHORT['inset']
    # Tape along the seam, which runs the box's length on this one.
    c.poly([(x0 + i / 2 + 2, SHORT['stand'] - 4), (x1 - i / 2 - 2, SHORT['stand'] - 4),
            (x1 - i / 2 - 3, SHORT['stand'] + 4), (x0 + i / 2 + 3, SHORT['stand'] + 4)], TAPE, width=2)
    label(c, x0 + 14, front - 32)


def report(sprite):
    h, w = sprite.shape[:2]
    bottom = np.nonzero(sprite[..., 3].any(axis=1))[0].max() + 1
    print(f'sprite {w}x{h}, bottom row {bottom} (the floor)')
    for name, b in (('short', SHORT), ('tall', TALL)):
        centre = PAD + (b['x0'] + b['x1']) / 2 - w / 2
        print(f"  {name} box: stands {b['stand']}px above the floor (row {h - b['stand']}), "
              f"top {b['x1'] - b['x0']}px wide, centre {centre:+.1f}px from the sprite's")


def main():
    ap = argparse.ArgumentParser(description=__doc__,
                                 formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument('--out', default='public/assets/sprites/step-boxes.png')
    ap.add_argument('--preview', help='also write it at 3x on the cabinet colour, stand lines in red')
    args = ap.parse_args()

    c = Canvas()
    draw(c)
    sprite = resize_rgba(np.array(c.img), (WIDTH, HEIGHT))
    Image.fromarray(sprite).save(args.out)
    print(f'wrote {args.out}')
    report(sprite)

    if args.preview:
        al = sprite[..., 3:4].astype(float) / 255
        prev = sprite[..., :3] * al + np.array([244, 222, 185]) * (1 - al)
        for b in (SHORT, TALL):
            prev[HEIGHT - b['stand'], PAD + b['x0']:PAD + b['x1']] = (255, 0, 0)
        big = Image.fromarray(prev.astype(np.uint8)).resize((WIDTH * 3, HEIGHT * 3), Image.NEAREST)
        big.save(args.preview)
        print(f'preview -> {args.preview}')


if __name__ == '__main__':
    main()
