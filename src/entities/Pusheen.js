import { GameObjects } from 'phaser';
import { MOVE, JUMP, LAND_SQUASH, IDLE, SNIFF_REACT, NAP, COSTUME, CARRY } from '../config/feel.js';
import { subscribeRegistry } from '../systems/registryHelpers.js';

// The held-item accessory texture per held:item value. 'none' -> no accessory.
const HELD_SPRITE = { glass: 'glass', juice: 'orangeJuice' };

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

        this.audio = scene.registry.get('audio');

        this.body.setSize(WIDTH, HEIGHT);
        this.body.setOffset(-WIDTH / 2, -HEIGHT / 2);
        this.body.setGravityY(JUMP.gravity);
        this.body.setDragX(MOVE.drag);
        this.body.setMaxVelocity(MOVE.maxSpeed, 2000);
        this.body.setCollideWorldBounds(true);

        this.wasGrounded = false;

        // A composable multiplier on whatever the current jump is -- the seam
        // for v2's held item, which scales jump height while carrying. Stays 1
        // in v1.5 (no behavior change). Independent of the costume: see
        // resolveJumpVelocity().
        this.jumpVelocityMultiplier = 1;

        // Costume persists across rooms via the registry (reset by Play
        // again), so a freshly-created Pusheen re-applies it herself.
        this.costumed = false;
        if (scene.registry.get('costume:pusheencorn')) {
            this.setCostume(true);
        }

        // Held item persists across rooms the same way -- and because Pusheen
        // is reconstructed every room (which resets jumpVelocityMultiplier to
        // 1), the constructor must re-derive BOTH the accessory sprite AND the
        // carry multiplier from held:item, or the heavier carry-jump silently
        // reverts on every door. A live subscription keeps it in sync when the
        // item changes mid-room (pick up glass, fill juice, give to Sloth).
        this.facing = 'left';           // matches the un-flipped visual
        this.heldVisual = null;
        this.applyHeldItem(scene.registry.get('held:item') ?? 'none');
        subscribeRegistry(scene, 'held:item', (parent, value) => this.applyHeldItem(value));

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
        this.setFacing('left');
    }

    moveRight ()
    {
        this.body.setAccelerationX(MOVE.accel);
        this.setFacing('right');
    }

    stopMoving ()
    {
        this.body.setAccelerationX(0);
    }

    // Facing is stored on the visual (flipX), not the container -- so a
    // container-child accessory does NOT turn with her for free. This flips
    // the visual AND mirrors the accessory's x-offset so a carried item stays
    // in front of her travel direction.
    setFacing (dir)
    {
        this.facing = dir;
        this.visual.setFlipX(dir === 'right');
        this.positionHeldVisual();
    }

    positionHeldVisual ()
    {
        if (this.heldVisual) {
            this.heldVisual.x = (this.facing === 'right' ? 1 : -1) * CARRY.offset.x;
        }
    }

    // Re-derive the carry accessory + jump multiplier from held:item. Called
    // from the constructor (every room) and live on held:item changes.
    applyHeldItem (item)
    {
        if (this.heldVisual) {
            this.heldVisual.destroy();
            this.heldVisual = null;
        }

        const sprite = HELD_SPRITE[item];
        if (sprite) {
            this.heldVisual = this.scene.add.image(0, CARRY.offset.y, sprite).setScale(0.6);
            this.add(this.heldVisual);
            this.positionHeldVisual();
            this.jumpVelocityMultiplier = CARRY.jumpMultiplier;
        } else {
            this.jumpVelocityMultiplier = 1;
        }
    }

    // Costume = an absolute swap of the base jump (velocity + gravity); the
    // held-item multiplier (v2) then scales whatever that base is. Two
    // independent systems that only compose here, at jump time -- neither reads
    // the other. Multiplier is 1 in v1.5, so this is exactly the old value.
    resolveJumpVelocity ()
    {
        const base = this.costumed ? COSTUME.jumpVelocity : JUMP.velocity;
        return base * this.jumpVelocityMultiplier;
    }

    jump ()
    {
        if (this.body.blocked.down || this.body.touching.down) {
            this.body.setVelocityY(this.resolveJumpVelocity());
            this.audio?.play('jump');
        }
    }

    // The Pusheencorn costume's one ability: a floatier, taller jump
    // (lower gravity + stronger impulse). The look is the whole sprite: swap
    // in the pusheencorn art (horn, mane, rainbow tail baked in), which is
    // registered the same as the base sprite so every squash/idle tween on
    // this.visual keeps working unchanged.
    setCostume (on)
    {
        this.costumed = on;
        this.scene.registry.set('costume:pusheencorn', on);

        this.body.setGravityY(on ? COSTUME.gravity : JUMP.gravity);
        this.visual.setTexture(on ? 'pusheencorn' : 'pusheen');
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
        this.audio?.play('sigh');

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
        this.audio?.play('land');

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
