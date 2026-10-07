import { TRACKS, SFX_SETS, AUDIO_MIX } from '../config/audioManifest.js';

// Owns the whole Phase-5 mix: one looping music bed + one-shot SFX on top,
// through independent music/sfx volumes and a master mute. A single instance
// is created once (Preloader) and stashed in the registry, so it -- and its
// current track/set selection -- outlives every LivingRoom restart (Play
// again keeps the same audio), while a full page reload starts fresh.
//
// The SoundManager (scene.sound) is game-global, so the music sound created
// here keeps playing across scene restarts without being re-created.
export class AudioController
{
    constructor (game)
    {
        this.game = game;
        this.sound = game.sound;

        this.trackIndex = 0;
        this.sfxIndex = 0;
        this.muted = false;

        this.musicVolume = AUDIO_MIX.musicVolume;
        this.sfxVolume = AUDIO_MIX.sfxVolume;

        this.music = null;
        this.lastPlayed = {}; // per-event timestamp, to throttle machine-gun repeats
    }

    get currentTrack () { return TRACKS[this.trackIndex]; }
    get currentSet () { return SFX_SETS[this.sfxIndex]; }

    // Called on every one of her movement inputs (Pusheen's
    // startMusicOnFirstMove); only the first starts the bed. That input is
    // itself the gesture browsers wait for before letting audio play: Phaser
    // resumes the audio context on it, and a bed started a frame before that
    // resume simply begins playing as it lands.
    startMusic ()
    {
        if (this.music) {
            return;
        }
        this.playTrack(this.trackIndex);
    }

    playTrack (index)
    {
        this.trackIndex = (index + TRACKS.length) % TRACKS.length;

        if (this.music) {
            this.music.stop();
            this.music.destroy();
        }

        this.music = this.sound.add(this.currentTrack.file, {
            loop: true,
            volume: this.musicVolume
        });
        this.music.play();
    }

    cycleTrack ()
    {
        this.playTrack(this.trackIndex + 1);
        return this.currentTrack;
    }

    cycleSfxSet ()
    {
        this.sfxIndex = (this.sfxIndex + 1) % SFX_SETS.length;
        return this.currentSet;
    }

    // One-shot SFX. Slight per-play rate variation so a repeated sample never
    // sounds mechanical across a long cozy session; a short per-event cooldown
    // stops a single frame's double-trigger (or a bounce) from stacking.
    play (event)
    {
        const path = this.currentSet.clips[event];
        if (!path) {
            return;
        }

        const now = performance.now();
        if (now - (this.lastPlayed[event] || 0) < 60) {
            return;
        }
        this.lastPlayed[event] = now;

        const rate = 1 + (Math.random() * 2 - 1) * 0.06;
        this.sound.play(path, { volume: this.sfxVolume, rate });
    }

    toggleMute ()
    {
        this.muted = !this.muted;
        this.sound.setMute(this.muted); // master mute -- covers music and SFX
        return this.muted;
    }

    // The nap payoff (spec 5.7): music gently softens on the curl-up, then
    // swells back under "So Cozy!". Tweened via the (still-active) LivingRoom
    // scene that drives the nap.
    duckForNap (scene)
    {
        if (!this.music) {
            return;
        }
        scene.tweens.add({
            targets: this.music,
            volume: AUDIO_MIX.napDuckVolume,
            duration: AUDIO_MIX.duckMs,
            ease: 'Sine.easeInOut',
            onComplete: () => {
                if (!this.music) {
                    return;
                }
                scene.tweens.add({
                    targets: this.music,
                    volume: AUDIO_MIX.napSwellVolume,
                    duration: AUDIO_MIX.swellMs,
                    ease: 'Sine.easeInOut'
                });
            }
        });
    }

    // Reset the bed to its base volume instantly -- called on restart so a
    // Play again after the nap swell doesn't leave the music stuck loud/soft.
    resetMusicVolume ()
    {
        if (this.music) {
            this.music.setVolume(this.musicVolume);
        }
    }
}
