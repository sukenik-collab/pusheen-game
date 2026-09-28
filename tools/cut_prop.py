#!/usr/bin/env python3
"""Cut a single free-standing prop out of its concept art: the garden gate,
the screen door, the fridge interior. One flat silhouette on magenta, no
branch or ledge trickery -- the key, rim un-mixing and resize are cut_tree.py's
(imported, not copied), so its halo fixes apply as-is.

Sized by fitting ONE target dimension and letting the other fall out of the
source's own aspect ratio (never force-stretched to a fixed box -- that's
what leaves a squashed or stretched prop). Pass --height for a standing prop
(matches its footprint on the ground, like the doors) or --width for a wide
backdrop-shaped one (the fridge interior).

--posts POST_R,G,B/PANEL_R,G,B optionally splits a prop into two fixed
"posts" flanking a middle panel -- built for the garden gate, whose posts
are a darker wood shade than the picket panel between them. Classified from
a single clean row (--posts-row, a fraction down the crop) rather than each
column's shade over its full height: the panel's own diagonal brace shares
the post's colour and can dominate a picket's height near where it lands,
and the post's ivy overlay eats into the post's own colour the same way --
either fools a whole-height vote. Pick a row that crosses only pickets and
posts, clear of both. Prints the panel's own width so a per-door interaction
zone can be sized to just the part of the gate that actually swings, not the
decorative posts either side.

Usage:
    python3 tools/cut_prop.py --src IN.jpg --out OUT.png (--height H | --width W)
                              [--posts POST_R,G,B/PANEL_R,G,B] [--posts-row 0.2]
                              [--preview P.png]

Needs: pillow, scipy  (pip install pillow scipy)
"""
import argparse

import numpy as np
from PIL import Image

from cut_tree import despeckle, resize_rgba, unmix_rim

BG_SCORE = 15    # magenta blend test, as cut_tree.py's: green suppressed below red and blue
PAD = 2          # transparent margin left on the crop


def post_run_bounds(rgb, solid, row, post, panel):
    """Classify one row's solid pixels as post- or panel-coloured (whichever
    reference they're nearer), then return where the post run touching the
    left edge ends and the one touching the right edge begins -- the panel
    is whatever's between them. Assumes the row only crosses posts and
    panel (pickets), no outline-only gap wide enough to break both runs."""
    line, on = rgb[row], solid[row]
    is_post = on & (np.linalg.norm(line - post, axis=1) < np.linalg.norm(line - panel, axis=1))
    cols = np.nonzero(on)[0]
    if not len(cols):
        return None
    lo, hi = cols.min(), cols.max()
    x = lo
    while x <= hi and is_post[x]:
        x += 1
    left_end = x
    x = hi
    while x >= lo and is_post[x]:
        x -= 1
    right_start = x + 1
    return left_end, right_start


def main():
    ap = argparse.ArgumentParser(description=__doc__,
                                 formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument('--src', required=True)
    ap.add_argument('--out', required=True)
    ap.add_argument('--height', type=int, help='fit to this height, width follows the source aspect')
    ap.add_argument('--width', type=int, help='fit to this width, height follows the source aspect')
    ap.add_argument('--posts', help='POST_R,G,B/PANEL_R,G,B to report the middle panel width')
    ap.add_argument('--posts-row', type=float, default=0.2,
                    help='fraction down the crop to classify -- pick one clear of rails/braces/ivy')
    ap.add_argument('--preview', help='also write it at 3x on a mid-grey, panel bounds marked in red')
    args = ap.parse_args()
    if not args.height and not args.width:
        raise SystemExit('pass --height or --width')

    a = np.array(Image.open(args.src).convert('RGB')).astype(float)
    h, w, _ = a.shape

    # Same JPEG-robust magenta key as cut_tree.py / cut_boxes.py: green
    # suppressed relative to red and blue marks a background blend at any
    # strength, where a soft several-px gradient defeats a plain colour key.
    #
    # Keyed directly, not flood-filled from the border like cut_tree.py's
    # magenta path: a gate's picket gaps are background too, but the pickets'
    # rounded tops touch at their peak and seal each gap off from the border
    # flood, leaving it classified as (magenta-coloured) foreground. Nothing
    # in this pipeline's sources paints a legitimate colour that close to
    # magenta, so every bg-scored pixel can just be background.
    score = np.minimum(a[..., 0], a[..., 2]) - a[..., 1]
    bg_like = score > BG_SCORE
    prop = despeckle(~bg_like)
    if prop.sum() < 500:
        raise SystemExit(f'kept component is only {int(prop.sum())}px -- check {args.src}')

    rgb, alpha, solid = unmix_rim(a, prop, np.broadcast_to(np.median(a[bg_like], axis=0), a.shape),
                                  rim=10, core_erode=6, bg_like=bg_like)

    ys, xs = np.nonzero(solid)
    y0, y1 = max(0, ys.min() - PAD), min(h, ys.max() + 1 + PAD)
    x0, x1 = max(0, xs.min() - PAD), min(w, xs.max() + 1 + PAD)
    cw, ch = x1 - x0, y1 - y0

    if args.height:
        tw, th = round(cw * args.height / ch), args.height
    else:
        tw, th = args.width, round(ch * args.width / cw)

    crop = np.dstack([rgb, alpha * 255])[y0:y1, x0:x1].astype(np.uint8)
    sprite = resize_rgba(crop, (tw, th))
    Image.fromarray(sprite).save(args.out)
    print(f'wrote {args.out}  {tw}x{th}  (from {cw}x{ch}, source bbox x {x0}..{x1} y {y0}..{y1})')

    panel_lo = panel_hi = None
    if args.posts:
        post_s, panel_s = args.posts.split('/')
        post = np.array([float(v) for v in post_s.split(',')])
        panel = np.array([float(v) for v in panel_s.split(',')])
        row = y0 + round((y1 - y0) * args.posts_row)
        bounds = post_run_bounds(rgb, solid, row, post, panel)
        if bounds is None:
            print(f'row {row} has no solid pixels -- check --posts-row against the source')
        else:
            left_post_end, right_post_start = bounds
            sx = tw / cw
            panel_lo = (left_post_end - x0) * sx
            panel_hi = (right_post_start - x0) * sx
            print(f'row {row} ({args.posts_row:.0%} down): posts end at sprite column {panel_lo:.1f} '
                  f'and start again at {panel_hi:.1f} of {tw}; panel (the part that swings) is '
                  f'{panel_hi - panel_lo:.1f}px wide, centred {((panel_lo + panel_hi) / 2 - tw / 2):+.1f}px '
                  f'from the sprite\'s own centre')

    if args.preview:
        prev = np.full((th, tw, 3), 170, np.uint8)
        al = sprite[..., 3:4].astype(float) / 255
        prev = (sprite[..., :3] * al + prev * (1 - al)).astype(np.uint8)
        big = Image.fromarray(prev).resize((tw * 3, th * 3), Image.NEAREST)
        if panel_lo is not None:
            arr = np.array(big)
            arr[:, [round(panel_lo * 3), round(panel_hi * 3) - 1]] = (255, 0, 0)
            big = Image.fromarray(arr)
        big.save(args.preview)
        print(f'preview -> {args.preview}')


if __name__ == '__main__':
    main()
