import { Scene, Input } from 'phaser';
import { Pusheen } from '../entities/Pusheen.js';
import { Container } from '../entities/Container.js';
import { HeldPickup } from '../entities/HeldPickup.js';
import { Door } from '../entities/Door.js';
import { InteractionController } from '../systems/InteractionController.js';
import { buildLayout } from '../systems/roomBuilder.js';
import { fadeToRoom, fadeInRoom, resolveSpawn } from './roomTransition.js';

const GROUND_HEIGHT = 40;

// Only reached from the Backyard, so default == fromBackyard: just inside the
// left screen door, clear of its trigger.
const SPAWN_POINTS = {
    default: { x: 150 },
    fromBackyard: { x: 150 }
};

// Two little steps up to the high counter: floor -> stool -> box -> counter top.
// Each rise is within a normal hop (~82px apex). Heights are tuned to the
// counter in the kitchen backdrop -- expect a small pass once art is final
// (the counter body currently sits ~20px below the painted counter surface).
const STOOL_H = 80;                 // top at groundTop - 80
const BOX_H = 160;                  // top at groundTop - 160
const COUNTER_TOP_FROM_GROUND = 240; // top at groundTop - 240
const COUNTER_X = 875;
const COUNTER_W = 350;              // spans ~700..1050

// One-way climbing steps (top-face only) so she walks freely past them and only
// lands on their tops. The counter itself is an invisible one-way body built in
// create() (the backdrop draws the counter); the fridge is in the backdrop too.
// Wide + adjacent so each hop is mostly vertical: the stool (450..590) meets the
// box (590..710), which meets the counter's left end (~700). Body widths come
// from the textures (140, 120); h here just sets yFromGround.
const LAYOUT = [
    { name: 'stepStool', role: 'standable', oneWay: true, sprite: 'stepStool', x: 520, h: STOOL_H, yFromGround: STOOL_H / 2 },
    { name: 'stepBox', role: 'standable', oneWay: true, sprite: 'stepBox', x: 650, h: BOX_H, yFromGround: BOX_H / 2 }
];

// The fridge opens to its lit interior (panel: 'fridgeInside'). The OJ pitcher
// fills the glass she's carrying (fillHeld), gated on holding the glass --
// without it, the pitcher gives the gentle nope, leading her to get the glass
// first. The rest are cozy decoys that also nope. `gate.requires` is a predicate
// (scene) => bool (M5 shape); UI.selectItem checks it before applying the effect.
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

        this.add.image(width / 2, height / 2, 'kitchenBg').setDisplaySize(width, height);

        this.solids = buildLayout(this, LAYOUT, groundTop);

        // The counter top she climbs onto: an invisible one-way platform over
        // the backdrop's painted countertop. She walks off either end to drop
        // back down (no climbing back down the steps needed).
        const counterTop = groundTop - COUNTER_TOP_FROM_GROUND;
        const counter = this.add.rectangle(COUNTER_X, counterTop + 12, COUNTER_W, 24).setVisible(false);
        this.physics.add.existing(counter, true);
        counter.body.checkCollision.down = false;
        counter.body.checkCollision.left = false;
        counter.body.checkCollision.right = false;
        this.solids.push(counter);

        // The glass sits out on the counter -- only reachable once she's climbed
        // up beside it. Gone once taken (glass:taken) so it doesn't respawn.
        this.glass = new HeldPickup(this, COUNTER_X - 25, counterTop - 42, { sprite: 'glass', gives: 'glass', flag: 'glass:taken' });

        // The refrigerator is drawn into the backdrop (right side); this is its
        // invisible interaction zone, opening to the lit interior.
        this.fridge = new Container(this, 1200, groundTop - 80, {
            sprite: 'fridge',
            hidden: true,
            panel: 'fridgeInside',
            contents: FRIDGE_CONTENTS
        });

        // Left-wall screen door back to the Backyard.
        this.doorToBackyard = new Door(this, 40, groundTop, { texture: 'screenDoor', side: 'right', to: 'Backyard', enterAt: 'fromKitchen' });

        this.interactions = new InteractionController(this);
        [this.glass, this.fridge].forEach((item) => this.interactions.register(item));

        // Invisible physics floor -- the backdrop already draws it.
        this.ground = this.add.rectangle(width / 2, groundTop + GROUND_HEIGHT / 2, width, GROUND_HEIGHT)
            .setVisible(false);
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
