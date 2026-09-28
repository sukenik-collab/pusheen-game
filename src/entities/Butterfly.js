import { GameObjects, Math as PMath } from 'phaser';
import { BUTTERFLY as B } from '../config/feel.js';

// Where the split point landed inside each piece (tools/cut_butterfly.py
// prints these on every re-cut) -- each origin, so every piece sits exactly
// where it should with no offset math here. The wings' are near their own
// corner but not exactly on it: their crop reaches a couple of final px past
// the split lines into their neighbours (--wing-overlap), so independent
// rounding when each is resized never opens a gap at the seam.
const BODY_ORIGIN = { x: 0.4830, y: 0.6436 };
const WING_ORIGIN = {
    UL: { x: 0.9341, y: 0.9160 },
    UR: { x: 0.0662, y: 0.9157 },
    LL: { x: 0.9281, y: 0.0962 },
    LR: { x: 0.0719, y: 0.0965 }
};

const TAU = Math.PI * 2;

function randRange ([lo, hi])
{
    return PMath.FloatBetween(lo, hi);
}

// A backyard critter with no fail state and nothing to catch (golden rule 4):
// she has her own life -- a wander that never stops -- and Pusheen only ever
// leans on it, gently, never commands it. Everything here is a steering
// force blended into one desired velocity, eased toward frame-rate-
// independently (see steer()), so nothing snaps or teleports and there's no
// waypoint list to "arrive" at or a scripted return route once Pusheen
// leaves -- removing the avoidance force just lets the wander that was
// always running underneath carry on.
//
// Visual rig: a Container over five pieces (tools/cut_butterfly.py), wings
// first (back to front: both lower, then both upper, the way a forewing
// overlaps a hindwing near the body) and the body+antennae drawn last so it
// covers the seam where all four meet. Each wing's own origin sits at that
// meeting point, so its flap (scaleX only, never a dramatic rotation) pivots
// exactly at the attachment with no per-wing offset to track.
export class Butterfly extends GameObjects.Container
{
    // `bounds` is the soft-wall rectangle she wanders inside (backyard sky
    // above the grass line, inset from the screen edges) -- see Backyard.js.
    constructor (scene, x, y, bounds)
    {
        super(scene, x, y);
        scene.add.existing(this);

        this.bounds = bounds;

        // Logical flight position, separate from this.x/this.y: the bob and
        // sway below are a purely visual offset applied on top each frame,
        // never fed back into steering, so the actual flight path stays a
        // smooth curve rather than zig-zagging with the wingbeat.
        this.baseX = x;
        this.baseY = y;

        this.heading = PMath.FloatBetween(0, TAU);
        this.velocity = new PMath.Vector2(Math.cos(this.heading), Math.sin(this.heading)).scale(B.wanderSpeed);

        this.bobPhase = PMath.FloatBetween(0, TAU);
        this.swayPhase = PMath.FloatBetween(0, TAU);
        this.ripplePhase = PMath.FloatBetween(0, TAU);

        this.wingOpen = 1;
        this.flapPhase = 0;
        this.flapBurst = true;
        this.flapTimer = randRange(B.flapBurstMs) / 1000;

        this.tilt = 0;

        const wing = (key, origin) => scene.add.image(0, 0, key).setOrigin(origin.x, origin.y);
        this.wingLL = wing('butterflyWingLL', WING_ORIGIN.LL);
        this.wingLR = wing('butterflyWingLR', WING_ORIGIN.LR);
        this.wingUL = wing('butterflyWingUL', WING_ORIGIN.UL);
        this.wingUR = wing('butterflyWingUR', WING_ORIGIN.UR);
        this.bodyImg = scene.add.image(0, 0, 'butterflyBody').setOrigin(BODY_ORIGIN.x, BODY_ORIGIN.y);
        this.add([this.wingLL, this.wingLR, this.wingUL, this.wingUR, this.bodyImg]);
    }

    update (time, delta, pusheen)
    {
        const dt = Math.min(delta / 1000, 1 / 20);   // clamp a stall/tab-switch, not real gameplay
        const t = time / 1000;                       // Phaser's own clock, in seconds

        this.steer(dt, t, pusheen);
        this.baseX += this.velocity.x * dt;
        this.baseY += this.velocity.y * dt;

        this.updateVisualOffset(t);
        this.updateWings(dt);
        this.updateTilt(dt);
    }

    // Wander + Pusheen avoidance + boundary, blended (never a switch between
    // them) into one desired velocity, then eased toward -- see the class
    // comment. `1 - exp(-rate * dt)` is frame-rate-independent: the same
    // smoothing regardless of the actual delta, unlike a flat-fraction lerp.
    steer (dt, t, pusheen)
    {
        // The wander heading itself drifts, slowly and at random -- broad
        // lazy curves, not a jittering path. No explicit centering needed:
        // wanderTurnRate is small enough that this reads as meandering, not
        // a spiral. sqrt(dt), not dt: this is a random walk, and a walk's
        // accumulated variance over real time only comes out frame-rate
        // independent if each step's noise scales with the SQUARE ROOT of
        // its own timestep (a step twice as long needs sqrt(2), not 2, times
        // the noise to contribute the same variance) -- scaling by dt itself
        // would make her turn more sluggishly on a slower machine.
        this.heading += PMath.FloatBetween(-1, 1) * B.wanderTurnRate * Math.sqrt(dt);
        const wanderSpeed = B.wanderSpeed + Math.sin(t * B.wanderRippleHz * TAU + this.ripplePhase) * B.wanderSpeedRipple;
        const wander = new PMath.Vector2(Math.cos(this.heading), Math.sin(this.heading)).scale(wanderSpeed * B.wanderWeight);

        const avoidance = this.avoidanceForce(pusheen);
        const boundary = this.boundaryForce();

        const desired = wander.add(avoidance).add(boundary);
        if (desired.length() > B.maxSpeed) {
            desired.setLength(B.maxSpeed);
        }

        const rate = 1 - Math.exp(-B.steeringResponse * dt);
        this.velocity.x += (desired.x - this.velocity.x) * rate;
        this.velocity.y += (desired.y - this.velocity.y) * rate;
    }

    // Continuous, not a state switch: strength ramps from 0 at the outer
    // radius up to outerAvoidance at the inner one, then on to innerAvoidance
    // at zero distance -- "gentle" and "moderate", never a sudden flee.
    // Blended with the wander above rather than replacing it, so she curves
    // off her existing heading instead of snapping to face directly away.
    avoidanceForce (pusheen)
    {
        const dx = this.baseX - pusheen.x;
        const dy = this.baseY - pusheen.y;
        const dist = Math.hypot(dx, dy) || 1;

        let strength;
        if (dist >= B.outerRadius) {
            strength = 0;
        } else if (dist >= B.innerRadius) {
            const t = (B.outerRadius - dist) / (B.outerRadius - B.innerRadius);
            strength = PMath.Linear(0, B.outerAvoidance, t);
        } else {
            const t = PMath.Clamp((B.innerRadius - dist) / B.innerRadius, 0, 1);
            strength = PMath.Linear(B.outerAvoidance, B.innerAvoidance, t);
        }

        return new PMath.Vector2(dx / dist, dy / dist).scale(strength * B.maxSpeed);
    }

    // Curves her away from an edge well before it, rather than a hard bounce
    // once she'd otherwise cross it.
    boundaryForce ()
    {
        const { left, right, top, bottom } = this.bounds;
        const m = B.boundaryMargin;
        const f = new PMath.Vector2(0, 0);

        if (this.baseX < left + m) f.x += (left + m - this.baseX) / m;
        if (this.baseX > right - m) f.x -= (this.baseX - (right - m)) / m;
        if (this.baseY < top + m) f.y += (top + m - this.baseY) / m;
        if (this.baseY > bottom - m) f.y -= (this.baseY - (bottom - m)) / m;

        return f.scale(B.boundaryForce * B.maxSpeed);
    }

    // The bob/sway float, applied on top of the logical position -- never
    // part of the flight path itself (see the class comment).
    updateVisualOffset (t)
    {
        this.x = this.baseX + Math.sin(t * B.swayFrequency * TAU + this.swayPhase) * B.swayAmplitude;
        this.y = this.baseY + Math.sin(t * B.bobFrequency * TAU + this.bobPhase) * B.bobAmplitude;
    }

    // Bursts of flapping alternate with gliding pauses (both durations
    // randomised within their range) -- a continuously vibrating butterfly
    // reads as an effect, not an animal. Speed nudges the flap rate up a
    // little; avoidance never spikes it into "frantic" -- shy, not scared.
    updateWings (dt)
    {
        const speedRatio = PMath.Clamp(this.velocity.length() / B.maxSpeed, 0, 1);
        const flapSpeed = B.flapSpeed + speedRatio * B.flapSpeedFromSpeed;

        this.flapTimer -= dt;
        if (this.flapTimer <= 0) {
            this.flapBurst = !this.flapBurst;
            this.flapTimer = randRange(this.flapBurst ? B.flapBurstMs : B.flapGlideMs) / 1000;
        }

        if (this.flapBurst) {
            this.flapPhase += flapSpeed * dt;
            this.wingOpen = Math.abs(Math.sin(this.flapPhase));
        } else {
            // Settle toward open (gliding) rather than freezing mid-flap.
            this.wingOpen += (1 - this.wingOpen) * Math.min(1, dt * 4);
            this.flapPhase = 0;
        }

        this.wingUL.scaleX = B.upperFlapBase + B.upperFlapRange * this.wingOpen;
        this.wingUR.scaleX = B.upperFlapBase + B.upperFlapRange * this.wingOpen;
        this.wingLL.scaleX = B.lowerFlapBase + B.lowerFlapRange * this.wingOpen;
        this.wingLR.scaleX = B.lowerFlapBase + B.lowerFlapRange * this.wingOpen;
    }

    // A bank toward horizontal travel, eased so she tips into turns rather
    // than snapping -- see BUTTERFLY.tiltPerSpeed for why not a full turn.
    updateTilt (dt)
    {
        const target = PMath.Clamp(this.velocity.x * B.tiltPerSpeed, -B.maxTiltRad, B.maxTiltRad);
        this.tilt += (target - this.tilt) * Math.min(1, dt * 4);
        this.rotation = this.tilt;
    }
}
