import { GameObjects, Curves, Math as PMath } from 'phaser';
import { BUTTERFLY as B } from '../config/feel.js';

// Where the split point landed inside each piece (tools/cut_butterfly.py
// prints these on every re-cut) -- each origin, so every piece sits exactly
// where it should with no offset math here. The wings' are near their own
// corner but not exactly on it: their crop reaches a couple of final px past
// the split lines into their neighbours (--wing-overlap), so independent
// rounding when each is resized never opens a gap at the seam.
const BODY_ORIGIN = { x: 0.4830, y: 0.6436 };
const WING_ORIGIN = {
    UL: { x: 0.9300, y: 0.9109 },
    UR: { x: 0.0703, y: 0.9106 },
    LL: { x: 0.9240, y: 0.1019 },
    LR: { x: 0.0764, y: 0.1022 }
};

const TAU = Math.PI * 2;

// Pusheen counts as moving once she shifts more than this between frames.
// Position, not velocity, so a scripted slide (Sloth's shove) counts too.
const STILL_EPS = 0.5;

// Perched, the float eases back to rest over this long.
const SETTLE_MS = 250;

function randRange ([lo, hi])
{
    return PMath.FloatBetween(lo, hi);
}

// A backyard critter with no fail state and nothing to catch (golden rule 4):
// she has her own life -- a wander that never stops -- and Pusheen only ever
// leans on it, gently, never commands it. Flight is steering forces blended
// into one desired velocity, eased toward frame-rate-independently (see
// steer()), so nothing snaps or teleports and there's no waypoint list to
// "arrive" at or a scripted return once Pusheen leaves.
//
// She starts off-stage and flutters in after a few seconds (enter()). Now and
// then, if Pusheen has been still a while, she lands on her head:
//   offstage -> wander -> approach -> land -> perched -> (take off) -> wander
// Rare and opportunistic (see BUTTERFLY's landing notes in feel.js), never a
// rule, so it reads as curiosity rather than a mechanic. There are no SHY /
// MORE_SHY states: the shyness is the avoidance force ramping with distance.
//
// Visual rig: five pieces (tools/cut_butterfly.py) in an inner container,
// `rig`, wings first (both lower, then both upper, the way a forewing
// overlaps a hindwing) and the body+antennae last, covering the seam where
// all four meet. The float (bob/sway) tweens and the bank act on the rig
// alone, so this container's own x/y is always her true flight position.
// Each wing's origin sits at the meeting point, so its flap (scaleX only)
// pivots exactly at the attachment.
export class Butterfly extends GameObjects.Container
{
    // `bounds` is the soft-wall rectangle she wanders inside (the backyard sky
    // above the grass line, reaching just past the screen's side edges) --
    // see Backyard.js. She starts off-stage and flies in on her own.
    constructor (scene, bounds)
    {
        super(scene, 0, 0);
        scene.add.existing(this);

        this.bounds = bounds;

        this.heading = PMath.FloatBetween(0, TAU);
        this.velocity = new PMath.Vector2(Math.cos(this.heading), Math.sin(this.heading)).scale(B.wanderSpeed);
        this.ripplePhase = PMath.FloatBetween(0, TAU);

        this.wingOpen = 1;
        this.flapPhase = 0;
        this.flapBurst = true;
        this.flapTimer = randRange(B.flapBurstMs) / 1000;

        // Off-stage until the entrance -- on the scene clock, so it's ~10s
        // whatever the frame rate. (Phaser caps each frame's step at 1/60s for
        // 120 frames after boot or a refocus, so on a machine far below 60fps,
        // like a headless test browser, it runs long; at 60fps it can't.)
        this.state = 'offstage';
        this.setVisible(false);
        scene.time.delayedCall(randRange(B.entranceDelayMs), () => this.enter());
        this.landCooldown = randRange(B.landFirstCooldownMs) / 1000;
        this.landCheckIn = randRange(B.landCheckMs) / 1000;
        this.pusheenStill = 0;
        this.pusheenMoved = false;
        this.lastPusheenX = null;
        this.lastPusheenY = null;
        this.curvePoint = new PMath.Vector2();

        const wing = (key, origin) => scene.add.image(0, 0, key).setOrigin(origin.x, origin.y);
        this.wingLL = wing('butterflyWingLL', WING_ORIGIN.LL);
        this.wingLR = wing('butterflyWingLR', WING_ORIGIN.LR);
        this.wingUL = wing('butterflyWingUL', WING_ORIGIN.UL);
        this.wingUR = wing('butterflyWingUR', WING_ORIGIN.UR);
        const body = scene.add.image(0, 0, 'butterflyBody').setOrigin(BODY_ORIGIN.x, BODY_ORIGIN.y);
        this.rig = scene.add.container(0, 0, [this.wingLL, this.wingLR, this.wingUL, this.wingUR, body]);
        this.add(this.rig);

        this.startFloat();
    }

    update (time, delta, pusheen)
    {
        const dt = Math.min(delta / 1000, 1 / 20);   // clamp a stall/tab-switch, not real gameplay
        const t = time / 1000;                       // Phaser's own clock, in seconds

        if (this.state === 'offstage') {
            return;
        }

        this.watchPusheen(dt, pusheen);

        if (this.state === 'wander') {
            this.considerLanding(dt, pusheen);
        }

        if (this.state === 'wander') {
            this.steer(dt, t, pusheen);
            this.fly(dt);
        } else if (this.state === 'approach') {
            this.steerApproach(dt, t, pusheen);
            this.fly(dt);
        } else if (this.state === 'land') {
            this.followLanding(pusheen);
        } else {
            this.perch(dt, pusheen);
        }

        this.updateWings(dt);
        this.updateTilt(dt);
    }

    // In from just past one side of the screen (her 53px span wholly hidden),
    // at a random height, heading roughly inward -- so she's in view within
    // a second rather than flying the width of the off-screen margin first.
    enter ()
    {
        if (this.state !== 'offstage') {
            return;
        }
        const { top, bottom } = this.bounds;
        const fromLeft = Math.random() < 0.5;
        this.setPosition(fromLeft ? -30 : this.scene.scale.width + 30, PMath.FloatBetween(top + 60, bottom - 100));
        this.heading = (fromLeft ? 0 : Math.PI) + PMath.FloatBetween(-0.4, 0.4);
        this.velocity.set(Math.cos(this.heading), Math.sin(this.heading)).scale(B.wanderSpeed);
        this.state = 'wander';
        this.setVisible(true);
    }

    fly (dt)
    {
        this.x += this.velocity.x * dt;
        this.y += this.velocity.y * dt;
    }

    // How long Pusheen has held still, and whether she moved this frame.
    watchPusheen (dt, pusheen)
    {
        this.pusheenMoved = this.lastPusheenX !== null &&
            Math.hypot(pusheen.x - this.lastPusheenX, pusheen.y - this.lastPusheenY) > STILL_EPS;
        this.lastPusheenX = pusheen.x;
        this.lastPusheenY = pusheen.y;
        this.pusheenStill = this.pusheenMoved ? 0 : this.pusheenStill + dt;
    }

    // ---- wandering --------------------------------------------------------

    // Wander + Pusheen avoidance + boundary, blended (never a switch between
    // them) into one desired velocity, then eased toward.
    steer (dt, t, pusheen)
    {
        const desired = this.wanderVector(dt, t, B.wanderWeight)
            .add(this.avoidanceForce(pusheen))
            .add(this.boundaryForce());

        // The wander heading follows wherever the other forces turn her. Left
        // independent, a wall could only push back against a wander that kept
        // pointing into it: the two balanced and she hovered, pinned, until the
        // heading's slow drift happened to swing it round -- ~20s in a corner.
        // Now a wall turns her instead, and she flies on in the new direction.
        const turn = PMath.Angle.Wrap(Math.atan2(desired.y, desired.x) - this.heading);
        this.heading += turn * (1 - Math.exp(-B.headingFollow * dt));

        this.easeToward(desired, dt);
    }

    // The wander heading itself drifts, slowly and at random -- broad lazy
    // curves, not a jittering path. sqrt(dt), not dt: this is a random walk,
    // and a walk's accumulated variance over real time only comes out
    // frame-rate independent if each step's noise scales with the SQUARE ROOT
    // of its own timestep (a step twice as long needs sqrt(2), not 2, times
    // the noise to contribute the same variance) -- scaling by dt itself
    // would make her turn more sluggishly on a slower machine.
    wanderVector (dt, t, weight)
    {
        this.heading += PMath.FloatBetween(-1, 1) * B.wanderTurnRate * Math.sqrt(dt);
        const speed = B.wanderSpeed + Math.sin(t * B.wanderRippleHz * TAU + this.ripplePhase) * B.wanderSpeedRipple;
        return new PMath.Vector2(Math.cos(this.heading), Math.sin(this.heading)).scale(speed * weight);
    }

    // `1 - exp(-rate * dt)` is frame-rate-independent: the same smoothing
    // regardless of the actual delta, unlike a flat-fraction lerp.
    easeToward (desired, dt)
    {
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
    // Blended with the wander rather than replacing it, so she curves off her
    // existing heading instead of snapping to face directly away.
    avoidanceForce (pusheen)
    {
        const dx = this.x - pusheen.x;
        const dy = this.y - pusheen.y;
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

        if (this.x < left + m) f.x += (left + m - this.x) / m;
        if (this.x > right - m) f.x -= (this.x - (right - m)) / m;
        if (this.y < top + m) f.y += (top + m - this.y) / m;
        if (this.y > bottom - m) f.y -= (this.y - (bottom - m)) / m;

        return f.scale(B.boundaryForce * B.maxSpeed);
    }

    // ---- landing on Pusheen -----------------------------------------------

    // Every few seconds, and only if she's been still a while with her head in
    // range, roll for it. Never "stand near it and it lands".
    considerLanding (dt, pusheen)
    {
        this.landCooldown -= dt;
        this.landCheckIn -= dt;
        if (this.landCheckIn > 0) {
            return;
        }
        this.landCheckIn = randRange(B.landCheckMs) / 1000;

        if (this.landCooldown > 0 || this.pusheenStill < B.stillMs / 1000) {
            return;
        }
        const head = pusheen.getHeadTop();
        if (Math.hypot(head.x - this.x, head.y - this.y) > B.landRange || Math.random() >= B.landChance) {
            return;
        }

        this.state = 'approach';
        this.approachTime = 0;
        this.approachSide = Math.sign(this.x - head.x) || 1;
    }

    // Her usual flight with the shyness off and a pull toward a point above
    // and beside the head (on the side she's already on). No soft walls: her
    // head sits below the wander bounds, and that's where she's going.
    // Pusheen moving spooks her back to plain wandering.
    steerApproach (dt, t, pusheen)
    {
        this.approachTime += dt;
        if (this.pusheenMoved || this.approachTime > B.approachGiveUpMs / 1000) {
            this.giveUpLanding();
            return;
        }

        const head = pusheen.getHeadTop();
        const dx = head.x + this.approachSide * B.approachOffset.x - this.x;
        const dy = head.y + B.approachOffset.y - this.y;
        const dist = Math.hypot(dx, dy);
        if (dist < B.approachArrivePx) {
            this.startLanding(pusheen);
            return;
        }

        const seek = new PMath.Vector2(dx / dist, dy / dist).scale(B.approachSpeed);
        this.easeToward(this.wanderVector(dt, t, B.approachWanderWeight).add(seek), dt);
    }

    giveUpLanding ()
    {
        this.state = 'wander';
        this.landCooldown = randRange(B.landCooldownMs) / 1000;
    }

    // The last stretch is a short scripted curve rather than more steering:
    // it leaves her current position along her momentum, and drops onto the
    // head from just above and beside it. Its end tracks the head each frame
    // (followLanding), so she lands on her breathing, not where it was.
    startLanding (pusheen)
    {
        this.state = 'land';
        this.stopFloat();

        const end = this.perchPoint(pusheen);
        this.landCurve = new Curves.CubicBezier(
            new PMath.Vector2(this.x, this.y),
            new PMath.Vector2(this.x + this.velocity.x * 0.6, this.y + this.velocity.y * 0.6),
            new PMath.Vector2(end.x + this.approachSide * 30, end.y - 45),
            new PMath.Vector2(end.x, end.y)
        );
        this.velocity.set(0, 0);
        this.landT = 0;
        this.landTween = this.scene.tweens.addCounter({
            from: 0,
            to: 1,
            duration: B.landMs,
            ease: 'Sine.easeInOut',
            onUpdate: (tween) => { this.landT = tween.getValue(); },
            onComplete: () => {
                this.landTween = null;
                if (this.state === 'land') {
                    this.state = 'perched';
                    this.perchTimer = randRange(B.perchMs) / 1000;
                    this.takeoffIn = null;
                    // Pick the slow perched flap up from wherever the wings are.
                    this.flapPhase = Math.asin(PMath.Clamp(this.wingOpen, 0, 1));
                }
            }
        });
    }

    followLanding (pusheen)
    {
        if (this.pusheenMoved) {
            this.takeOff();
            return;
        }
        const end = this.perchPoint(pusheen);
        this.landCurve.p3.set(end.x, end.y);
        this.landCurve.getPoint(this.landT, this.curvePoint);
        this.setPosition(this.curvePoint.x, this.curvePoint.y);
    }

    // Sits on her head -- tracked each frame, not parented to her, so her
    // squash tweens never squash the butterfly too. Her moving, or the perch
    // running out, sends her off after a beat.
    perch (dt, pusheen)
    {
        const p = this.perchPoint(pusheen);
        this.setPosition(p.x, p.y);

        if (this.takeoffIn === null) {
            this.perchTimer -= dt;
            if (this.pusheenMoved || this.perchTimer <= 0) {
                this.takeoffIn = randRange(B.takeoffReactMs) / 1000;
            }
        } else {
            this.takeoffIn -= dt;
            if (this.takeoffIn <= 0) {
                this.takeOff();
            }
        }
    }

    perchPoint (pusheen)
    {
        const head = pusheen.getHeadTop();
        return { x: head.x, y: head.y - B.perchLift };
    }

    // Up and away on the side she came in from, flapping, back to wandering
    // (the avoidance takes over from there if Pusheen is still close).
    takeOff ()
    {
        if (this.landTween) {
            this.landTween.stop();
            this.landTween = null;
        }
        this.state = 'wander';
        this.landCooldown = randRange(B.landCooldownMs) / 1000;

        this.heading = Math.atan2(-1, this.approachSide * 0.6);
        this.velocity.set(Math.cos(this.heading), Math.sin(this.heading)).scale(B.takeoffSpeed);
        this.flapBurst = true;
        this.flapTimer = randRange(B.flapBurstMs) / 1000;
        this.startFloat();
    }

    // ---- presentation -----------------------------------------------------

    // The bob/sway float (golden rule 1: idle bob is a tween). Each half-swing
    // is its own tween, re-rolled in size and length as it starts, and the
    // two run on unrelated timings, so the float never falls into a visible
    // rhythm.
    startFloat ()
    {
        this.floating = false;
        this.scene.tweens.killTweensOf(this.rig);
        this.floating = true;
        this.swing('y', B.bobAmplitude, B.bobHalfMs, 1);
        this.swing('x', B.swayAmplitude, B.swayHalfMs, 1);
    }

    swing (prop, amplitude, halfMs, sign)
    {
        const j = B.floatJitter;
        this.scene.tweens.add({
            targets: this.rig,
            [prop]: sign * amplitude * PMath.FloatBetween(1 - j, 1),
            duration: halfMs * PMath.FloatBetween(1 - j, 1 + j),
            ease: 'Sine.easeInOut',
            onComplete: () => {
                if (this.floating) {
                    this.swing(prop, amplitude, halfMs, -sign);
                }
            }
        });
    }

    // Coming in to land, the float stops and the art eases back to rest.
    stopFloat ()
    {
        this.floating = false;
        this.scene.tweens.killTweensOf(this.rig);
        this.scene.tweens.add({ targets: this.rig, x: 0, y: 0, duration: SETTLE_MS, ease: 'Sine.easeOut' });
    }

    // Bursts of flapping alternate with gliding pauses (both durations
    // randomised within their range) -- a continuously vibrating butterfly
    // reads as an effect, not an animal. Speed nudges the flap rate up a
    // little; avoidance never spikes it into "frantic" -- shy, not scared.
    // Perched, no bursts: one slow, steady open-and-close until take-off.
    updateWings (dt)
    {
        const speedRatio = PMath.Clamp(this.velocity.length() / B.maxSpeed, 0, 1);
        const flapSpeed = B.flapSpeed + speedRatio * B.flapSpeedFromSpeed;

        this.flapTimer -= dt;
        if (this.flapTimer <= 0) {
            this.flapBurst = !this.flapBurst;
            this.flapTimer = randRange(this.flapBurst ? B.flapBurstMs : B.flapGlideMs) / 1000;
        }

        if (this.state === 'perched') {
            this.flapPhase += B.perchFlapSpeed * dt;
            this.wingOpen = Math.abs(Math.sin(this.flapPhase));
        } else if (this.flapBurst) {
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
    // Level while landing and perched.
    updateTilt (dt)
    {
        const flying = this.state === 'wander' || this.state === 'approach';
        const target = flying ? PMath.Clamp(this.velocity.x * B.tiltPerSpeed, -B.maxTiltRad, B.maxTiltRad) : 0;
        this.rig.rotation += (target - this.rig.rotation) * Math.min(1, dt * 4);
    }
}
