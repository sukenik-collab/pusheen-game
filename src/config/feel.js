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
    upEase: 'Back.easeOut',
    // How hard she hits scales the squash: a step down off the pillow and a
    // drop from the kitchen counter shouldn't land identically. `depth`
    // multiplies both the scaleY and scaleX offsets above by the SAME factor,
    // so a harder landing stays volume-conserving rather than just flatter.
    // Speeds are px/s of fall at the moment of impact.
    softSpeed: 300,      // a gentle step-down
    hardSpeed: 850,      // off the counter top (~240px)
    softDepth: 0.5,
    hardDepth: 1.25
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

// Where she arrives in a room, as her centre's height above the floor. Her
// body is 78 tall, so this is a ~20px step down: enough to settle with a soft
// land squash (under LAND_SQUASH.softSpeed) rather than the long drop from
// off-screen that read as falling into the room rather than walking into it.
export const SPAWN = {
    heightAboveGround: 60
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
    offset: { x: 34, y: 20 },
    // The visible half of "this is a bit heavy": her idle bob slows while her
    // paws are full, so carrying reads before she ever jumps.
    breatheTimeScale: 0.8
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
    // Where he hangs, measured so the tree's branch sits where his art's own
    // branch was: the branch art's underside is 241px above the trunk base and
    // it's 44px thick, both at TREE_SCALE, and his art's branch ran rows 18-33
    // of the 159px-tall sprites (tools/cut_tree.py and tools/cut_sloth.py print
    // these on every re-cut). The scene's branch is thicker, so rather than
    // centring it on that band its top edge sits ~4px above the band's (row
    // 13.5 at 160): his paw domes clear it and his claws land on its face.
    // 156 slumps the paws onto the face, 164 lifts one clear of it. Re-derive
    // this if TREE_SCALE moves or either is re-cut.
    restHeight: 160,
    // The row, down from the hanging sprites' top edge, where his claws curl
    // over the branch -- the top of that band. He breathes and yawns about
    // this line, so his paws stay hooked while his body moves below them.
    gripRow: 18,
    bubbleHoldMs: 3000,
    yawnScaleX: 1.14,      // a big volume-conserving yawn/stretch
    yawnScaleY: 0.88,
    yawnMs: 420,
    dropMs: 550,           // lower himself off the branch (a soft bounce)
    amblePx: 180,          // amble clear along the ground, revealing the door
    ambleMs: 3000,         // 60px/s -- half Pusheen's top speed. A plod.
    // The plod: with no walk-cycle art, a slow side-to-side lean over the
    // travel carries the steps. Slow and wide reads as a sloth, not a scurry.
    waddleDeg: 5,
    waddleMs: 550,
    // ...and the flop as he settles onto his belly at the end of it.
    sitSquashY: 0.92,
    sitSquashX: 1.06,
    sitMs: 200,
    sparkleCount: 8,
    sparkleStaggerMs: 90,
    sparkleRisePx: 70,
    sparkleMs: 900,
    // The approach cue when she's actually carrying the juice -- bigger and
    // quicker than the three-sparkle hello, so the payoff moment announces
    // itself before she even presses E.
    juiceCueCount: 7,
    juiceCueStaggerMs: 70
};

// The backyard butterfly: no fail state, nothing to catch (golden rule 4) --
// its whole personality is in how it moves. It has its own life (a wander
// that never stops), and Pusheen only leans on it, gently, when she's close.
// Never target-chases a waypoint and never target-flees Pusheen: everything
// below is a steering force blended into one desired velocity, smoothed
// toward frame-rate-independently (Butterfly.js's `approach`), so nothing
// snaps. Tune by playtest -- start by watching it for ~30s with Pusheen far
// away and see if it looks alive on its own before tuning the avoidance.
export const BUTTERFLY = {
    // Wander: a slowly drifting heading, not per-frame jitter -- see
    // wanderTurnRate. Speed breathes around wanderSpeed rather than holding
    // it exactly, so it sometimes almost hovers while turning.
    wanderSpeed: 35,
    wanderSpeedRipple: 5,
    wanderRippleHz: 0.7,
    maxSpeed: 55,
    // Max radians/sec the *wander heading* itself drifts by -- low-frequency,
    // so it carves broad lazy curves rather than a random walk.
    wanderTurnRate: 0.6,
    // How hard actual velocity turns to follow the desired direction (used
    // as `approach`'s rate: higher snaps quicker, lower drifts languidly).
    steeringResponse: 2.0,

    // Sensor zones, same "outer leads" contract as every other radar in this
    // file, but continuous rather than a single enable/disable line: outer
    // ramps in a little avoidance, inner ramps in more. Backyard-scale, not
    // the cabinet/Stormy defaults -- a butterfly's "personal space" reads
    // bigger than a conversation radius.
    outerRadius: 190,
    innerRadius: 90,
    outerAvoidance: 0.25,
    innerAvoidance: 0.65,
    // The wander's own pull in the blend (see steer() in Butterfly.js):
    // avoidance never fully overrides it, so she nudges rather than commands.
    wanderWeight: 1.0,

    // Soft walls a little in from the actual backyard edges, so it curves
    // away instead of visibly bouncing off an invisible box.
    boundaryMargin: 90,
    boundaryForce: 0.8,

    // Bob/sway: a visual offset on top of the logical x/y, never fed back
    // into steering -- the flight path itself stays a smooth curve.
    bobAmplitude: 7,
    bobFrequency: 1.5,
    swayAmplitude: 3,
    swayFrequency: 0.9,

    // Wing flap: scaleX around each wing's attachment corner (its own
    // origin -- see Butterfly.js), not rotation. Upper/lower wings get
    // different amplitudes so the flap doesn't read as mechanically
    // mirrored, and flapSpeed rises a little with ground speed.
    flapSpeed: 7,
    flapSpeedFromSpeed: 3.0,
    upperFlapBase: 0.55,
    upperFlapRange: 0.45,
    lowerFlapBase: 0.65,
    lowerFlapRange: 0.35,
    // Bursty, not a constant metronome: flap for a bit, glide (wings near
    // open) for a bit. Both durations vary randomly within their range so no
    // two pauses match.
    flapBurstMs: [500, 900],
    flapGlideMs: [350, 700],

    // A few degrees of lean toward the direction of travel -- physicality
    // without breaking the straight-on art style.
    tiltPerSpeed: 0.0016,
    maxTiltRad: 0.14
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
