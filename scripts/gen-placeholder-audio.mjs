// Generates placeholder CC0 audio (our own synth -- no third-party license)
// so the Phase-5 audio plumbing runs and the in-game selector is testable
// before real tracks are dropped in. Swap these files out later; the manifest
// keys stay the same, so no code changes are needed.
//
//   node scripts/gen-placeholder-audio.mjs
//
// Writes mono 16-bit WAVs to public/assets/audio/.

import { mkdirSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const SR = 22050;
const OUT = join(dirname(fileURLToPath(import.meta.url)), '..', 'public', 'assets', 'audio');
mkdirSync(OUT, { recursive: true });

const TAU = Math.PI * 2;

// Per-set pitch multiplier, applied inside note() so the two SFX sets are
// audibly distinct without duplicating every builder.
let PITCH = 1;

function osc (wave, phase) {
    switch (wave) {
        case 'square':   return Math.sin(phase) >= 0 ? 0.5 : -0.5;
        case 'triangle': return (2 / Math.PI) * Math.asin(Math.sin(phase));
        case 'saw':      return (phase / Math.PI % 2) - 1;
        default:         return Math.sin(phase);
    }
}

// One plucked/enveloped note mixed into `buf` starting at time `at` seconds.
function note (buf, at, freq, dur, { wave = 'sine', amp = 0.3, decay = 6, bend = 0, vibrato = 0 } = {}) {
    const start = Math.floor(at * SR);
    const len = Math.floor(dur * SR);
    for (let i = 0; i < len && start + i < buf.length; i++) {
        const t = i / SR;
        const env = Math.exp(-decay * t) * Math.min(1, i / 60); // fast attack, exp decay
        const f = freq * PITCH * (1 + bend * t) * (1 + vibrato * Math.sin(TAU * 5 * t));
        buf[start + i] += amp * env * osc(wave, TAU * f * t);
    }
}

function writeWav (name, buf) {
    let peak = 0;
    for (const s of buf) peak = Math.max(peak, Math.abs(s));
    const gain = peak > 0 ? 0.85 / peak : 1;

    const out = Buffer.alloc(44 + buf.length * 2);
    out.write('RIFF', 0);
    out.writeUInt32LE(36 + buf.length * 2, 4);
    out.write('WAVE', 8);
    out.write('fmt ', 12);
    out.writeUInt32LE(16, 16);
    out.writeUInt16LE(1, 20);
    out.writeUInt16LE(1, 22);
    out.writeUInt32LE(SR, 24);
    out.writeUInt32LE(SR * 2, 28);
    out.writeUInt16LE(2, 32);
    out.writeUInt16LE(16, 34);
    out.write('data', 36);
    out.writeUInt32LE(buf.length * 2, 40);
    for (let i = 0; i < buf.length; i++) {
        const s = Math.max(-1, Math.min(1, buf[i] * gain));
        out.writeInt16LE((s * 32767) | 0, 44 + i * 2);
    }
    writeFileSync(join(OUT, name), out);
    console.log('wrote', name, `(${(out.length / 1024).toFixed(0)} KB)`);
}

// --- Music loops: distinct, gentle, ~5s so a seam is barely audible ----------
// Each is a plucked arpeggio over a soft pad -- just enough character to tell
// the three selector options apart by ear.
function musicLoop (rootHz, scale, { wave, rate, decay, padAmp }) {
    const dur = 5;
    const buf = new Float32Array(Math.floor(dur * SR));
    // soft sustained pad (root + fifth)
    for (let i = 0; i < buf.length; i++) {
        const t = i / SR;
        buf[i] += padAmp * Math.sin(TAU * rootHz * 0.5 * t) * 0.6;
        buf[i] += padAmp * Math.sin(TAU * rootHz * 0.75 * t) * 0.4;
    }
    // plucked melody walking up/down the scale
    let at = 0;
    let step = 0;
    while (at < dur - rate) {
        const deg = scale[Math.abs(step) % scale.length];
        const freq = rootHz * Math.pow(2, deg / 12);
        note(buf, at, freq, rate * 1.6, { wave, amp: 0.32, decay });
        at += rate;
        step += (Math.floor(at / (rate * 4)) % 2 === 0) ? 1 : -1;
    }
    return buf;
}

// Carefree, A Simple Trifle and Wallpaper are real tracks now (mp3/ogg, see
// public/assets/audio/CREDITS.md), so only the unused Sneaky placeholder is left.
writeWav('music-sneaky.wav', musicLoop(293.7, [0, 2, 3, 7, 8, 7], { wave: 'saw', rate: 0.2, decay: 9, padAmp: 0.03 }));              // pizzicato, playful

// --- SFX sets: same 8 event keys, two timbres -------------------------------
const EVENTS = {
    land:    (b, w) => note(b, 0, 160, 0.22, { wave: w, amp: 0.5, decay: 20, bend: -0.3 }),
    jump:    (b, w) => note(b, 0, 300, 0.16, { wave: w, amp: 0.4, decay: 12, bend: 1.2 }),
    squish:  (b, w) => { note(b, 0, 220, 0.1, { wave: w, amp: 0.45, decay: 10, bend: 1.5 }); note(b, 0.08, 340, 0.12, { wave: w, amp: 0.4, decay: 12, bend: -0.6 }); },
    sniff:   (b, w) => note(b, 0, 880, 0.12, { wave: w, amp: 0.3, decay: 16, vibrato: 0.03 }),
    peek:    (b, w) => { note(b, 0, 440, 0.1, { wave: w, amp: 0.35, decay: 14 }); note(b, 0.07, 587, 0.14, { wave: w, amp: 0.35, decay: 12 }); },
    nope:    (b, w) => note(b, 0, 196, 0.16, { wave: w, amp: 0.4, decay: 14, bend: -0.4 }),
    collect: (b, w) => { note(b, 0, 523, 0.14, { wave: w, amp: 0.4, decay: 10 }); note(b, 0.1, 784, 0.22, { wave: w, amp: 0.4, decay: 8 }); },
    sigh:    (b, w) => note(b, 0, 392, 0.4, { wave: w, amp: 0.35, decay: 5, bend: -0.35 })
};

// "soft" = rounded sine, a touch lower; "boopy" = brighter square, a touch higher.
for (const [setKey, cfg] of [['soft', { wave: 'sine', pitch: 1 }], ['boopy', { wave: 'square', pitch: 1.18 }]]) {
    for (const [ev, build] of Object.entries(EVENTS)) {
        const buf = new Float32Array(Math.floor(0.55 * SR));
        PITCH = cfg.pitch;
        build(buf, cfg.wave);
        PITCH = 1;
        writeWav(`sfx-${setKey}-${ev}.wav`, buf);
    }
}
