import { GameObjects, Geom } from 'phaser';
import { LAUNDRY } from '../config/feel.js';

export const BASKET_WIDTH = 70;
export const BASKET_HEIGHT = 46;

// The laundry basket at the edge of the folding table: the Laundry Room's
// knock-it-over puzzle. Same concentric-zone pattern as everything else --
// the outer zone wobbles it as the sniff cue (from the floor, on approach),
// the inner zone offers the paw-swipe, but only once she's up on the table
// beside it. Swiping tips it off in a scripted arc to a fixed spot beside
// the dryer (a tween, never physics, so it can't land somewhere unhelpful);
// the scene then builds the heap there.
//
// opts:
//   landAt   : { x, y } world centre the basket flies to (the heap's spot)
//   onLanded : () => void, called once it arrives
export class LaundryBasket extends GameObjects.Container
{
    constructor (scene, x, tableTop, opts = {})
    {
        super(scene, x, tableTop - BASKET_HEIGHT / 2);
        scene.add.existing(this);

        this.audio = scene.registry.get('audio');
        this.verb = 'swipe';
        this.tableTop = tableTop;
        this.landAt = opts.landAt;
        this.onLanded = opts.onLanded ?? null;

        // Pivot on its base, so the wobble rocks it on the table rather than
        // spinning it about its middle.
        this.visual = scene.add.image(0, BASKET_HEIGHT / 2, 'laundryBasket').setOrigin(0.5, 1);
        this.add(this.visual);

        this.outerZone = new Geom.Circle(x, this.y, LAUNDRY.sniffRadius);
        this.innerZone = new Geom.Circle(x, this.y, LAUNDRY.interactRadius);
        this.inOuterZone = false;
        this.inInnerZone = false;
        this.tipped = false;
    }

    update (pusheen)
    {
        if (this.tipped) {
            return;
        }

        const nowOuter = Geom.Circle.Contains(this.outerZone, pusheen.x, pusheen.y);

        // The swipe wants her up on the table with it: feet planted on the
        // table top (or higher), not reaching up from the floor. The inner
        // radius alone would let her swipe from the floor beside the table.
        this.inInnerZone = pusheen.isGrounded() &&
            pusheen.body.bottom <= this.tableTop + 2 &&
            Geom.Circle.Contains(this.innerZone, pusheen.x, pusheen.y);

        if (nowOuter && !this.inOuterZone) {
            this.playWobbleCue(pusheen);
        }

        this.inOuterZone = nowOuter;
    }

    isActionable ()
    {
        return !this.tipped;
    }

    interact (pusheen)
    {
        if (this.tipped) {
            return;
        }

        this.tipped = true;
        this.inInnerZone = false;
        this.scene.interactions?.unregister(this);
        this.scene.registry.set('laundry:basketTipped', true);

        pusheen.playPawSwipe(this.x < pusheen.x ? 'left' : 'right');
        this.scene.time.delayedCall(LAUNDRY.swipeMs, () => this.tipOff());
    }

    // Sniff cue: it rocks on its base, as if something inside shifted.
    playWobbleCue (pusheen)
    {
        this.audio?.play('sniff');
        pusheen.playSniffReact();

        this.scene.tweens.add({
            targets: this.visual,
            angle: { from: -LAUNDRY.wobbleDeg, to: LAUNDRY.wobbleDeg },
            duration: LAUNDRY.wobbleMs,
            yoyo: true,
            repeat: LAUNDRY.wobbleRepeats - 1,
            ease: 'Sine.easeInOut',
            onComplete: () => this.visual.setAngle(0)
        });
    }

    // The tip-off: up and over in a curve (a quadratic Bezier, driven by one
    // tween), tumbling as it goes, to the fixed landing spot.
    tipOff ()
    {
        this.audio?.play('jump');

        const start = new Geom.Point(this.x, this.y);
        const end = this.landAt;
        const peakY = Math.min(start.y, end.y) - LAUNDRY.tipArcPx;
        const control = new Geom.Point((start.x + end.x) / 2, peakY);

        this.scene.tweens.addCounter({
            from: 0,
            to: 1,
            duration: LAUNDRY.tipMs,
            ease: 'Sine.easeIn',
            onUpdate: (tween) => {
                const t = tween.getValue();
                const u = 1 - t;
                this.x = u * u * start.x + 2 * u * t * control.x + t * t * end.x;
                this.y = u * u * start.y + 2 * u * t * control.y + t * t * end.y;
            },
            onComplete: () => {
                this.onLanded?.();
                this.destroy();
            }
        });

        this.scene.tweens.add({
            targets: this.visual,
            angle: LAUNDRY.tipSpinDeg,
            duration: LAUNDRY.tipMs,
            ease: 'Sine.easeIn'
        });
    }
}
