#!/usr/bin/env python3
"""Key the hanging sloth out of its concept image, branch and all, as two layers.

The art is generated on flat magenta WITH a branch drawn through it. The branch
is there on purpose -- an image generator asked for a grip on nothing draws mush
-- but the scene draws its own branch from the tree art, so this has to take the
generated one back out. Backyard.js then puts the real branch where the
generated one was (SLOTH.restHeight is derived from it).

He wraps that branch, so he can't be one sprite in front of it: his far arms go
behind it and everything else -- head, body, near arms, and all four paws where
they hook over the top -- in front. So the cut writes two same-size sprites, a
back layer holding just the far arms and a front layer holding the rest, which
the scene draws either side of the tree (see Sloth.js). The far arms' tops were
cut flat by the generated branch, so they're extended up through the band it
covered, to tuck behind the scene's branch instead of stopping on its edge.

The shipped source paints that branch a bright green the sloth's own palette
never uses, so a single chromaticity key (colour normalised by brightness, via
--simple) takes its flat fill and its darker outline together in one pass.

The very first source instead painted the branch a *tan* close to the sloth's
own outline colour, which defeated a colour key outright -- no --simple there.
Kept working via two extra passes: walk out from the fill and take the dark run
only where background lies beyond it (at a paw the walk reaches fur or claw
instead, and that outline is his, so it stays), then grow what was found
sideways along its own rows to sweep up the stubs flanking each paw that the
walk had to refuse. A third pass then closes the fill-to-outline anti-aliasing,
which is neither flat enough for the colour key nor dark enough for the outline
test and otherwise survives as a hairline stretched across the grip. That
source and method are kept working (pass --src, --branch, --branch-tol, --band
and drop --simple) in case a future source paints the branch a sloth-adjacent
colour again.

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
INK = 22             # px; reach from a far arm's fill across its outline (~16px thick)
# How far a far arm's cut top is extended up behind the branch: ~8px on the
# sprite. Enough to stay tucked under the branch's lower edge through the
# breathe and yawn, never enough to reach its top edge and peek out between
# the claws -- the generated branch rises in places, so walking all of it can.
EXTEND = 60


def resize_rgba(arr, size):
    """Resize an RGBA array the colour-correct way: premultiplied, so a fully
    transparent neighbour's colour (arbitrary -- ours is background bleed, but
    it doesn't have to be) never leaks into a partly-opaque output pixel.
    PIL's own Image.resize on RGBA resizes colour and alpha independently,
    which is exactly that leak.

    Box, not Lanczos: this is a big downsample (about 7x, source to sprite),
    and Lanczos's negative lobes ring on a sharp edge at that ratio -- even
    premultiplied, un-dividing by a resized alpha that itself rang low
    amplifies the ring into a faint colour fringe along every edge. Box
    averaging has no negative lobes, so nothing to amplify, and it's the
    textbook-correct filter for a downsample this size anyway.
    """
    a = arr[..., 3].astype(np.float32) / 255
    premult = arr[..., :3].astype(np.float32) * a[..., None]
    chans = [np.array(Image.fromarray(premult[..., i], mode='F').resize(size, Image.BOX))
             for i in range(3)]
    a_r = np.clip(np.array(Image.fromarray(a, mode='F').resize(size, Image.BOX)), 0, 1)
    with np.errstate(divide='ignore', invalid='ignore'):
        rgb_r = np.clip(np.stack(chans, axis=-1) / np.clip(a_r[..., None], 1e-6, None), 0, 255)
    return np.dstack([rgb_r, a_r * 255]).astype(np.uint8)


def main():
    ap = argparse.ArgumentParser(description=__doc__,
                                 formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument('--src', default='docs/concept-art/updated_hanging_sloth_manual_edit.png')
    ap.add_argument('--out', default='public/assets/sprites/sloth-hanging-front.png',
                    help='the front layer: everything but the far arms')
    ap.add_argument('--back-out', default='public/assets/sprites/sloth-hanging-back.png',
                    help='the back layer: the far arms, drawn behind the tree')
    ap.add_argument('--width', type=int, default=180,
                    help='display width; the sprite is baked to size and drawn at scale 1')
    ap.add_argument('--far', default='169,122,81',
                    help='the shade his far arms are painted in')
    ap.add_argument('--far-tol', type=int, default=14)
    ap.add_argument('--branch', default='74,250,21',
                    help='the branch colour to key out (fill only, unless --simple)')
    ap.add_argument('--branch-tol', type=int, default=70)
    ap.add_argument('--band', default='10,300',
                    help='rows the branch crosses, as "top,bottom"')
    ap.add_argument('--simple', action=argparse.BooleanOptionalAction, default=True,
                    help='branch is its own colour (fill+outline in one key); '
                         '--no-simple for a source where it is closer to the sloth\'s '
                         'own palette and needs the two outline passes')
    ap.add_argument('--preview', help='also composite the result on a mock branch')
    args = ap.parse_args()

    BRANCH = np.array([float(v) for v in args.branch.split(',')])
    FAR = np.array([float(v) for v in args.far.split(',')])
    BAND = tuple(int(v) for v in args.band.split(','))
    K = 16               # the tan source's branch outline is ~12px thick (--no-simple only)

    a = np.array(Image.open(args.src).convert('RGB')).astype(float)
    h, w, _ = a.shape
    rows = np.arange(h)[:, None]

    # Most of the magenta edge is a crisp ~3px anti-alias, but the manual edit
    # (this source's own retouch of the left rear foot) left at least one spot
    # with a soft, decades-of-px fade toward magenta instead -- a flat R>190/
    # B>190/G<90 box only catches the last few px of that and keeps the rest
    # as fully opaque fur in the wrong colour. What actually marks a magenta
    # blend, at any strength, is green suppressed relative to red and blue --
    # real fur never has that -- so key on that instead.
    magenta = np.minimum(a[..., 0], a[..., 2]) - a[..., 1] > 40
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

    branch = fill | outline
    drop = magenta | branch

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
        branch |= sliver
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

    back, ext = split_far_arms(a, keep, branch, dark, FAR, args.far_tol)
    print(f'far arms: {int(back.sum())}px to the back layer, '
          f'extended {int(ext.sum())}px up behind the branch')

    # Un-mix the rim against whichever background it fades into: magenta on the
    # outside, the branch's own colour inside the grip. The reference colour is
    # sourced a few px inside `keep` rather than right at its boundary, since a
    # boundary pixel can itself still be a half-magenta anti-aliased blend --
    # un-mixing against a contaminated reference just relocates the halo.
    alpha = keep.astype(float)
    rgb = a.copy()
    rim = (ndimage.distance_transform_edt(~keep) <= RIM) & ~keep
    core = ndimage.binary_erosion(keep, iterations=2, border_value=1)
    if not core.any():
        core = keep
    idx_f = ndimage.distance_transform_edt(~core, return_distances=False, return_indices=True)
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
    # At low alpha the un-mix divides by a near-zero fraction, amplifying any
    # noise in the observed pixel into a wrong colour -- a halo of the
    # background tint. Below that the rim is thin enough that the nearest
    # solid colour reads the same and carries none of that noise.
    with np.errstate(divide='ignore', invalid='ignore'):
        un = bg + (a - bg) / np.clip(alpha, 1e-3, 1)[..., None]
    low = alpha < 0.25
    un = np.where(low[..., None], fg, un)
    rgb[rim] = np.clip(un[rim], 0, 255)

    # Every pixel, rim included, goes to whichever layer owns its nearest kept
    # pixel. The extension is back-layer only and gets its own colour, so it
    # can never paint over the front layer's claws in the same columns.
    idx_k = ndimage.distance_transform_edt(~keep, return_distances=False, return_indices=True)
    owned_back = back[idx_k[0], idx_k[1]]
    layers = {}
    for name, own, col in (('front', ~owned_back, rgb), ('back', owned_back, rgb.copy())):
        al = np.where(own, alpha, 0.0)
        if name == 'back':
            al[ext] = 1.0
            col[ext] = extension_colour(a, back, ext)
        layers[name] = (bleed(col, al > 0.01), al)

    solid = (layers['front'][1] > 0.01) | (layers['back'][1] > 0.01)
    ys, xs = np.nonzero(solid)
    y0, y1, x0, x1 = ys.min(), ys.max() + 1, xs.min(), xs.max() + 1
    cw, ch = x1 - x0, y1 - y0
    th = round(ch * args.width / cw)
    size = (args.width, th)
    shrink = lambda m: np.array(Image.fromarray((m[y0:y1, x0:x1] * 255).astype(np.uint8))
                                .resize(size, Image.BOX)) > 127
    sprites = {}
    for name, path in (('front', args.out), ('back', args.back_out)):
        col, al = layers[name]
        sprites[name] = resize_rgba(np.dstack([col, al * 255]).astype(np.uint8)[y0:y1, x0:x1], size)
        Image.fromarray(sprites[name]).save(path)
        print(f'wrote {path}  {args.width}x{th}  (from {cw}x{ch})')

    # Where the generated branch ran, measured on the finished sprite at the
    # columns where a paw hooks over it -- the scene branch goes exactly there,
    # so SLOTH.restHeight lines its centre up with this band's, and the hang's
    # pivot (SLOTH.gripRow) sits on the same line.
    band, front_al = shrink(branch), sprites['front'][..., 3] > 127
    tops, bots = [], []
    for x in range(args.width):
        rows_ = np.nonzero(band[:, x])[0]
        if len(rows_) and front_al[:rows_.min(), x].any():
            tops.append(rows_.min())
            bots.append(rows_.max())
    if not tops:
        print('no branch band found under the paws -- check --band and --branch against the source')
        return
    top, bot = int(np.median(tops)), int(np.median(bots))
    print(f'branch band under the paws: rows {top}..{bot} of this {th}px sprite, '
          f'centre row {(top + bot) / 2:g}')

    # The far arms' cut tops only read right while the scene branch hides them.
    arm, reach = shrink(back & ~ext), shrink(back | ext)
    if arm.any():
        arm_top = int(np.median([np.nonzero(arm[:, x])[0].min() for x in range(args.width) if arm[:, x].any()]))
        print(f'far arms cut at row ~{arm_top}, extended up to row {np.nonzero(reach.any(axis=1))[0].min()}: '
              f'the scene branch must cover both')

    if args.preview:
        pad = 60
        prev = np.zeros((th + pad * 2, args.width + pad * 2, 4), np.uint8)
        prev[:] = (186, 203, 244, 255)
        img = Image.fromarray(prev)
        img.alpha_composite(Image.fromarray(sprites['back']), (pad, pad))
        bar = np.array(img)
        bar[pad + top:pad + bot + 1] = (207, 140, 94, 255)
        img = Image.fromarray(bar)
        img.alpha_composite(Image.fromarray(sprites['front']), (pad, pad))
        img.convert('RGB').save(args.preview)
        print(f'preview -> {args.preview}')


def split_far_arms(a, keep, branch, dark, far, tol):
    """The back layer: his far arms, which pass behind the branch.

    They're the only two regions of their darker shade that touch the branch
    -- the same shade also shades his head and belly, but never there -- plus
    the ink along their open sides. Ink an arm shares with his near arm or head
    belongs to that near shape, so it stays in front.

    Each arm's top was cut flat by the generated branch; it's then extended up
    through the band that branch covered, so it tucks behind the scene's branch
    rather than ending exactly on its lower edge.
    """
    shade = np.abs(a - far).max(axis=2) <= tol
    lab, _ = ndimage.label(shade)
    ids = np.unique(lab[ndimage.binary_dilation(branch, iterations=6) & shade])
    arms = np.isin(lab, ids[ids > 0])
    arms = ndimage.binary_closing(arms, iterations=3) & keep   # swallow the fur dashes
    if not arms.any():
        print('no far arms found -- check --far against the source; the back layer will be empty')
        return arms, arms.copy()

    near = ndimage.binary_erosion(keep & ~dark & ~arms, iterations=4)   # not anti-alias slivers
    ink = dark & keep & ndimage.binary_dilation(arms, iterations=INK)
    shared = ink & ndimage.binary_dilation(near, iterations=INK)
    back = ndimage.binary_fill_holes(arms | (ink & ~shared)) & keep

    ext = np.zeros_like(back)
    for x in np.nonzero(back.any(axis=0))[0]:
        top = np.nonzero(back[:, x])[0].min()
        y = top - 1
        while y >= 0 and top - y <= 3 and not branch[y, x]:
            y -= 1                                   # step over the arm's anti-alias
        start = y
        while y >= 0 and branch[y, x] and top - y <= EXTEND:
            y -= 1
        if y < start:
            ext[y + 1:top, x] = True
    return back, ext


def extension_colour(a, back, ext):
    """Each extended column continues the colour its arm had just below the cut."""
    out = np.zeros((int(ext.sum()), 3))
    ys, xs = np.nonzero(ext)
    for x in np.unique(xs):
        col = np.nonzero(back[:, x])[0]
        sample = a[min(col.min() + 4, col.max()), x]
        out[xs == x] = sample
    return out


def bleed(rgb, solid):
    """Bleed colour outward so mipmaps never sample raw transparent pixels."""
    idx = ndimage.distance_transform_edt(~solid, return_distances=False, return_indices=True)
    out = rgb.copy()
    out[~solid] = rgb[idx[0], idx[1]][~solid]
    return out


if __name__ == '__main__':
    main()
