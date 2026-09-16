import { GameObjects, Geom } from 'phaser';

const WIDTH = 76;
const HEIGHT = 150;

// A doorway -- usually against a room's edge wall, though the backyard's garden
// gate stands mid-room. Walking into it fires the room transition: edge-
// triggered once per scene instance, the same fire-once pattern as the
// sunbeam's nap trigger, and it must be entered from outside (see `armed`).
//
// opts:
//   texture         : door art key (default 'door'); e.g. 'screenDoor',
//                     'gardenGate' for the v2 doorways
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
        this.add(scene.add.image(0, 0, opts.texture ?? 'door').setFlipX(knobSide === 'left'));

        this.to = opts.to ?? null;
        this.enterAt = opts.enterAt ?? null;

        this.zone = new Geom.Rectangle(x - WIDTH / 2, groundTop - HEIGHT, WIDTH, HEIGHT);
        this.triggered = false;

        // Walking *into* a doorway is what opens it -- so it won't fire on
        // someone already standing in it. It arms the first time Pusheen is
        // clear of the zone, which makes a reveal-gated door safe to switch on
        // under her feet (the garden gate is revealed exactly where she stands
        // to hand Sloth the juice) and keeps a spawn point placed inside a
        // doorway from bouncing her straight back out.
        this.armed = false;

        // A hidden door stays inert and undrawn until revealed.
        this.enabled = opts.initiallyActive ?? true;
        this.setVisible(this.enabled);
    }

    checkTrigger (pusheen)
    {
        if (!this.enabled || this.triggered) {
            return false;
        }

        const inside = Geom.Rectangle.Contains(this.zone, pusheen.x, pusheen.y);

        if (!this.armed) {
            this.armed = !inside;
            return false;
        }

        if (inside) {
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
