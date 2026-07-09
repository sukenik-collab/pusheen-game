import { GameObjects } from 'phaser';
import { MOVE, JUMP, LAND_SQUASH, IDLE, SNIFF_REACT, NAP } from '../config/feel.js';

// The physics footprint. The sprite itself is pre-cropped and pre-scaled
// (see the asset-prep step) to already match this at its native pixel size,
// so scale 1.0 == correct size -- every tween below assigns *absolute*
// scaleX/scaleY, and two methods reset via setScale(1, 1), so any sizing
// done here instead (setDisplaySize/setScale) would get silently blown
// away by the first squash/sniff animation.
const WIDTH = 110;
const HEIGHT = 78;

export class Pusheen extends GameObjects.Container
{
    constructor (scene, x, y)
    {
        super(scene, x, y);
        scene.add.existing(this);
        scene.physics.add.existing(this);

        this.visual = scene.add.image(0, 0, 'pusheen');
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
            duration: IDLE.breatheMs,
            yoyo: true,
            repeat: -1,
            ease: 'Sine.easeInOut'
        });
    }

    moveLeft ()
    {
        this.body.setAccelerationX(-MOVE.accel);
        this.visual.setFlipX(false);
    }

    moveRight ()
    {
        this.body.setAccelerationX(MOVE.accel);
        this.visual.setFlipX(true);
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

    isGrounded ()
    {
        return this.body.blocked.down || this.body.touching.down;
    }

    update ()
    {
        const grounded = this.isGrounded();

        if (grounded && !this.wasGrounded) {
            this.playLandSquash();
        }

        this.wasGrounded = grounded;
    }

    playSniffReact ()
    {
        this.breatheTween.pause();
        this.visual.setScale(1, 1);
        this.visual.y = 0;

        this.scene.tweens.add({
            targets: this.visual,
            scaleY: SNIFF_REACT.scaleY,
            scaleX: SNIFF_REACT.scaleX,
            duration: SNIFF_REACT.ms,
            yoyo: true,
            ease: 'Sine.easeInOut',
            onComplete: () => this.breatheTween.resume()
        });
    }

    // The nap payoff's curl-up beat. Deliberately does not resume the
    // breathe tween afterward -- she stays curled and still for the "So
    // Cozy!" beat rather than snapping back toward its scale-1 target.
    playCurlUp (onComplete)
    {
        this.breatheTween.pause();

        this.scene.tweens.add({
            targets: this.visual,
            scaleX: NAP.curlScale,
            scaleY: NAP.curlScale,
            angle: NAP.curlAngle,
            duration: NAP.curlMs,
            ease: 'Sine.easeInOut',
            onComplete
        });
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
