import { GameObjects, Geom } from 'phaser';
import { RADAR } from '../config/feel.js';

const WIDTH = 140;
const HEIGHT = 160;
const COLOR = 0x6d4c41;

export const CABINET_HEIGHT = HEIGHT;
const CUE_COLOR = '#fff6d8';
const CUE_RISE_PX = 40;
const CUE_MS = 700;

export class Cabinet extends GameObjects.Container
{
    constructor (scene, x, y)
    {
        super(scene, x, y);
        scene.add.existing(this);

        this.visual = scene.add.rectangle(0, 0, WIDTH, HEIGHT, COLOR);
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

        if (nowOuter && !this.inOuterZone) {
            this.playSniffCue();
            pusheen.playSniffReact();
        }

        this.inOuterZone = nowOuter;
        this.inInnerZone = nowInner;
    }

    playSniffCue ()
    {
        const note = this.scene.add.text(this.x, this.y - HEIGHT / 2, '♪', {
            fontSize: '32px',
            color: CUE_COLOR
        }).setOrigin(0.5);

        this.scene.tweens.add({
            targets: note,
            y: note.y - CUE_RISE_PX,
            alpha: 0,
            duration: CUE_MS,
            ease: 'Quad.easeOut',
            onComplete: () => note.destroy()
        });
    }
}
