import { GameObjects, Geom } from 'phaser';

const WIDTH = 76;
const HEIGHT = 150;
const FRAME_COLOR = 0x5d4037;
const PANEL_COLOR = 0x9c7b62;
const KNOB_COLOR = 0xf2d16b;

// A placeholder doorway against a room's edge wall. Walking into it fires
// the room transition -- edge-triggered once per scene instance, the same
// fire-once pattern as the sunbeam's nap trigger.
export class Door extends GameObjects.Container
{
    constructor (scene, x, groundTop, knobSide = 'left')
    {
        super(scene, x, groundTop - HEIGHT / 2);
        scene.add.existing(this);

        const knobX = knobSide === 'left' ? -WIDTH / 2 + 16 : WIDTH / 2 - 16;
        this.add([
            scene.add.rectangle(0, 0, WIDTH, HEIGHT, FRAME_COLOR),
            scene.add.rectangle(0, 0, WIDTH - 14, HEIGHT - 14, PANEL_COLOR),
            scene.add.circle(knobX, 6, 5, KNOB_COLOR)
        ]);

        this.zone = new Geom.Rectangle(x - WIDTH / 2, groundTop - HEIGHT, WIDTH, HEIGHT);
        this.triggered = false;
    }

    checkTrigger (pusheen)
    {
        if (this.triggered) {
            return false;
        }

        if (Geom.Rectangle.Contains(this.zone, pusheen.x, pusheen.y)) {
            this.triggered = true;
            return true;
        }

        return false;
    }
}
