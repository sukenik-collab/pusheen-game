import { Scene, Input } from 'phaser';
import { BACKYARD } from '../config/feel.js';
import { Pusheen } from '../entities/Pusheen.js';
import { Sloth } from '../entities/Sloth.js';
import { Door } from '../entities/Door.js';
import { buildLayout } from '../systems/roomBuilder.js';
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
    default: { x: 560 },
    fromKitchen: { x: 1130 },
    fromLivingRoom: { x: 260 }
};

// Passive scenery as data. Tree + hammock are drawn only (background) -- the
// small room stays walkable end to end; Sloth rests on the hammock, built as an
// entity in create().
const LAYOUT = [
    { name: 'tree', role: 'background', sprite: 'tree', x: 1080, yFromGround: 115 },
    { name: 'hammock', role: 'background', sprite: 'hammock', x: 350, yFromGround: 48 }
];

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

        this.add.rectangle(width / 2, height / 2, width, height, BACKYARD.sky);

        this.solids = buildLayout(this, LAYOUT, groundTop);

        // The sleepy friend, dozing on the hammock.
        this.sloth = new Sloth(this, 350, groundTop);

        // Right-wall screen door to the Kitchen. Left-wall hidden path to the
        // LivingRoom -- inert until waking Sloth reveals it (see bindReveal).
        this.doorToKitchen = new Door(this, 1240, groundTop, { side: 'left', to: 'Kitchen', enterAt: 'fromBackyard' });
        this.doorToLivingRoom = new Door(this, 140, groundTop, { side: 'right', to: 'LivingRoom', enterAt: 'fromBackyard', initiallyActive: false });

        // One dispatcher for E-press interactions here (just Sloth today). The
        // doors are walk-into triggers and stay out (see the controller's note).
        this.interactions = new InteractionController(this);
        this.interactions.register(this.sloth);

        this.ground = this.add.rectangle(width / 2, groundTop + GROUND_HEIGHT / 2, width, GROUND_HEIGHT, BACKYARD.grass);
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
            this.sloth.playWakeBeat();
        });

        this.transitioning = false;
        fadeInRoom(this);
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
