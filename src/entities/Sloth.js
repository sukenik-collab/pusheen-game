import { GameObjects, Geom } from 'phaser';
import { SLOTH, SLOTH_RADAR } from '../config/feel.js';

const SPARKLE_COLOR = '#fff3b0';
const BUBBLE_OFFSET_Y = -125;

// Hanging, his origin is up at the branch while his body drapes below it, so
// the sensor circles centred there would only reach Pusheen in a narrow slot
// directly underneath. Drop them to his hanging body's mass instead -- the
// Stormy.js BODY_MID_DY precedent -- rather than inflating the radii, which
// would eat the lead margin between the sniff and interact rings. Once he's
// down and sitting, his origin is already at body height and the offset goes.
const HANG_ZONE_DY = 58;

// All three poses are pre-cropped to their display size (the same convention as
// Pusheen's sprite), so they swap in at scale 1. The art still lives in a
// wrapper container so the squash/yawn tweens stay 1.0-based on the wrapper and
// are unaffected by a pose swap underneath them.
const POSE_HANGING = { texture: 'slothHanging', scale: 1 };
const POSE_STANDING = { texture: 'slothAwake', scale: 1 };
const POSE_SITTING = { texture: 'slothSitting', scale: 1 };

// Flag-branched dialogue (mirrors Stormy's quest:complete pattern -- not a
// named-dialogue-state engine, which is deferred).
const ASK = 'mmm... so thirsty...\ncould you fetch me some juice?';
const REMIND = 'mmf... still\nso thirsty...';
const ACCEPT = 'aah... so refreshing!\nthank you ♥';
const THANKS = 'so cozy now...\nthanks, Pusheen ♥';

// The sleepy friend dozing in the hammock. Same concentric sensor-zone pattern
// as Stormy: outer zone floats a lead cue, inner zone enables talking. Two
// visible states (asleep / awake) driven by juice:delivered. Bringing her the
// juice runs a one-time wake beat -- a modal tween sequence that freezes scene
// input while it plays (the scene returns early from update() while `busy`,
// mirroring CostumeBox).
export class Sloth extends GameObjects.Container
{
    constructor (scene, x, groundTop)
    {
        super(scene, x, groundTop - SLOTH.restHeight);
        scene.add.existing(this);

        this.audio = scene.registry.get('audio');
        this.verb = 'talk';
        this.busy = false;
        this.groundTop = groundTop;

        // Real sloth art, in a wrapper so the squash/yawn tweens stay 1.0-based
        // on the wrapper while the pose underneath swaps.
        this.art = scene.add.image(0, 0, POSE_HANGING.texture).setScale(POSE_HANGING.scale);
        this.visual = scene.add.container(0, 0);
        this.visual.add(this.art);
        this.add(this.visual);

        // Already awake if the juice was delivered earlier this run (revisit):
        // he dropped off the branch, plodded clear and sat down -- so he's
        // found sitting where he settled, with no bob and no wake-beat replay.
        this.awake = !!scene.registry.get('juice:delivered');
        if (this.awake) {
            this.usePose(POSE_SITTING);
            this.setPosition(x - SLOTH.amblePx, this.restingY());
        }

        // A slow sleeping bob while she dozes -- paused for good once she wakes.
        if (!this.awake) {
            this.breatheTween = scene.tweens.add({
                targets: this.visual,
                y: -3,
                scaleY: 0.98,
                duration: 1800,
                yoyo: true,
                repeat: -1,
                ease: 'Sine.easeInOut'
            });
        }

        this.bubble = scene.add.text(0, BUBBLE_OFFSET_Y, '', {
            fontSize: '18px',
            color: '#3e2c23',
            backgroundColor: '#fffaf0',
            align: 'center',
            padding: { x: 12, y: 8 }
        }).setOrigin(0.5, 1).setAlpha(0).setVisible(false);
        this.add(this.bubble);
        this.bubbleHideTimer = null;

        const zoneY = this.y + (this.awake ? 0 : HANG_ZONE_DY);
        this.outerZone = new Geom.Circle(this.x, zoneY, SLOTH_RADAR.sniffRadius);
        this.innerZone = new Geom.Circle(this.x, zoneY, SLOTH_RADAR.interactRadius);
        this.inOuterZone = false;
        this.inInnerZone = false;
    }

    update (pusheen)
    {
        const nowOuter = Geom.Circle.Contains(this.outerZone, pusheen.x, pusheen.y);
        this.inInnerZone = Geom.Circle.Contains(this.innerZone, pusheen.x, pusheen.y);

        if (nowOuter && !this.inOuterZone) {
            this.playCue(pusheen);
        }

        this.inOuterZone = nowOuter;
    }

    // No re-entry mid wake-beat (the scene also freezes update() while busy).
    isActionable ()
    {
        return !this.busy;
    }

    usePose (pose)
    {
        this.art.setTexture(pose.texture).setScale(pose.scale);
    }

    // Where his centre sits so the current pose's feet meet the floor. The
    // standing and sitting art are different heights, so this is read per pose
    // rather than kept as one constant.
    restingY ()
    {
        return this.groundTop - this.art.displayHeight / 2;
    }

    // Same approach language as everything else she walks up to -- a sniff and
    // her little sniff-react, not a silent shimmer.
    playCue (pusheen)
    {
        this.audio?.play('sniff');
        pusheen.playSniffReact();

        // Walking up holding the juice is the moment the whole errand was for
        // -- give that arrival a real flourish instead of the passing hello.
        if (!this.awake && this.scene.registry.get('held:item') === 'juice') {
            for (let i = 0; i < SLOTH.juiceCueCount; i++) {
                this.scene.time.delayedCall(i * SLOTH.juiceCueStaggerMs, () => {
                    this.spawnSparkle((Math.random() * 2 - 1) * 30);
                });
            }
            return;
        }

        this.spawnSparkle(0);
        this.spawnSparkle(-24);
        this.spawnSparkle(24);
    }

    interact ()
    {
        const registry = this.scene.registry;

        if (registry.get('juice:delivered')) {
            this.showBubble(THANKS);
        } else if (registry.get('held:item') === 'juice') {
            this.accept();
        } else if (registry.get('sloth:met')) {
            this.showBubble(REMIND);
        } else {
            registry.set('sloth:met', true);
            this.showBubble(ASK);
        }
    }

    // She takes the juice: clear the held item and flip the delivery flag. The
    // scene's bindReveal(juice:delivered) drives the wake beat + path reveal --
    // accept() just sets the flags.
    accept ()
    {
        this.scene.registry.set('held:item', 'none');
        this.scene.registry.set('juice:delivered', true);
    }

    // The one-time wake beat: yawn/stretch, hop off the hammock, amble a little
    // way clear, a burst of sparkles. Idempotent -- a no-op once she's awake
    // (so bindReveal firing immediately on room re-entry doesn't replay it).
    // `onDrop` fires the instant he lets go of the branch -- the scene uses it
    // to nudge Pusheen aside so the revealed gate isn't right under her feet.
    playWakeBeat (onDrop)
    {
        if (this.awake) {
            return;
        }
        this.awake = true;
        this.busy = true;
        // Hide the interact button under the beat -- the scene early-returns
        // while busy, so it won't recompute this until the beat ends.
        this.scene.registry.set('interact:available', false);

        this.breatheTween?.stop();
        this.visual.setScale(1, 1);
        this.visual.y = 0;
        this.showBubble(ACCEPT);
        this.audio?.play('collect');

        // A big volume-conserving yawn on the branch, then let go: stand up,
        // plod a few steps clear of the gate he was hiding, and flop down.
        this.scene.tweens.add({
            targets: this.visual,
            scaleX: SLOTH.yawnScaleX,
            scaleY: SLOTH.yawnScaleY,
            duration: SLOTH.yawnMs,
            yoyo: true,
            ease: 'Sine.easeInOut',
            onComplete: () => {
                onDrop?.();
                this.usePose(POSE_STANDING);
                this.scene.tweens.add({
                    targets: this,
                    y: this.restingY(),
                    duration: SLOTH.dropMs,
                    ease: 'Bounce.easeOut'
                });
                this.walkOff();
            }
        });

        for (let i = 0; i < SLOTH.sparkleCount; i++) {
            this.scene.time.delayedCall(i * SLOTH.sparkleStaggerMs, () => {
                this.spawnSparkle((Math.random() * 2 - 1) * 40);
            });
        }
    }

    // The plod. There's no walk-cycle art, so the steps are carried by a slow
    // side-to-side waddle over the travel tween -- which is the right register
    // for a sloth anyway: he is in no hurry.
    walkOff ()
    {
        this.waddleTween = this.scene.tweens.add({
            targets: this.visual,
            angle: { from: -SLOTH.waddleDeg, to: SLOTH.waddleDeg },
            duration: SLOTH.waddleMs,
            delay: SLOTH.dropMs,
            yoyo: true,
            repeat: -1,
            ease: 'Sine.easeInOut'
        });

        this.scene.tweens.add({
            targets: this,
            x: this.x - SLOTH.amblePx,
            delay: SLOTH.dropMs,
            duration: SLOTH.ambleMs,
            ease: 'Sine.easeInOut',
            onComplete: () => this.sitDown()
        });
    }

    // He arrives, settles onto his belly and stays there for the rest of the run.
    sitDown ()
    {
        this.waddleTween?.stop();
        this.visual.angle = 0;
        this.usePose(POSE_SITTING);
        this.y = this.restingY();
        this.audio?.play('sigh');

        this.scene.tweens.add({
            targets: this.visual,
            scaleY: SLOTH.sitSquashY,
            scaleX: SLOTH.sitSquashX,
            duration: SLOTH.sitMs,
            yoyo: true,
            ease: 'Quad.easeOut',
            onComplete: () => {
                // Move his sensor zones to where he settles, so a later
                // "thanks" chat works beside him -- not under the empty
                // branch he left.
                this.outerZone.setPosition(this.x, this.y);
                this.innerZone.setPosition(this.x, this.y);
                this.busy = false;
            }
        });
    }

    spawnSparkle (offsetX)
    {
        const sparkle = this.scene.add.text(this.x + offsetX, this.y - 30, '✦', {
            fontSize: '24px',
            color: SPARKLE_COLOR
        }).setOrigin(0.5);

        this.scene.tweens.add({
            targets: sparkle,
            y: sparkle.y - SLOTH.sparkleRisePx,
            alpha: 0,
            duration: SLOTH.sparkleMs,
            ease: 'Quad.easeOut',
            onComplete: () => sparkle.destroy()
        });
    }

    showBubble (text)
    {
        this.bubbleHideTimer?.remove();
        this.scene.tweens.killTweensOf(this.bubble);

        this.bubble.setText(text);
        this.bubble.setVisible(true);
        this.scene.tweens.add({
            targets: this.bubble,
            alpha: 1,
            duration: 180,
            ease: 'Sine.easeOut'
        });

        this.bubbleHideTimer = this.scene.time.delayedCall(SLOTH.bubbleHoldMs, () => {
            this.scene.tweens.add({
                targets: this.bubble,
                alpha: 0,
                duration: 300,
                ease: 'Sine.easeIn',
                onComplete: () => this.bubble.setVisible(false)
            });
        });
    }
}
