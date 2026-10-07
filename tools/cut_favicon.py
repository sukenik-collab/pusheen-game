#!/usr/bin/env python3
"""Cut the browser-tab icons from Pusheen's own concept art.

Two cuts of the same cutout:
- the tab favicon (32px, plus a 16px one for non-retina screens): just her
  head -- ears, eyes, whiskers -- cropped square. Her whole body is too wide
  to read at 16-32px; her head is unmistakably her.
- the home-screen icon (180px, `apple-touch-icon.png`): all of her, centred
  on the backyard's sky colour. Opaque on purpose: iOS fills a transparent
  touch icon's background with black, then rounds the corners itself, so
  the margin keeps her clear of that rounding.

Cut from `docs/concept-art/cat.png`, the same source `pusheen.png` came from:
flat vector art on plain white, at 400px -- the 110px game sprite is too
small to source a 180px icon from. White is keyed by a flood from the border
(nothing inside her is white), and the anti-aliased rim is un-mixed against
it with cut_tree.py's `unmix_rim`, then resized premultiplied with its
`resize_rgba` -- the same halo fixes every other cut here relies on.

Usage:
    python3 tools/cut_favicon.py [--src IN.png] [--out-dir public]
                                 [--head-box L,T,R,B] [--preview P.png]

Needs: pillow, scipy  (pip install pillow scipy)
"""
import argparse
import os

import numpy as np
from PIL import Image
from scipy import ndimage

from cut_tree import SKY, resize_rgba, unmix_rim

WHITE = np.array([255., 255., 255.])
BG_DIST = 24          # within this of pure white (RGB distance) counts as background
TOUCH_SIZE = 180
TOUCH_MARGIN = 0.14   # of the icon's width, each side -- clear of iOS's corner rounding


def cutout(a):
    """RGBA of the whole cat: background = the white connected to the border."""
    near_white = np.linalg.norm(a - WHITE, axis=2) < BG_DIST
    lab, _ = ndimage.label(near_white)
    border = set(np.unique(np.concatenate([lab[0], lab[-1], lab[:, 0], lab[:, -1]]))) - {0}
    bg = np.isin(lab, list(border))
    rgb, alpha, _ = unmix_rim(a, ~bg, WHITE)
    return np.dstack([rgb, alpha * 255]).astype(np.uint8)


def square_icon(rgba, box, size):
    l, t, r, b = box
    if r - l != b - t:
        raise SystemExit(f'--head-box must be square, got {r - l}x{b - t}')
    return resize_rgba(rgba[t:b, l:r], (size, size))


def touch_icon(rgba):
    """All of her, centred on the sky, inside TOUCH_MARGIN."""
    ys, xs = np.nonzero(rgba[..., 3] > 0)
    cat = rgba[ys.min():ys.max() + 1, xs.min():xs.max() + 1]
    inner = round(TOUCH_SIZE * (1 - 2 * TOUCH_MARGIN))
    k = inner / max(cat.shape[:2])
    w, h = round(cat.shape[1] * k), round(cat.shape[0] * k)
    small = resize_rgba(cat, (w, h)).astype(float)
    out = np.empty((TOUCH_SIZE, TOUCH_SIZE, 3))
    out[:] = SKY
    x0, y0 = (TOUCH_SIZE - w) // 2, (TOUCH_SIZE - h) // 2
    a = small[..., 3:] / 255
    out[y0:y0 + h, x0:x0 + w] = small[..., :3] * a + SKY * (1 - a)
    return np.clip(out.round(), 0, 255).astype(np.uint8)


def main():
    ap = argparse.ArgumentParser(description=__doc__.split('\n')[0])
    ap.add_argument('--src', default='docs/concept-art/cat.png')
    ap.add_argument('--out-dir', default='public')
    ap.add_argument('--head-box', default='46,100,222,276',
                    help='square crop of her head in source px: L,T,R,B')
    ap.add_argument('--preview', help='write the three icons side by side, enlarged')
    args = ap.parse_args()

    a = np.asarray(Image.open(args.src).convert('RGB')).astype(float)
    rgba = cutout(a)
    box = tuple(int(v) for v in args.head_box.split(','))

    icons = {
        'favicon.png': square_icon(rgba, box, 32),
        'favicon-16.png': square_icon(rgba, box, 16),
        'apple-touch-icon.png': touch_icon(rgba),
    }
    for name, img in icons.items():
        path = os.path.join(args.out_dir, name)
        Image.fromarray(img).save(path)
        print(f'{path}: {img.shape[1]}x{img.shape[0]}')

    if args.preview:
        sheet = Image.new('RGB', (180 * 3 + 40, 200), (40, 40, 44))
        for i, name in enumerate(icons):
            im = Image.fromarray(icons[name]).convert('RGBA')
            im = im.resize((180, 180), Image.NEAREST)
            bg = Image.new('RGBA', im.size, (255, 255, 255, 255) if i < 2 else (0, 0, 0, 0))
            bg.alpha_composite(im)
            sheet.paste(bg.convert('RGB'), (10 + i * 190, 10))
        sheet.save(args.preview)
        print(f'preview: {args.preview}')


if __name__ == '__main__':
    main()
