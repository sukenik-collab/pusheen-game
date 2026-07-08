import { GameObjects } from 'phaser';
import { CUSHION_SQUASH } from '../config/feel.js';

const WIDTH = 140;
const HEIGHT = 34;
const COLOR = 0xc48a5a;

export const CUSHION_WIDTH = WIDTH;
export const CUSHION_HEIGHT = HEIGHT;

export class Cushion extends GameObjects.Container
{
    constructor (scene, x, y)
    {
        super(scene, x, y);
        scene.add.existing(this);
        scene.physics.add.existing(this, true);

        this.visual = scene.add.rectangle(0, 0, WIDTH, HEIGHT, COLOR);
        this.add(this.visual);

        // Static bodies derive their position from the game object's render
        // bounds (getTopLeft(), etc.), which Container doesn't implement --
        // setOffset()/reset()/updateFromGameObject() all throw or silently
        // leave a stale position. Set the body rect directly instead; it
        // never needs to move again since this body is static.
        this.body.setSize(WIDTH, HEIGHT);
        this.body.position.set(x - WIDTH / 2, y - HEIGHT / 2);

        this.wasContacted = false;
    }

    checkContact (pusheenBody)
    {
        const contacting = pusheenBody.touching.down && this.body.touching.up;

        if (contacting && !this.wasContacted) {
            this.playSquash();
        }

        this.wasContacted = contacting;
    }

    playSquash ()
    {
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
