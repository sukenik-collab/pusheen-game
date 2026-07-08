import { GameObjects } from 'phaser';
import { MOVE, JUMP, LAND_SQUASH, IDLE } from '../config/feel.js';

const WIDTH = 110;
const HEIGHT = 78;
const COLOR = 0x9a9a9a;

export class Pusheen extends GameObjects.Container
{
    constructor (scene, x, y)
    {
        super(scene, x, y);
        scene.add.existing(this);
        scene.physics.add.existing(this);

        this.visual = scene.add.ellipse(0, 0, WIDTH, HEIGHT, COLOR);
        this.add(this.visual);

        this.body.setSize(WIDTH, HEIGHT);
        this.body.setOffset(-WIDTH / 2, -HEIGHT / 2);
        this.body.setGravityY(JUMP.gravity);
        this.body.setDragX(MOVE.drag);
        this.body.setMaxVelocity(MOVE.maxSpeed, 2000);
        this.body.setCollideWorldBounds(true);

        this.wasGrounded = false;

        this.breatheTween = scene.tweens.add({
            targets: this.visual,
            scaleX: 1 + IDLE.breatheScale,
            scaleY: 1 - IDLE.breatheScale * 0.5,
            y: -IDLE.bobPx,
            duration: 1400,
            yoyo: true,
            repeat: -1,
            ease: 'Sine.easeInOut'
        });
    }

    moveLeft ()
    {
        this.body.setAccelerationX(-MOVE.accel);
    }

    moveRight ()
    {
        this.body.setAccelerationX(MOVE.accel);
    }

    stopMoving ()
    {
        this.body.setAccelerationX(0);
    }

    jump ()
    {
        if (this.body.blocked.down || this.body.touching.down) {
            this.body.setVelocityY(JUMP.velocity);
        }
    }

    update ()
    {
        const grounded = this.body.blocked.down || this.body.touching.down;

        if (grounded && !this.wasGrounded) {
            this.playLandSquash();
        }

        this.wasGrounded = grounded;
    }

    playLandSquash ()
    {
        this.breatheTween.pause();
        this.visual.setScale(1, 1);
        this.visual.y = 0;

        this.scene.tweens.add({
            targets: this.visual,
            scaleY: LAND_SQUASH.scaleY,
            scaleX: LAND_SQUASH.scaleX,
            duration: LAND_SQUASH.downMs,
            ease: 'Quad.easeOut',
            onComplete: () => {
                this.scene.tweens.add({
                    targets: this.visual,
                    scaleY: 1,
                    scaleX: 1,
                    duration: LAND_SQUASH.upMs,
                    ease: LAND_SQUASH.upEase,
                    onComplete: () => this.breatheTween.resume()
                });
            }
        });
    }
}
