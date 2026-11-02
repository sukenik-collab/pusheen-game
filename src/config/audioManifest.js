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

// Background music options (assigned to rooms in ROOM_MUSIC below). `file` is the placeholder in the
// repo now; `recommended` is the real track to swap in (keep the key stable).
export const TRACKS = [
    {
        key: 'wallpaper',
        name: 'Wallpaper',
        file: `${BASE}music-wallpaper.wav`,
        recommended: 'Kevin MacLeod - "Wallpaper" (CC-BY 3.0)'
    },
	{
        key: 'carefree',
        name: 'Carefree',
        file: `${BASE}music-carefree.wav`,
        recommended: 'Kevin MacLeod - "Carefree" (CC-BY 4.0)'
    },
    {
        key: 'simple-trifle',
        name: 'A Simple Trifle',
        file: `${BASE}music-simple-trifle.wav`,
        recommended: 'OpenGameArt - "A Simple Trifle"'
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
