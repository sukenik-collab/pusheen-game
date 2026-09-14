import { GameObjects, Geom } from 'phaser';
import { SNIFF_CUE } from '../config/feel.js';

const CUE_COLOR = '#fff6d8';

// Tight enough that the glass is only grabbable while she's actually standing
// on the counter beside it -- not from the step box a hop below. Outer leads.
const PICKUP_SNIFF = 140;
const PICKUP_INTERACT = 70;

// An item sitting out in the open (the glass on the kitchen counter) that she
// walks up to and picks up straight into her hands -- no peek panel, unlike a
// Container. Same concentric sensor-zone contract as everything else: outer
// zone leads with a cue, inner zone enables the take.
//
// opts:
//   sprite : the item art
//   gives  : held:item value it sets ('glass')
//   flag   : run-state key marking it gone once taken (so it doesn't respawn
//            on room re-entry, and resets on Play again)
export class HeldPickup extends GameObjects.Container
{
    constructor (scene, x, y, opts = {})
    {
        super(scene, x, y);
        scene.add.existing(this);

        this.verb = 'take';
        this.gives = opts.gives;
        this.flag = opts.flag ?? null;
        this.audio = scene.registry.get('audio');

        this.visual = scene.add.image(0, 0, opts.sprite);
        this.add(this.visual);

        // Already taken this run? Don't present it again.
        this.taken = this.flag ? !!scene.registry.get(this.flag) : false;
        this.setVisible(!this.taken);

        this.outerZone = new Geom.Circle(x, y, PICKUP_SNIFF);
        this.innerZone = new Geom.Circle(x, y, PICKUP_INTERACT);
        this.inOuterZone = false;
        this.inInnerZone = false;
    }

    update (pusheen)
    {
        if (this.taken) {
            return;
        }

        const nowOuter = Geom.Circle.Contains(this.outerZone, pusheen.x, pusheen.y);
        this.inInnerZone = Geom.Circle.Contains(this.innerZone, pusheen.x, pusheen.y);

        if (nowOuter && !this.inOuterZone) {
            this.playCue();
            pusheen.playSniffReact();
        }

        this.inOuterZone = nowOuter;
    }

    // Only offered while her hands are empty -- one thing at a time.
    isActionable (scene)
    {
        return !this.taken && scene.registry.get('held:item') === 'none';
    }

    interact (pusheen, scene)
    {
        if (this.taken) {
            return;
        }

        this.taken = true;
        this.inInnerZone = false;
        scene.interactions?.unregister(this);
        scene.registry.set('held:item', this.gives);
        if (this.flag) {
            scene.registry.set(this.flag, true);
        }
        this.audio?.play('collect');

        // Lift + fade, so it reads as picked up rather than vanished.
        this.scene.tweens.add({
            targets: this,
            y: this.y - 30,
            alpha: 0,
            duration: 300,
            ease: 'Quad.easeOut',
            onComplete: () => this.destroy()
        });
    }

    playCue ()
    {
        this.audio?.play('sniff');

        for (let i = 0; i < SNIFF_CUE.noteCount; i++) {
            this.scene.time.delayedCall(i * SNIFF_CUE.staggerMs, () => this.spawnNote());
        }
    }

    spawnNote ()
    {
        // The cue's notes are staggered over ~440ms, so one can still be
        // pending when she takes the item -- by which point this has already
        // destroyed itself and `this.scene` is gone. Taken means no more
        // "ooh, what's that" notes anyway.
        if (this.taken) {
            return;
        }

        const note = this.scene.add.text(this.x, this.y - this.visual.height / 2, '♪', {
            fontSize: '30px',
            color: CUE_COLOR
        }).setOrigin(0.5);

        this.scene.tweens.add({
            targets: note,
            y: note.y - SNIFF_CUE.risePx,
            alpha: 0,
            duration: SNIFF_CUE.ms,
            ease: 'Quad.easeOut',
            onComplete: () => note.destroy()
        });
    }
}
