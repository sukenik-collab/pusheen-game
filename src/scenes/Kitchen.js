import { Scene, Input } from 'phaser';
import { KITCHEN } from '../config/feel.js';
import { Pusheen } from '../entities/Pusheen.js';
import { Container } from '../entities/Container.js';
import { Door } from '../entities/Door.js';
import { buildLayout } from '../systems/roomBuilder.js';
import { InteractionController } from '../systems/InteractionController.js';
import { fadeToRoom, fadeInRoom, resolveSpawn } from './roomTransition.js';

const GROUND_HEIGHT = 40;
const FRIDGE_HEIGHT = 160;
const CUPBOARD_HEIGHT = 130;

// Only reached from the Backyard, so default == fromBackyard: just inside the
// left screen door, clear of its trigger.
const SPAWN_POINTS = {
    default: { x: 150 },
    fromBackyard: { x: 150 }
};

// A wooden counter run as background scenery.
const LAYOUT = [
    { name: 'counter', role: 'background', color: 0xc9a97a, x: 640, w: 1000, h: 64, yFromGround: 32 }
];

// The cupboard holds the glass. `takeHeld` picks it up, but only while her
// hands are empty (gate: held:item === 'none'); a cozy mug sits alongside as a
// gentle decoy. `gate.requires` is a predicate (scene) => bool, same shape v1.5
// read (M5) -- UI.selectItem checks it before applying the effect.
const CUPBOARD_CONTENTS = [
    {
        key: 'glass',
        label: 'Glass',
        sprite: 'glass',
        effect: 'takeHeld',
        give: 'glass',
        gate: { requires: (scene) => scene.registry.get('held:item') === 'none' }
    },
    { key: 'mug', label: 'Mug', sprite: 'mug', effect: 'nope' }
];

// The fridge always opens and shows the OJ; selecting it fills the glass she's
// carrying. Gated on holding the glass -- without it, the OJ gives the gentle
// `nope` (no stress), leading her to go find the glass first.
const FRIDGE_CONTENTS = [
    {
        key: 'oj',
        label: 'Orange Juice',
        sprite: 'orangeJuice',
        effect: 'fillHeld',
        fill: 'juice',
        gate: { requires: (scene) => scene.registry.get('held:item') === 'glass' }
    }
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

        this.add.rectangle(width / 2, height / 2, width, height, KITCHEN.wall);

        this.solids = buildLayout(this, LAYOUT, groundTop);

        // Left -- the cupboard with the glass. Right -- the refrigerator.
        this.cupboard = new Container(this, 300, groundTop - CUPBOARD_HEIGHT / 2, {
            sprite: 'cupboard',
            contents: CUPBOARD_CONTENTS
        });
        this.fridge = new Container(this, 1050, groundTop - FRIDGE_HEIGHT / 2, {
            sprite: 'fridge',
            contents: FRIDGE_CONTENTS
        });

        // Left-wall screen door back to the Backyard.
        this.doorToBackyard = new Door(this, 40, groundTop, { side: 'right', to: 'Backyard', enterAt: 'fromKitchen' });

        this.interactions = new InteractionController(this);
        [this.cupboard, this.fridge].forEach((item) => this.interactions.register(item));

        this.ground = this.add.rectangle(width / 2, groundTop + GROUND_HEIGHT / 2, width, GROUND_HEIGHT, KITCHEN.floor);
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
