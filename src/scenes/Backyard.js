import { Scene, Input } from 'phaser';
import { Pusheen } from '../entities/Pusheen.js';
import { Sloth } from '../entities/Sloth.js';
import { Door } from '../entities/Door.js';
import { InteractionController } from '../systems/InteractionController.js';
import { bindReveal } from '../systems/Reveal.js';
import { fadeToRoom, fadeInRoom, resolveSpawn } from './roomTransition.js';

const GROUND_HEIGHT = 40;

// The boot room. Named entry points: default = fresh boot / Play again (out in
// the yard, to Sloth's right so approaching her fires the lead cue); fromKitchen
// = just inside the right screen door; fromLivingRoom = just inside the hidden
// path once it's revealed. Each spawn clears its door's trigger so it can't
// instantly re-fire on entry.
const SPAWN_POINTS = {
    default: { x: 980 },
    fromKitchen: { x: 1130 },
    fromLivingRoom: { x: 880 }
};

// Sloth hangs from the tree's low branch (tip ~mid-screen in the backdrop);
// the gate is revealed directly behind that spot.
const SLOTH_X = 700;

export class Backyard extends Scene
{
    constructor ()
    {
        super('Backyard');
    }

    create (data)
    {
        const { width, height } = this.scale;
        const groundTop = height - GROUND_HEIGHT;

        this.add.image(width / 2, height / 2, 'backyardBg').setDisplaySize(width, height);
        this.solids = [];

        // Hidden garden gate to the LivingRoom -- built BEFORE Sloth so he draws
        // over it, hanging in front of it. Placed behind where he hangs, and
        // revealed as he ambles clear on waking. Inert until then (bindReveal).
        this.doorToLivingRoom = new Door(this, SLOTH_X, groundTop, { texture: 'gardenGate', side: 'right', to: 'LivingRoom', enterAt: 'fromBackyard', initiallyActive: false });

        // The sleepy friend, dozing on the low tree branch.
        this.sloth = new Sloth(this, SLOTH_X, groundTop);

        // Right-wall screen door to the Kitchen.
        this.doorToKitchen = new Door(this, 1240, groundTop, { texture: 'screenDoor', side: 'left', to: 'Kitchen', enterAt: 'fromBackyard' });

        // One dispatcher for E-press interactions here (just Sloth today). The
        // doors are walk-into triggers and stay out (see the controller's note).
        this.interactions = new InteractionController(this);
        this.interactions.register(this.sloth);

        // Invisible physics floor -- the backdrop already draws the grass.
        this.ground = this.add.rectangle(width / 2, groundTop + GROUND_HEIGHT / 2, width, GROUND_HEIGHT)
            .setVisible(false);
        this.physics.add.existing(this.ground, true);

        const spawn = resolveSpawn(SPAWN_POINTS, data);
        this.pusheen = new Pusheen(this, spawn.x, height - 200);
        this.physics.add.collider(this.pusheen, this.ground);
        this.solids.forEach((solid) => this.physics.add.collider(this.pusheen, solid));

        this.cursors = this.input.keyboard.createCursorKeys();
        this.keys = this.input.keyboard.addKeys('W,A,S,D,SPACE,E');
        this.registry.set('input:interactPressed', false);
        this.registry.set('interact:available', false);

        // Waking Sloth opens the house: reveal the hidden path (activate + fade
        // its art in) and run her wake beat. Runs once when juice:delivered
        // flips true, or immediately on re-entry if it already happened.
        bindReveal(this, 'juice:delivered', () => {
            this.doorToLivingRoom.alpha = 0;
            this.doorToLivingRoom.activate();
            this.tweens.add({ targets: this.doorToLivingRoom, alpha: 1, duration: 600, ease: 'Sine.easeOut' });
            // As he lets go of the branch he nudges Pusheen aside, so the gate
            // he reveals isn't right under her -- she has to walk over to it.
            this.sloth.playWakeBeat(() => this.shovePusheenAside());
        });

        this.transitioning = false;
        fadeInRoom(this);
    }

    // Sloth bumps Pusheen a little to the right as he drops, so the gate he
    // uncovers isn't under her feet (which would auto-trigger the transition).
    // A scripted slide: body off, tween across, hand back to physics -- the
    // same off-then-reset pattern the costume box uses.
    shovePusheenAside ()
    {
        const p = this.pusheen;
        const toX = Math.min(Math.max(p.x, 760) + 160, 1150);
        p.stopMoving();
        p.body.enable = false;
        this.tweens.add({
            targets: p,
            x: toX,
            duration: 520,
            ease: 'Quad.easeOut',
            onComplete: () => {
                p.body.enable = true;
                p.body.reset(p.x, p.y);
            }
        });
    }

    update ()
    {
        if (this.transitioning) {
            this.pusheen.stopMoving();
            this.pusheen.update();
            return;
        }

        // Sloth's wake beat owns the screen -- freeze input while it plays.
        if (this.sloth.busy) {
            return;
        }

        this.interactions.update(this.pusheen);

        const interactPressed = Input.Keyboard.JustDown(this.keys.E) || this.registry.get('input:interactPressed');
        this.registry.set('input:interactPressed', false);

        const left = this.cursors.left.isDown || this.keys.A.isDown || this.registry.get('input:left');
        const right = this.cursors.right.isDown || this.keys.D.isDown || this.registry.get('input:right');
        const jumpPressed = this.cursors.up.isDown || this.cursors.space.isDown ||
            this.keys.W.isDown || this.keys.SPACE.isDown || this.registry.get('input:jump');

        if (left) {
            this.pusheen.moveLeft();
        } else if (right) {
            this.pusheen.moveRight();
        } else {
            this.pusheen.stopMoving();
        }

        if (jumpPressed) {
            this.pusheen.jump();
        }

        if (interactPressed) {
            this.interactions.pressInteract(this.pusheen);
        }

        // Walk-into door triggers (the hidden one only fires once activated).
        if (this.doorToKitchen.checkTrigger(this.pusheen)) {
            fadeToRoom(this, this.doorToKitchen.to, { spawn: this.doorToKitchen.enterAt, fadeIn: true });
        } else if (this.doorToLivingRoom.checkTrigger(this.pusheen)) {
            fadeToRoom(this, this.doorToLivingRoom.to, { spawn: this.doorToLivingRoom.enterAt, fadeIn: true });
        }

        this.pusheen.update();
    }
}
