import { GameObjects } from 'phaser';
import { CUSHION_SQUASH } from '../config/feel.js';

// A soft spot on the bed. Unlike the couch cushion it has no body -- she
// stands on the bed itself -- so it isn't a landing platform; it just gives
// the same volume-conserving squish when she settles onto it, so the bed
// reads as plush rather than a plank.
export class Pillow extends GameObjects.Container
{
    constructor (scene, x, y)
    {
        super(scene, x, y);
        scene.add.existing(this);

        this.visual = scene.add.image(0, 0, 'pillow');
        this.add(this.visual);

        this.audio = scene.registry.get('audio');

        this.halfW = this.visual.width / 2;
        this.wasResting = false;
    }

    // Squash once when she comes to rest on the bed above the pillow, not
    // every frame she stands there. The height check keeps a hop across the
    // floor below the bed from triggering it -- resting *on the bed* puts her
    // center above the pillow's.
    update (pusheen)
    {
        const resting = pusheen.isGrounded() &&
            Math.abs(pusheen.x - this.x) <= this.halfW + 24 &&
            pusheen.y < this.y;

        if (resting && !this.wasResting) {
            this.playSquash();
        }

        this.wasResting = resting;
    }

    playSquash ()
    {
        this.audio?.play('squish');

        this.scene.tweens.add({
            targets: this.visual,
            scaleY: CUSHION_SQUASH.scaleY,
            scaleX: CUSHION_SQUASH.scaleX,
            duration: CUSHION_SQUASH.ms,
            yoyo: true,
            ease: 'Quad.easeOut'
        });
    }
}
