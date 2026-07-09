import { GameObjects } from 'phaser';
import { CUSHION_SQUASH } from '../config/feel.js';

const WIDTH = 140;
const HEIGHT = 34;

export const CUSHION_HEIGHT = HEIGHT;

export class Cushion extends GameObjects.Container
{
    constructor (scene, x, y)
    {
        super(scene, x, y);
        scene.add.existing(this);
        scene.physics.add.existing(this, true);

        this.visual = scene.add.image(0, 0, 'cushion');
        this.add(this.visual);

        this.audio = scene.registry.get('audio');

        // Static bodies derive their position from the game object's render
        // bounds (getTopLeft(), etc.), which Container doesn't implement --
        // setOffset()/reset()/updateFromGameObject() all throw or silently
        // leave a stale position. Set the body rect directly instead; it
        // never needs to move again since this body is static.
        this.body.setSize(WIDTH, HEIGHT);
        this.body.position.set(x - WIDTH / 2, y - HEIGHT / 2);

        this.touchedThisStep = false;
        this.wasContacted = false;
    }

    // Called from the pusheen<->cushion collider callback -- only fires on
    // steps where Arcade Physics actually detects a fresh overlap between
    // this exact pair. Don't use body.touching.up for this: static bodies
    // never get their touching flags reset each step (only dynamic bodies
    // do), so once true it stays stuck true forever, and "is pusheen on
    // the cushion" silently degrades into "is pusheen touching anything".
    onCollide ()
    {
        this.touchedThisStep = true;
    }

    // Called once per frame after the physics step has already run (and so
    // after onCollide() would have fired for this step, if it was going to).
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
