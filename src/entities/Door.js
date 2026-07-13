import { GameObjects, Geom } from 'phaser';

const WIDTH = 76;
const HEIGHT = 150;

// A doorway against a room's edge wall. Walking into it fires the room
// transition -- edge-triggered once per scene instance, the same fire-once
// pattern as the sunbeam's nap trigger.
//
// opts:
//   side            : 'left' | 'right' knob side (the art's knob is on the right)
//   to              : target scene key
//   enterAt         : named spawn point in the target room (see resolveSpawn)
//   initiallyActive : default true; false = a reveal-gated hidden door, inert
//                     and undrawn until activate() runs (see the Reveal
//                     primitive). Unused in v1.5 -- both doors ship active.
export class Door extends GameObjects.Container
{
    constructor (scene, x, groundTop, opts = {})
    {
        super(scene, x, groundTop - HEIGHT / 2);
        scene.add.existing(this);

        const knobSide = opts.side ?? 'left';
        // The art's knob is on the right; mirror for left-knob doors.
        this.add(scene.add.image(0, 0, 'door').setFlipX(knobSide === 'left'));

        this.to = opts.to ?? null;
        this.enterAt = opts.enterAt ?? null;

        this.zone = new Geom.Rectangle(x - WIDTH / 2, groundTop - HEIGHT, WIDTH, HEIGHT);
        this.triggered = false;

        // A hidden door stays inert and undrawn until revealed.
        this.enabled = opts.initiallyActive ?? true;
        this.setVisible(this.enabled);
    }

    checkTrigger (pusheen)
    {
        if (!this.enabled || this.triggered) {
            return false;
        }

        if (Geom.Rectangle.Contains(this.zone, pusheen.x, pusheen.y)) {
            this.triggered = true;
            return true;
        }

        return false;
    }

    // Turn a reveal-gated hidden door on (the Reveal primitive binds this to a
    // registry flag in v2). Unused in v1.5.
    activate ()
    {
        this.enabled = true;
        this.setVisible(true);
    }
}
