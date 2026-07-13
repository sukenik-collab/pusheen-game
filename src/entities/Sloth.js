import { GameObjects, Geom } from 'phaser';
import { SLOTH, SLOTH_RADAR } from '../config/feel.js';

const SPARKLE_COLOR = '#fff3b0';
const BUBBLE_OFFSET_Y = -96;

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
        this.groundY = groundTop - 50;   // standing centre, feet on the floor

        // Already awake if the juice was delivered earlier this run (revisit):
        // he's dropped off the branch and ambled clear -- no sleeping bob, no
        // wake-beat replay.
        this.awake = !!scene.registry.get('juice:delivered');
        if (this.awake) {
            this.setPosition(x + SLOTH.amblePx, this.groundY);
        }

        this.visual = scene.add.image(0, 0, this.awake ? 'slothAwake' : 'sloth');
        this.add(this.visual);

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

        this.outerZone = new Geom.Circle(this.x, this.y, SLOTH_RADAR.sniffRadius);
        this.innerZone = new Geom.Circle(this.x, this.y, SLOTH_RADAR.interactRadius);
        this.inOuterZone = false;
        this.inInnerZone = false;
    }

    update (pusheen)
    {
        const nowOuter = Geom.Circle.Contains(this.outerZone, pusheen.x, pusheen.y);
        this.inInnerZone = Geom.Circle.Contains(this.innerZone, pusheen.x, pusheen.y);

        if (nowOuter && !this.inOuterZone) {
            this.playCue();
        }

        this.inOuterZone = nowOuter;
    }

    // No re-entry mid wake-beat (the scene also freezes update() while busy).
    isActionable ()
    {
        return !this.busy;
    }

    playCue ()
    {
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
    playWakeBeat ()
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
        this.visual.setTexture('slothAwake');
        this.showBubble(ACCEPT);
        this.audio?.play('collect');

        // A big volume-conserving yawn, then drop off the branch to the ground
        // and amble clear -- which reveals the hidden door behind where he hung.
        this.scene.tweens.add({
            targets: this.visual,
            scaleX: SLOTH.yawnScaleX,
            scaleY: SLOTH.yawnScaleY,
            duration: SLOTH.yawnMs,
            yoyo: true,
            ease: 'Sine.easeInOut',
            onComplete: () => {
                this.scene.tweens.add({
                    targets: this,
                    y: this.groundY,
                    duration: SLOTH.dropMs,
                    ease: 'Bounce.easeOut'
                });
                this.scene.tweens.add({
                    targets: this,
                    x: this.x + SLOTH.amblePx,
                    delay: SLOTH.dropMs,
                    duration: SLOTH.ambleMs,
                    ease: 'Sine.easeInOut',
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
        });

        for (let i = 0; i < SLOTH.sparkleCount; i++) {
            this.scene.time.delayedCall(i * SLOTH.sparkleStaggerMs, () => {
                this.spawnSparkle((Math.random() * 2 - 1) * 40);
            });
        }
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
