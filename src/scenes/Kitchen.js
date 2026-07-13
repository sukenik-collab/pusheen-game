import { Scene, Input } from 'phaser';
import { Pusheen } from '../entities/Pusheen.js';
import { Container } from '../entities/Container.js';
import { HeldPickup } from '../entities/HeldPickup.js';
import { Door } from '../entities/Door.js';
import { InteractionController } from '../systems/InteractionController.js';
import { fadeToRoom, fadeInRoom, resolveSpawn } from './roomTransition.js';

const GROUND_HEIGHT = 40;
const FLOOR_COLOR = 0xd8c39a;
const FRIDGE_HEIGHT = 160;

// Only reached from the Backyard, so default == fromBackyard: just inside the
// left screen door, clear of its trigger.
const SPAWN_POINTS = {
    default: { x: 150 },
    fromBackyard: { x: 150 }
};

// The fridge opens to its lit interior (panel: 'fridgeInside') showing several
// things. The OJ pitcher fills the glass she's carrying (fillHeld), gated on
// actually holding the glass -- without it the pitcher gives the gentle nope,
// leading her to grab the glass off the counter first. The rest are cozy decoys
// that also nope. `gate.requires` is a predicate (scene) => bool (M5 shape);
// UI.selectItem checks it before applying the effect.
const FRIDGE_CONTENTS = [
    {
        key: 'oj',
        label: 'Orange Juice',
        sprite: 'juicePitcher',
        effect: 'fillHeld',
        fill: 'juice',
        gate: { requires: (scene) => scene.registry.get('held:item') === 'glass' }
    },
    { key: 'milk', label: 'Milk', sprite: 'itemMilk', effect: 'nope' },
    { key: 'cheese', label: 'Cheese', sprite: 'itemCheese', effect: 'nope' },
    { key: 'leftovers', label: 'Leftovers', sprite: 'itemLeftovers', effect: 'nope' }
];

export class Kitchen extends Scene
{
    constructor ()
    {
        super('Kitchen');
    }

    create (data)
    {
        const { width, height } = this.scale;
        const groundTop = height - GROUND_HEIGHT;

        // Full backdrop: warm wall, a window onto the backyard (continuity),
        // and a countertop the glass + fridge stand on.
        this.add.image(width / 2, height / 2, 'kitchenBg');
        this.solids = [];

        // The glass sits out on the counter -- a direct pick-up (no cupboard):
        // walk up, press E, it goes into her hands. Gone once taken (glass:taken)
        // so it doesn't respawn on re-entry.
        // Seated on the counter (its base on the countertop surface in the
        // backdrop). Tune this y to the counter height in the final art.
        this.glass = new HeldPickup(this, 400, groundTop - 116, { sprite: 'glass', gives: 'glass', flag: 'glass:taken' });

        // The refrigerator: a Container that opens to its lit interior.
        this.fridge = new Container(this, 1050, groundTop - FRIDGE_HEIGHT / 2, {
            sprite: 'fridge',
            panel: 'fridgeInside',
            contents: FRIDGE_CONTENTS
        });

        // Left-wall screen door back to the Backyard.
        this.doorToBackyard = new Door(this, 40, groundTop, { side: 'right', to: 'Backyard', enterAt: 'fromKitchen' });

        this.interactions = new InteractionController(this);
        [this.glass, this.fridge].forEach((item) => this.interactions.register(item));

        this.ground = this.add.rectangle(width / 2, groundTop + GROUND_HEIGHT / 2, width, GROUND_HEIGHT, FLOOR_COLOR);
        this.physics.add.existing(this.ground, true);

        const spawn = resolveSpawn(SPAWN_POINTS, data);
        this.pusheen = new Pusheen(this, spawn.x, height - 200);
        this.physics.add.collider(this.pusheen, this.ground);
        this.solids.forEach((solid) => this.physics.add.collider(this.pusheen, solid));

        this.cursors = this.input.keyboard.createCursorKeys();
        this.keys = this.input.keyboard.addKeys('W,A,S,D,SPACE,E');
        this.registry.set('peek:open', false);
        this.registry.set('interact:available', false);
        this.registry.set('input:interactPressed', false);

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

        this.interactions.update(this.pusheen);

        const interactPressed = Input.Keyboard.JustDown(this.keys.E) || this.registry.get('input:interactPressed');
        this.registry.set('input:interactPressed', false);

        // An open peek panel is modal: freeze movement, E cancels it (mirrors
        // the LivingRoom cabinet). This branch sits outside the controller.
        if (this.registry.get('peek:open')) {
            this.pusheen.stopMoving();

            if (interactPressed) {
                this.registry.set('peek:open', false);
            }

            this.pusheen.update();
            return;
        }

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

        if (this.doorToBackyard.checkTrigger(this.pusheen)) {
            fadeToRoom(this, this.doorToBackyard.to, { spawn: this.doorToBackyard.enterAt, fadeIn: true });
        }

        this.pusheen.update();
    }
}
