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
    hopInMs: 280,
    holdMs: 450,
    popOutMs: 340,
    // land beside the box, not on top of its own footprint -- popping out
    // to the side keeps the box (and the transformation) readable
    popOutOffsetX: -85,
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

// v2 -- carrying a held item (glass/juice). A gentle < 1 multiplier on the
// jump (via Pusheen's jumpVelocityMultiplier seam) so a full glass reads a
// touch heavier -- purely feel, no gating (the return path is always
// reachable). `offset` positions the accessory sprite on the container, in
// front of her travel direction (mirrored by setFacing).
export const CARRY = {
    jumpMultiplier: 0.82,
    offset: { x: 34, y: 20 }
};

// Sloth's sensor zones -- wide like Stormy's, and a touch wider so you can
// talk standing on the ground beneath him while he hangs from the low branch.
export const SLOTH_RADAR = {
    sniffRadius: 190,
    interactRadius: 130
};

// The sleepy friend hanging from the low tree branch + his one-time wake beat
// (all tween-driven). restHeight = how far his center sits above the floor
// while he hangs; tune to the branch in the final backdrop art.
export const SLOTH = {
    restHeight: 120,
    bubbleHoldMs: 3000,
    yawnScaleX: 1.14,      // a big volume-conserving yawn/stretch
    yawnScaleY: 0.88,
    yawnMs: 420,
    dropMs: 320,           // drop off the branch to the ground (a soft bounce)
    amblePx: 180,          // amble clear along the ground, revealing the door
    ambleMs: 1500,
    sparkleCount: 8,
    sparkleStaggerMs: 90,
    sparkleRisePx: 70,
    sparkleMs: 900
};

// Room palettes -- lazy-summer-afternoon warmth.
export const BACKYARD = {
    sky: 0xbfe0e8,
    grass: 0x9ac96b
};

export const KITCHEN = {
    wall: 0xf2e4c9,
    floor: 0xd8c39a
};
