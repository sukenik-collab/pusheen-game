// The single source of truth for what audio exists and can be selected at
// runtime (Phase 5, plan "A"). Swapping a track or SFX set = drop a new file
// in public/assets/audio/ and change a line here -- no other code touches file
// paths, so the game never needs a logic change to re-point audio.
//
// The files shipped today are synthesized CC0 placeholders (see the audio
// CREDITS.md). Real recommended tracks to drop in are noted per entry.

const BASE = 'assets/audio/';

// Every SFX set must provide a clip for each of these event keys. The game
// calls audio.play(<eventKey>); the current set decides which file sounds.
export const SFX_EVENTS = ['land', 'jump', 'squish', 'sniff', 'peek', 'nope', 'collect', 'sigh'];

// Background music options (assigned to rooms in ROOM_MUSIC below). `file` is
// what loads (and the sound's key); `alt` lists fallback formats the browser
// can use if it can't play `file` (the loader takes the first playable one).
// `credit` is the licence line, kept in sync with public/assets/audio/CREDITS.md.
// The three real tracks are level-matched to about -19 LUFS, so a room
// crossfade doesn't jump in volume; match any replacement to that.
export const TRACKS = [
    {
        key: 'wallpaper',
        name: 'Wallpaper',
        file: `${BASE}music-wallpaper.mp3`,
        credit: 'Kevin MacLeod (incompetech.com), via Free Music Archive, CC BY'
    },
    {
        key: 'carefree',
        name: 'Carefree',
        file: `${BASE}music-carefree.mp3`,
        credit: 'Kevin MacLeod (incompetech.com), via Free Music Archive, CC BY'
    },
    {
        // A 24s loop, so it ships as Ogg (loops without a gap); Safari/iOS
        // can't play Ogg and falls back to the mp3.
        key: 'simple-trifle',
        name: 'A Simple Trifle',
        file: `${BASE}music-simple-trifle.ogg`,
        alt: [`${BASE}music-simple-trifle.mp3`],
        credit: 'jestar, via OpenGameArt, CC0'
    },
    {
        key: 'sneaky',
        name: 'Sneaky Adventure',
        file: `${BASE}music-sneaky.wav`,
        recommended: 'Kevin MacLeod - "Sneaky Adventure" (CC-BY 3.0)'
    }
];

// SFX sets (DEFAULT_SFX_SET picks the one in use). Each maps every SFX_EVENTS key to a file.
export const SFX_SETS = [
    {
        key: 'soft',
        name: 'Soft',
        recommended: 'Kenney - "UI Audio" (CC0)',
        clips: Object.fromEntries(SFX_EVENTS.map((e) => [e, `${BASE}sfx-soft-${e}.wav`]))
    },
    {
        key: 'boopy',
        name: 'Boopy',
        recommended: 'Kenney - "Interface Sounds" (CC0)',
        clips: Object.fromEntries(SFX_EVENTS.map((e) => [e, `${BASE}sfx-boopy-${e}.wav`]))
    }
];

// Which track each room plays (a TRACKS key). Rooms that share a track keep it
// playing straight through; a different one crossfades in on entering.
export const ROOM_MUSIC = {
    Backyard: 'simple-trifle',
    Bedroom: 'simple-trifle',
    Kitchen: 'carefree',
    LivingRoom: 'wallpaper'
};

// The SFX set the game uses (an SFX_SETS key). There's no in-game picker.
export const DEFAULT_SFX_SET = 'soft';

// Mix defaults. Music sits under everything; SFX comfortably above but soft.
export const AUDIO_MIX = {
    roomFadeMs: 800, // crossfade between room tracks
    musicVolume: 0.4,
    sfxVolume: 0.7,
    napDuckVolume: 0.22, // music dips on the curl-up...
    napSwellVolume: 0.5, // ...then swells under "So Cozy!"
    duckMs: 700,
    swellMs: 1200
};
