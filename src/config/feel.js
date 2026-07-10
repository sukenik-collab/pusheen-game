// All tunable feel constants for Pusheen's movement, squash & stretch, and
// radar zones. Starting seeds from the design doc -- tune by playtest.

export const MOVE = {
    accel: 1200,
    maxSpeed: 180,
    drag: 1000
};

export const JUMP = {
    gravity: 1400,
    velocity: -480
};

export const LAND_SQUASH = {
    scaleY: 0.85,
    scaleX: 1.12,
    downMs: 90,
    upMs: 120,
    upEase: 'Back.easeOut'
};

export const CUSHION_SQUASH = {
    scaleY: 0.9,
    scaleX: 1.05,
    ms: 100
};

export const RADAR = {
    sniffRadius: 140,
    interactRadius: 64
};

export const IDLE = {
    bobPx: 2.5,
    breatheScale: 0.02,
    breatheMs: 1400
};

export const SNIFF_REACT = {
    scaleY: 0.95,
    scaleX: 1.06,
    ms: 90
};

export const SNIFF_CUE = {
    noteCount: 3,
    staggerMs: 220,
    risePx: 40,
    ms: 700
};

export const DOOR = {
    fadeMs: 260
};

export const NAP = {
    settleMs: 500,
    curlMs: 600,
    curlScale: 0.72,
    curlAngle: 8,
    cardHoldMs: 2000
};
