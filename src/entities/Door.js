import { GameObjects, Geom } from 'phaser';

const WIDTH = 76;
const HEIGHT = 150;

// A doorway against a room's edge wall. Walking into it fires the room
// transition -- edge-triggered once per scene instance, the same
// fire-once pattern as the sunbeam's nap trigger.
export class Door extends GameObjects.Container
{
    constructor (scene, x, groundTop, knobSide = 'left')
    {
        super(scene, x, groundTop - HEIGHT / 2);
        scene.add.existing(this);

        // The art's knob is on the right; mirror for left-knob doors.
        this.add(scene.add.image(0, 0, 'door').setFlipX(knobSide === 'left'));

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
