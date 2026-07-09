import { GameObjects, Geom } from 'phaser';

const WINDOW_WIDTH = 120;
const WINDOW_HEIGHT = 160;
const WINDOW_Y = 150;

const PATCH_COLOR = 0xfff2b2;
const PATCH_ALPHA_DIM = 0.2;
const PATCH_ALPHA_LIT = 0.6;
const PATCH_WIDTH = 200;
const PATCH_HEIGHT = 50;

const RAY_COLOR = 0xfff6d8;
const RAY_ALPHA = 0.4;
const RAY_TOP_HALF_WIDTH = 18;
const RAY_BOTTOM_HALF_WIDTH = 90;
const RAY_FADE_MS = 900;

// Vertical padding on the trigger zone so a full-height Pusheen registers
// as "in the beam" without needing to stand exactly on the patch's center.
const ZONE_PADDING = 60;

const DUST_COLOR = 0xfff6d8;

export class Sunbeam extends GameObjects.Container
{
    constructor (scene, x, groundTop)
    {
        super(scene, x, groundTop - PATCH_HEIGHT / 2 - 10);
        scene.add.existing(this);

        scene.add.image(x, WINDOW_Y, 'window');

        // A dim beam connecting the window to the floor patch, invisible
        // until illuminate() -- the visual cue that the nap is now armed.
        const rayTopY = WINDOW_Y + WINDOW_HEIGHT / 2;
        const rayBottomY = groundTop - PATCH_HEIGHT;
        this.ray = scene.add.graphics().setAlpha(0);
        this.ray.fillStyle(RAY_COLOR, 1);
        this.ray.beginPath();
        this.ray.moveTo(x - RAY_TOP_HALF_WIDTH, rayTopY);
        this.ray.lineTo(x + RAY_TOP_HALF_WIDTH, rayTopY);
        this.ray.lineTo(x + RAY_BOTTOM_HALF_WIDTH, rayBottomY);
        this.ray.lineTo(x - RAY_BOTTOM_HALF_WIDTH, rayBottomY);
        this.ray.closePath();
        this.ray.fillPath();

        this.patch = scene.add.rectangle(0, 0, PATCH_WIDTH, PATCH_HEIGHT, PATCH_COLOR).setAlpha(PATCH_ALPHA_DIM);
        this.add(this.patch);

        this.illuminated = false;

        this.zone = new Geom.Rectangle(
            x - PATCH_WIDTH / 2,
            groundTop - PATCH_HEIGHT - ZONE_PADDING,
            PATCH_WIDTH,
            PATCH_HEIGHT + ZONE_PADDING
        );
        this.triggered = false;

        this.dustEmitter = scene.add.particles(x, groundTop - 70, 'dustMote', {
            x: { min: -PATCH_WIDTH / 2, max: PATCH_WIDTH / 2 },
            y: { min: -60, max: 0 },
            lifespan: 3000,
            speedX: { min: -3, max: 3 },
            speedY: { min: -6, max: -2 },
            scale: { start: 0.3, end: 0.6 },
            alpha: { start: 0.5, end: 0 },
            tint: DUST_COLOR,
            frequency: 400,
            quantity: 1,
            emitting: false
        });
    }

    // Arms only once the snack is collected and only while she's actually
    // standing (not mid-jump-arc, which the zone's vertical padding would
    // otherwise let overlap) -- otherwise a landing during the nap's settle
    // window fires Pusheen's own land-squash mid-curl and undoes it. Edge-
    // triggered so it fires exactly once per approach, same pattern as the
    // cabinet's zones.
    checkTrigger (pusheen, snackCollected)
    {
        if (this.triggered || !snackCollected || !pusheen.isGrounded()) {
            return false;
        }

        if (Geom.Rectangle.Contains(this.zone, pusheen.x, pusheen.y)) {
            this.triggered = true;
            return true;
        }

        return false;
    }

    startDustMotes ()
    {
        this.dustEmitter.start();
    }

    // Fires once the snack is collected -- decoupled from the nap trigger
    // itself, so the room visibly points at the sunbeam the moment there's
    // somewhere to go, well before she actually walks over.
    illuminate ()
    {
        if (this.illuminated) {
            return;
        }

        this.illuminated = true;

        this.scene.tweens.add({ targets: this.ray, alpha: RAY_ALPHA, duration: RAY_FADE_MS, ease: 'Sine.easeOut' });
        this.scene.tweens.add({ targets: this.patch, alpha: PATCH_ALPHA_LIT, duration: RAY_FADE_MS, ease: 'Sine.easeOut' });
    }
}
