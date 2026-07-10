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

// Yarn balls sit flush against furniture, so both radii are wider than the
// cabinet's 140/64: Pusheen's body half-width (55) plus her coast-to-a-stop
// keeps her center ~75-90px from a tucked-in ball, and pickup should feel
// forgiving, not pixel-perfect. Outer still leads inner.
export const YARN_RADAR = {
    sniffRadius: 150,
    interactRadius: 95
};

export const YARN_POP = {
    risePx: 46,
    ms: 450
};

// Wider than the cabinet's zones: talking should work standing *beside*
// her (not overlapping her sprite), and the inner zone must still contain
// a Pusheen who pressed E mid-hop (~95px above ground at the apex).
export const STORMY_RADAR = {
    sniffRadius: 170,
    interactRadius: 110
};

export const STORMY = {
    bubbleHoldMs: 2800,
    hopPx: 30,
    hopMs: 240,
    hopCount: 3,
    heartCount: 6,
    heartStaggerMs: 130,
    heartRisePx: 60,
    heartMs: 900
};

export const BOX_RADAR = {
    sniffRadius: 150,
    interactRadius: 100
};

// The one costume ability: a floatier, taller Pusheencorn jump.
// Apex = v^2/2g: ~192px vs the normal ~82px -- enough to reach the
// bedroom's high shelf, which the normal hop can't.
export const COSTUME = {
    gravity: 1000,
    jumpVelocity: -620,
    tint: 0xffd9f0,
    hopInMs: 280,
    holdMs: 450,
    popOutMs: 340,
    wobbleDeg: 4,
    wobbleMs: 90
};

export const NAP = {
    settleMs: 500,
    curlMs: 600,
    curlScale: 0.72,
    curlAngle: 8,
    cardHoldMs: 2000
};
