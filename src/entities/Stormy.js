import { GameObjects, Geom } from 'phaser';
import { IDLE, STORMY, STORMY_RADAR } from '../config/feel.js';
import { YARN_IDS } from '../config/gameState.js';

// The sitting-up sprite is 108x118. She's anchored by her feet, not her
// center: the origin sits at the body's baseline (~y92) so she plants on the
// floor while the fluffy tail (lower in the art) spills below the floor line
// for a little depth. Offsets below are measured up from that planted origin.
const SPRITE_W = 108;
const SPRITE_H = 118;
const BODY_BASELINE_Y = 92;      // feet, in sprite pixels
const BODY_CENTER_X = 46;        // body midline, in sprite pixels
const BODY_MID_DY = 42;          // body center, above the planted origin
const HEAD_TOP_DY = 90;          // above the origin -- where cue hearts rise

const HEART_COLOR = '#f8bbd0';
const BUBBLE_OFFSET_Y = -104;

// Quest copy, keyed by how many yarn balls are found so far.
const HINTS = [
    'I can\'t find my yarn!\nI lost 3 balls somewhere...',
    'You found one!\n2 more to go...',
    'Ooh, two already!\nJust 1 left...'
];
const THANKS = 'You\'re the best, Pusheen! ♥';
const CELEBRATE = 'My yarn!! Thank you!!';

// The friend NPC with the one quest. Same concentric sensor-zone pattern as
// the cabinet: outer zone floats a heart cue as you get near, inner zone
// enables talking to her.
export class Stormy extends GameObjects.Container
{
    constructor (scene, x, groundTop)
    {
        super(scene, x, groundTop);
        scene.add.existing(this);

        this.audio = scene.registry.get('audio');

        // Sad while the yarn is lost; if the quest was already finished this
        // run (she's revisited), she's already happy.
        const face = scene.registry.get('quest:complete') ? 'stormyHappy' : 'stormySad';
        this.visual = scene.add.image(0, 0, face)
            .setOrigin(BODY_CENTER_X / SPRITE_W, BODY_BASELINE_Y / SPRITE_H);
        this.add(this.visual);

        // Idle breathing, same as Pusheen's.
        this.breatheTween = scene.tweens.add({
            targets: this.visual,
            scaleX: 1 + IDLE.breatheScale,
            scaleY: 1 - IDLE.breatheScale * 0.5,
            y: -IDLE.bobPx,
            duration: IDLE.breatheMs,
            yoyo: true,
            repeat: -1,
            ease: 'Sine.easeInOut'
        });

        this.bubble = scene.add.text(0, BUBBLE_OFFSET_Y, '', {
            fontSize: '18px',
            color: '#3e2c23',
            backgroundColor: '#fffaf0',
            align: 'center',
            padding: { x: 12, y: 8 }
        }).setOrigin(0.5, 1).setAlpha(0).setVisible(false);
        this.add(this.bubble);
        this.bubbleHideTimer = null;

        const zoneY = this.y - BODY_MID_DY;
        this.outerZone = new Geom.Circle(x, zoneY, STORMY_RADAR.sniffRadius);
        this.innerZone = new Geom.Circle(x, zoneY, STORMY_RADAR.interactRadius);
        this.inOuterZone = false;
        this.inInnerZone = false;
    }

    update (pusheen)
    {
        const nowOuter = Geom.Circle.Contains(this.outerZone, pusheen.x, pusheen.y);
        this.inInnerZone = Geom.Circle.Contains(this.innerZone, pusheen.x, pusheen.y);

        if (nowOuter && !this.inOuterZone) {
            this.playHeartCue();
        }

        this.inOuterZone = nowOuter;
    }

    // She notices you: a little flutter of hearts, once per approach.
    playHeartCue ()
    {
        for (let i = 0; i < 3; i++) {
            this.scene.time.delayedCall(i * STORMY.heartStaggerMs, () => this.spawnHeart(0));
        }
    }

    interact ()
    {
        const registry = this.scene.registry;
        const count = registry.get('yarn:count');

        if (registry.get('quest:complete')) {
            this.showBubble(THANKS);
        } else if (count >= YARN_IDS.length) {
            this.celebrate();
        } else {
            this.showBubble(HINTS[count]);
        }
    }

    // All the yarn is back: a happy hop-hop-hop with a burst of hearts.
    // Purely a reaction -- no reward object, no state beyond quest:complete.
    celebrate ()
    {
        this.scene.registry.set('quest:complete', true);
        this.visual.setTexture('stormyHappy');
        this.audio?.play('collect');
        this.showBubble(CELEBRATE);

        this.scene.tweens.add({
            targets: this,
            y: this.y - STORMY.hopPx,
            duration: STORMY.hopMs,
            yoyo: true,
            repeat: STORMY.hopCount - 1,
            ease: 'Quad.easeOut'
        });

        for (let i = 0; i < STORMY.heartCount; i++) {
            this.scene.time.delayedCall(i * STORMY.heartStaggerMs, () => {
                this.spawnHeart((Math.random() * 2 - 1) * 40);
            });
        }
    }

    spawnHeart (offsetX)
    {
        const heart = this.scene.add.text(this.x + offsetX, this.y - HEAD_TOP_DY, '♥', {
            fontSize: '24px',
            color: HEART_COLOR
        }).setOrigin(0.5);

        this.scene.tweens.add({
            targets: heart,
            y: heart.y - STORMY.heartRisePx,
            alpha: 0,
            duration: STORMY.heartMs,
            ease: 'Quad.easeOut',
            onComplete: () => heart.destroy()
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

        this.bubbleHideTimer = this.scene.time.delayedCall(STORMY.bubbleHoldMs, () => {
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
