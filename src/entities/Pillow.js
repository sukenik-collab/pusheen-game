import { GameObjects } from 'phaser';
import { CUSHION_SQUASH } from '../config/feel.js';

const WIDTH = 90;
const HEIGHT = 26;

export const PILLOW_HEIGHT = HEIGHT;

// A plush pillow: a small raised step resting on the bed's mattress that she
// hops onto. It has a solid static body (so she lands on top instead of
// clipping through), and it squishes on contact -- the same volume-conserving
// squash as the couch cushion, so the bed reads as soft.
export class Pillow extends GameObjects.Container
{
    constructor (scene, x, y)
    {
        super(scene, x, y);
        scene.add.existing(this);
        scene.physics.add.existing(this, true);

        this.visual = scene.add.image(0, 0, 'pillow');
        this.add(this.visual);

        this.audio = scene.registry.get('audio');

        // Static bodies derive their position from the game object's render
        // bounds, which a Container doesn't implement -- set the body rect
        // directly, same as Cushion. It never needs to move again.
        this.body.setSize(WIDTH, HEIGHT);
        this.body.position.set(x - WIDTH / 2, y - HEIGHT / 2);

        this.touchedThisStep = false;
        this.wasContacted = false;
    }

    // Fired from the pusheen<->pillow collider callback -- only on steps where
    // Arcade Physics detects a fresh overlap for this exact pair.
    onCollide ()
    {
        this.touchedThisStep = true;
    }

    // Called once per frame after the physics step, so onCollide() has already
    // fired if it was going to. Squash once when she first lands, not every
    // frame she rests here.
    resolveContact ()
    {
        if (this.touchedThisStep && !this.wasContacted) {
            this.playSquash();
        }

        this.wasContacted = this.touchedThisStep;
        this.touchedThisStep = false;
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
