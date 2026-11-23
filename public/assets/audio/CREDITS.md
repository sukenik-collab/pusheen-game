# Audio credits

## Background music

Each room has its own track (`ROOM_MUSIC` in `src/config/audioManifest.js`):
the garden and bedroom play A Simple Trifle, the kitchen plays Carefree and
the living room plays Wallpaper.

| Track | Author | Source | License |
|-------|--------|--------|---------|
| **Carefree** | Kevin MacLeod ([incompetech.com](https://incompetech.com)) | [Free Music Archive](https://freemusicarchive.org/music/Kevin_MacLeod/Calming/Carefree) | [CC BY](https://creativecommons.org/licenses/by/4.0/) |
| **Wallpaper** | Kevin MacLeod ([incompetech.com](https://incompetech.com)) | [Free Music Archive](https://freemusicarchive.org/music/Kevin_MacLeod/) | [CC BY](https://creativecommons.org/licenses/by/4.0/) |
| **A Simple Trifle** | [jestar](https://opengameart.org/users/jestar) (the file's tag reads "Jesse Trana"), published 22 January 2017 | [OpenGameArt](https://opengameart.org/content/a-simple-trifle) | [CC0](http://creativecommons.org/publicdomain/zero/1.0/) |

Credit line for the Kevin MacLeod tracks (CC BY requires it):

> "Carefree" and "Wallpaper" by Kevin MacLeod (incompetech.com), from the Free
> Music Archive, licensed under Creative Commons: By Attribution.

CC BY requires saying when a work was changed. The files in this repo are
adapted from the downloads: nothing was edited musically, but each was
re-encoded and its volume adjusted (see below).

### How the files were prepared

All three are level-matched to about -19 LUFS with a plain gain change (so
the room crossfades don't jump in volume; Wallpaper was around 9 dB louder
than Carefree and clipped), then encoded for the web:

| File | Format |
|------|--------|
| `music-carefree.mp3`, `music-wallpaper.mp3` | MP3, 128 kbps, 44.1 kHz (the downloads were 320 and 210 kbps, 8 MB and 5.6 MB) |
| `music-simple-trifle.ogg` | Ogg Vorbis (quality 5). It's a 24 s loop, and Ogg loops without a gap |
| `music-simple-trifle.mp3` | MP3 fallback for Safari/iOS, which can't play Ogg |

If you replace a track, match its loudness (about -19 LUFS integrated) and
keep the key and filename, or repoint it in `audioManifest.js`.

`music-sneaky.wav` is a synthesized CC0 placeholder (from
`scripts/gen-placeholder-audio.mjs`) for a track that isn't used right now.

## Sound effects

The `sfx-*.wav` files are **synthesized CC0 placeholders** from
`scripts/gen-placeholder-audio.mjs`. The game uses the Soft set
(`DEFAULT_SFX_SET`); Boopy is unused for now. Suggested real replacements,
both CC0 (no attribution needed):

| Set | Pack |
|-----|------|
| Soft | Kenney, "UI Audio": https://kenney.nl/assets/ui-audio |
| Boopy | Kenney, "Interface Sounds": https://kenney.nl/assets/interface-sounds |

Each set needs one clip per event key in `SFX_EVENTS`
(`land, jump, squish, sniff, peek, nope, collect, sigh`). Map real files to
those keys in `audioManifest.js`.
