import { GameObjects } from 'phaser';
import { CUSHION_SQUASH, LAUNDRY } from '../config/feel.js';

export const HEAP_WIDTH = 114;

// Her half-width (Pusheen.js: 110 wide) less the same 10px grace the kitchen
// box ledges use: she stands while her centre is over the pile.
const EDGE_INSET = 55 - 10;

// The squishy heap of laundry the tipped basket leaves beside the dryer: a
// soft step she hops onto, and from it up onto the dryer. A solid static
// body (she lands on top, as on the pillow), and it squishes on contact
// with the same volume-conserving squash as the couch cushion.
//
// The scene builds it up front, before Pusheen, so it draws behind her like
// the rest of the furniture. opts.present: false while the basket is still
// on the table -- then it's hidden with its body off until plopIn() runs as
// the basket lands; true when it's already lying there (the basket was
// tipped earlier this run).
export class LaundryHeap extends GameObjects.Container
{
    constructor (scene, x, groundTop, opts = {})
    {
        const height = LAUNDRY.heapHeight;
        super(scene, x, groundTop - height / 2);
        scene.add.existing(this);
        scene.physics.add.existing(this, true);

        // Anchored at its base, so squashing flattens it onto the floor
        // instead of lifting its bottom off it.
        this.visual = scene.add.image(0, height / 2, 'laundryHeap').setOrigin(0.5, 1);
        this.add(this.visual);

        this.audio = scene.registry.get('audio');

        // Static bodies on a Container need their rect set directly (see
        // Cushion). It never moves again.
        //
        // Her standing surface is inset from the pile's drawn edges, as the
        // kitchen boxes' ledges are (Kitchen.js): Arcade keeps her standing
        // while any part of her 110-wide body overlaps it, so a surface as
        // wide as the art let her stand with her centre ~55px past the pile,
        // on thin air. Inset by her half-width less a little grace, she tips
        // off where the pile visibly ends. Top face only, like those ledges:
        // she lands on it from above and walks past it in front, rather than
        // bumping an invisible wall inside the soft pile.
        const surfaceW = HEAP_WIDTH - 2 * EDGE_INSET;
        this.body.setSize(surfaceW, height);
        this.body.position.set(x - surfaceW / 2, this.y - height / 2);
        this.body.checkCollision.down = false;
        this.body.checkCollision.left = false;
        this.body.checkCollision.right = false;

        this.touchedThisStep = false;
        this.wasContacted = false;

        const present = opts.present ?? true;
        this.setVisible(present);
        this.body.enable = present;
    }

    // The basket has landed here: appear, go solid, and plop.
    plopIn ()
    {
        this.setVisible(true);
        this.body.enable = true;
        this.playPlop();
    }

    // Fired from the pusheen<->heap collider callback (see Cushion for why
    // this, not body.touching, is how contact is detected).
    onCollide ()
    {
        this.touchedThisStep = true;
    }

    // Once per frame after the physics step: squash once when she lands.
    resolveContact ()
    {
        if (this.touchedThisStep && !this.wasContacted) {
            this.playSquash();
        }

        this.wasContacted = this.touchedThisStep;
        this.touchedThisStep = false;
    }

    // Squash when she lands on it, same as the cushion.
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

    // Plop on arrival: flatten wide, then spring back with an overshoot.
    playPlop ()
    {
        this.audio?.play('squish');
        this.visual.setScale(LAUNDRY.plopScaleX, LAUNDRY.plopScaleY);

        this.scene.tweens.add({
            targets: this.visual,
            scaleX: 1,
            scaleY: 1,
            delay: LAUNDRY.plopDownMs,
            duration: LAUNDRY.plopUpMs,
            ease: 'Back.easeOut'
        });
    }
}
