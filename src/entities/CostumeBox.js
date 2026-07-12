import { GameObjects, Geom } from 'phaser';
import { BOX_RADAR, COSTUME, SNIFF_CUE } from '../config/feel.js';

const WIDTH = 120;
const HEIGHT = 90;
// costume-box.png is 120x102: the box body is the lower 90px, the open
// flaps poke 12px above it, so the image rides 6px high of the body center.
const ART_OFFSET_Y = -6;
const CUE_COLOR = '#ffe9a8';

// The Pusheencorn box: a themed cardboard box she climbs into and pops out
// of in costume. Interacting again pops the costume back off. Same
// concentric-zone pattern as everything else; the whole climb-in/pop-out
// beat is tween-driven, physics only comes back for the landing.
export class CostumeBox extends GameObjects.Container
{
    constructor (scene, x, groundTop)
    {
        super(scene, x, groundTop - HEIGHT / 2);
        scene.add.existing(this);

        this.audio = scene.registry.get('audio');
        this.verb = 'peek';

        this.boxVisual = scene.add.image(0, ART_OFFSET_Y, 'costumeBox');
        this.add(this.boxVisual);

        this.outerZone = new Geom.Circle(x, this.y, BOX_RADAR.sniffRadius);
        this.innerZone = new Geom.Circle(x, this.y, BOX_RADAR.interactRadius);
        this.inOuterZone = false;
        this.inInnerZone = false;
        this.busy = false;
    }

    update (pusheen)
    {
        const nowOuter = Geom.Circle.Contains(this.outerZone, pusheen.x, pusheen.y);
        this.inInnerZone = Geom.Circle.Contains(this.innerZone, pusheen.x, pusheen.y);

        if (nowOuter && !this.inOuterZone) {
            this.playSparkleCue();
            pusheen.playSniffReact();
        }

        this.inOuterZone = nowOuter;
    }

    // Contract gate for the InteractionController: no re-entry mid-beat. (The
    // scene also freezes its whole update() while busy, so the controller
    // won't even run then -- this keeps the entity honest on its own.)
    isActionable ()
    {
        return !this.busy;
    }

    playSparkleCue ()
    {
        this.audio?.play('sniff');

        for (let i = 0; i < SNIFF_CUE.noteCount; i++) {
            this.scene.time.delayedCall(i * SNIFF_CUE.staggerMs, () => this.spawnSparkle());
        }
    }

    spawnSparkle ()
    {
        const sparkle = this.scene.add.text(this.x, this.y - HEIGHT / 2, '✦', {
            fontSize: '28px',
            color: CUE_COLOR
        }).setOrigin(0.5);

        this.scene.tweens.add({
            targets: sparkle,
            y: sparkle.y - SNIFF_CUE.risePx,
            alpha: 0,
            duration: SNIFF_CUE.ms,
            ease: 'Quad.easeOut',
            onComplete: () => sparkle.destroy()
        });
    }

    // Climb in -> box wobbles -> pop out transformed (or back to normal).
    // The scene freezes player input while busy; physics is off for the
    // whole beat so the tweens own her completely, then the body comes
    // back and she drops to the ground with her usual land squash.
    interact (pusheen)
    {
        if (this.busy) {
            return;
        }

        this.busy = true;
        pusheen.stopMoving();
        pusheen.body.setVelocity(0, 0);
        pusheen.body.enable = false;
        this.audio?.play('peek');

        // hop in: shrink toward the box mouth
        this.scene.tweens.add({
            targets: pusheen,
            x: this.x,
            y: this.y - HEIGHT / 2,
            scaleX: 0.15,
            scaleY: 0.15,
            duration: COSTUME.hopInMs,
            ease: 'Quad.easeIn',
            onComplete: () => this.rummage(pusheen)
        });
    }

    rummage (pusheen)
    {
        pusheen.setVisible(false);
        this.audio?.play('squish');

        // the box wiggles while she rummages inside
        this.scene.tweens.add({
            targets: this.boxVisual,
            angle: COSTUME.wobbleDeg,
            duration: COSTUME.wobbleMs,
            yoyo: true,
            repeat: 3,
            ease: 'Sine.easeInOut',
            onComplete: () => { this.boxVisual.angle = 0; }
        });

        this.scene.time.delayedCall(COSTUME.holdMs, () => this.popOut(pusheen));
    }

    popOut (pusheen)
    {
        pusheen.setCostume(!pusheen.costumed);
        pusheen.setVisible(true);
        this.audio?.play('jump');

        for (let i = 0; i < SNIFF_CUE.noteCount; i++) {
            this.scene.time.delayedCall(i * SNIFF_CUE.staggerMs, () => this.spawnSparkle());
        }

        this.scene.tweens.add({
            targets: pusheen,
            x: this.x + COSTUME.popOutOffsetX,
            y: this.y - HEIGHT - 30,
            scaleX: 1,
            scaleY: 1,
            duration: COSTUME.popOutMs,
            ease: 'Back.easeOut',
            onComplete: () => {
                // hand her back to physics exactly where the tween left her
                pusheen.body.enable = true;
                pusheen.body.reset(pusheen.x, pusheen.y);
                this.busy = false;
            }
        });
    }
}
