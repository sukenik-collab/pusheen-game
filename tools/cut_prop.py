#!/usr/bin/env python3
"""Cut a prop drawn alone on flat magenta into a game-sized sprite.

The kitchen's two climbing steps -- the step stool and the rolling cart --
are each drawn alone on flat magenta, the same kind of source as the tree, so
the key and the rim un-mixing are cut_tree.py's (imported, not copied). Three
things differ:

1. The key is global, not a flood in from the border. The cart shows
   background through gaps it fully encloses -- between its tiers, inside
   the wheel frame, the slit between its twin front poles -- that a border
   flood never reaches, so they'd stay magenta.
2. Size comes from gameplay, not a pixel count. Both props are drawn in 3/4
   view, so the top edge of the sprite is the far rim of the top face, and
   standing there reads as hovering. She stands halfway back across the top
   face instead. `stand` is how high that is above the floor -- the step's
   height in Kitchen.js -- and the prop is scaled so the middle of its top
   face lands exactly there above its feet. Kitchen.js places each ledge
   from what this prints.
3. Per-prop fixes, both for the cart. `ink` thickens outlines drawn far
   finer than the rest of the game's art: the cart's are ~4px in the source
   against the stool's ~10, which lands at 0.7px in game beside everyone
   else's 2. `tint` recolours its fills from a pinkish cream that vanished
   against the cream cabinets to the fridge's mint family.

Usage:
    python3 tools/cut_prop.py [stool] [cart] [--preview DIR]

With no names it cuts both. Needs: pillow, scipy  (pip install pillow scipy)
"""
import argparse
import os

import numpy as np
from PIL import Image
from scipy import ndimage

from cut_tree import despeckle, resize_rgba, unmix_rim

# Background test, as cut_tree.py's: a magenta blend at any strength has green
# suppressed below red and blue; no colour in these props does.
BG_SCORE = 15
FACE_TOL = 16    # max per-channel distance from the seed's colour, top face flood
INK_LUM = 100    # below this luminance a solid pixel is outline
FILL_LUM = 160   # above it, all fill -- the outline's anti-aliasing lies between

PRESETS = {
    'stool': {
        'src': 'docs/concept-art/stool1.jpg',
        'out': 'public/assets/sprites/step-stool.png',
        'stand': 80,
        'face': (210, 673),      # (y, x) inside the seat's top face
    },
    'cart': {
        'src': 'docs/concept-art/kitchen_drawers2.jpg',
        'out': 'public/assets/sprites/step-cart.png',
        'stand': 160,
        'face': (130, 500),      # inside the top basket
        'ink': 4,                # px of source to grow each outline by
        # Source fill -> game fill, matched by luminance: its shade, body and
        # highlight onto a mint a step deeper than the fridge's (211,233,212),
        # so it reads as the fridge's family but still stands off the cream
        # cabinets behind it. The outline itself is left alone.
        'tint': [((222, 206, 199), (168, 204, 180)),
                 ((246, 234, 234), (200, 229, 206)),
                 ((255, 250, 244), (226, 243, 229))],
    },
}

# The cabinet front the steps stand against, for --preview.
CABINET = np.array([244, 222, 185], float)


def luminance(rgb):
    return rgb @ np.array([0.299, 0.587, 0.114])


def key(a):
    """The prop's mask: everything that isn't a magenta blend, anywhere."""
    bg_like = np.minimum(a[..., 0], a[..., 2]) - a[..., 1] > BG_SCORE
    return despeckle(~bg_like), bg_like


def top_face(a, seed):
    """The top face's rows and columns, flooded from a pixel inside it."""
    y, x = seed
    ref = np.median(a[y - 2:y + 3, x - 2:x + 3].reshape(-1, 3), axis=0)
    near = np.abs(a - ref).max(axis=2) <= FACE_TOL
    lab, _ = ndimage.label(near)
    face = lab == lab[y, x]
    ys, xs = np.nonzero(face)
    return (ys.min(), ys.max() + 1), (xs.min(), xs.max() + 1)


def tint(rgb, solid, anchors):
    """Map each non-outline pixel's luminance onto the anchors' target ramp.

    Between the outline and the first anchor the ramp starts from the outline
    colour, so the anti-aliasing between outline and fill stays a clean
    blend; anything as dark as the outline keeps its own colour.
    """
    lum = luminance(rgb)
    ink = np.median(rgb[solid & (lum < INK_LUM)], axis=0)
    src = [luminance(np.array(ink))] + [luminance(np.array(s, float)) for s, _ in anchors]
    dst = [ink] + [np.array(d, float) for _, d in anchors]
    out = np.stack([np.interp(lum, src, [d[c] for d in dst]) for c in range(3)], axis=-1)
    keep = lum < src[0]
    out[keep] = rgb[keep]
    return out


def thicken_ink(rgb, alpha, radius):
    """Grow the outlines by `radius` px each way, on the full-size source.

    Coverage is how far a pixel is from fill toward outline; dilating that
    coverage and compositing the outline colour back over at it widens every
    stroke, the silhouette's included, without disturbing the fills between.
    """
    lum = luminance(rgb)
    ink = np.median(rgb[(alpha > 0.5) & (lum < INK_LUM)], axis=0)
    cov = np.clip((FILL_LUM - lum) / (FILL_LUM - luminance(ink)), 0, 1) * alpha
    yy, xx = np.ogrid[-radius:radius + 1, -radius:radius + 1]
    cov = ndimage.grey_dilation(cov, footprint=xx * xx + yy * yy <= radius * radius)
    rgb = rgb * (1 - cov[..., None]) + ink * cov[..., None]
    return rgb, np.maximum(alpha, cov)


def bleed(rgb, solid):
    """Bleed colour outward so filtering never samples raw transparent pixels."""
    idx = ndimage.distance_transform_edt(~solid, return_distances=False, return_indices=True)
    out = rgb.copy()
    out[~solid] = rgb[idx[0], idx[1]][~solid]
    return out


def cut(name, p, preview_dir):
    a = np.array(Image.open(p['src']).convert('RGB')).astype(float)
    prop, bg_like = key(a)
    rgb, alpha, _ = unmix_rim(a, prop, np.broadcast_to(np.median(a[bg_like], axis=0), a.shape),
                              rim=10, core_erode=6, bg_like=bg_like)
    (f0, f1), (fx0, fx1) = top_face(a, p['face'])

    if 'tint' in p:
        rgb = tint(rgb, alpha > 0.5, p['tint'])
    if 'ink' in p:
        rgb, alpha = thicken_ink(rgb, alpha, p['ink'])
    solid = alpha > 0.01
    rgb = bleed(rgb, solid)

    # Crop tight. The sprite's bottom edge is where its feet meet the floor,
    # so that's the feet's solid edge -- not the faint rim below it, which
    # would stand the prop a pixel above the floor.
    ys, xs = np.nonzero(solid)
    y0, x0, x1 = ys.min(), xs.min(), xs.max() + 1
    y1 = np.nonzero((alpha > 0.5).any(axis=1))[0].max() + 1
    stand_src = y1 - (f0 + f1) / 2
    s = p['stand'] / stand_src
    w, h = round((x1 - x0) * s), round((y1 - y0) * s)
    crop = np.dstack([rgb, alpha * 255])[y0:y1, x0:x1].astype(np.uint8)
    sprite = resize_rgba(crop, (w, h))
    sprite[..., :3] = bleed(sprite[..., :3], sprite[..., 3] > 0)
    Image.fromarray(sprite).save(p['out'])

    sx = w / (x1 - x0)
    row = ((f0 + f1) / 2 - y0) * h / (y1 - y0)
    left, right = (fx0 - x0) * sx, (fx1 - x0) * sx
    print(f"{name}: wrote {p['out']}  {w}x{h}  (scale {s:.3f} from {x1 - x0}x{y1 - y0})")
    print(f'  top face middle at row {row:.1f}: {h - row:.1f}px above its feet (stand: {p["stand"]})')
    print(f'  top face spans x {left:.0f}..{right:.0f}: {right - left:.0f}px wide, '
          f'centre {(left + right) / 2 - w / 2:+.1f}px from the sprite\'s')

    if preview_dir:
        al = sprite[..., 3:4].astype(float) / 255
        prev = sprite[..., :3] * al + CABINET * (1 - al)
        prev[round(row)] = (255, 0, 0)       # where she stands
        big = Image.fromarray(prev.astype(np.uint8)).resize((w * 4, h * 4), Image.NEAREST)
        path = os.path.join(preview_dir, f'{name}-preview.png')
        big.save(path)
        print(f'  preview -> {path}')


def main():
    ap = argparse.ArgumentParser(description=__doc__,
                                 formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument('names', nargs='*', metavar='NAME',
                    help=f'which props to cut ({", ".join(PRESETS)}); default all')
    ap.add_argument('--preview', metavar='DIR',
                    help='also write each at 4x on the cabinet colour, stand line in red')
    args = ap.parse_args()
    unknown = set(args.names) - set(PRESETS)
    if unknown:
        ap.error(f'unknown prop(s): {", ".join(sorted(unknown))}')
    for name in args.names or PRESETS:
        cut(name, PRESETS[name], args.preview)


if __name__ == '__main__':
    main()
