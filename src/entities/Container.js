import { GameObjects, Geom } from 'phaser';
import { RADAR, SNIFF_CUE } from '../config/feel.js';

const CUE_COLOR = '#fff6d8';

// A generic peek-with-contents interactable: approach for the lead sniff cue,
// press E in range to open a peek panel of contents. Generalizes the old
// Cabinet -- the drawer art, the item grid, number-key select, and the nope-
// shake all live in the UI scene; this entity owns only the proximity radar
// and publishes the open state + its contents to the registry for UI to render.
//
// opts:
//   sprite        : closed-container texture
//   contents      : [{ key, label, sprite, effect }]  effect ∈ takeSnack | nope
//                   (v2 adds fillHeld / takeHeld)
//   isActionable  : optional (scene) => bool semantic gate (default: always).
//                   The cabinet passes "snack unfound" so it goes quiet once
//                   the snack is taken. (M1's contract; M5's `gate` will layer
//                   content-level requirements on top.)
export class Container extends GameObjects.Container
{
    constructor (scene, x, y, opts = {})
    {
        super(scene, x, y);
        scene.add.existing(this);

        this.verb = 'peek';
        this.contents = opts.contents ?? [];
        this._isActionable = opts.isActionable ?? null;
        this.audio = scene.registry.get('audio');

        this.visual = scene.add.image(0, 0, opts.sprite);
        this.add(this.visual);

        // Outer must be strictly larger than inner so the cue leads the
        // interaction -- the gap is the "ooh, what's over there?" beat.
        this.outerZone = new Geom.Circle(x, y, RADAR.sniffRadius);
        this.innerZone = new Geom.Circle(x, y, RADAR.interactRadius);

        this.inOuterZone = false;
        this.inInnerZone = false;
    }

    update (pusheen)
    {
        const nowOuter = Geom.Circle.Contains(this.outerZone, pusheen.x, pusheen.y);
        const nowInner = Geom.Circle.Contains(this.innerZone, pusheen.x, pusheen.y);

        // The lead cue is tied to the container still being actionable: once
        // its contents are spent (the cabinet's snack found), re-entering the
        // room -- a fresh scene, so inOuterZone has reset -- must not call out
        // again.
        if (nowOuter && !this.inOuterZone && this.isActionable(this.scene)) {
            this.playSniffCue();
            pusheen.playSniffReact();
        }

        this.inOuterZone = nowOuter;
        this.inInnerZone = nowInner;
    }

    isActionable (scene)
    {
        return this._isActionable ? this._isActionable(scene) : true;
    }

    interact (pusheen, scene)
    {
        // Contents first, then open -- UI's open handler reads peek:contents.
        scene.registry.set('peek:contents', this.contents);
        scene.registry.set('peek:open', true);
    }

    // A single note reads as a blink-and-you-miss-it flicker, so one sniff
    // fires a short flutter of notes rather than a lone instant one.
    playSniffCue ()
    {
        // One sniff per approach, not one per fluttered note.
        this.audio?.play('sniff');

        for (let i = 0; i < SNIFF_CUE.noteCount; i++) {
            this.scene.time.delayedCall(i * SNIFF_CUE.staggerMs, () => this.spawnNote());
        }
    }

    spawnNote ()
    {
        const note = this.scene.add.text(this.x, this.y - this.visual.height / 2, '♪', {
            fontSize: '32px',
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
