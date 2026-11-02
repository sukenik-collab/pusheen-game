import { Scene, Input } from 'phaser';
import { SPAWN } from '../config/feel.js';
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

// Two little steps up to the high counter: floor -> short box -> tall box ->
// counter top. Each rise is within a normal hop (~82px apex) -- only just, by
// design. The counter's height is tuned to the kitchen backdrop, where she
// stands at its front lip; the boxes are drawn to these heights, not the
// other way round.
const LOW_BOX_TOP = 80;
const TALL_BOX_TOP = 160;
const COUNTER_TOP_FROM_GROUND = 240;
const COUNTER_X = 875;
const COUNTER_W = 350;              // spans ~700..1050

// The glass stands on the painted counter top, its base this far back from
// the front lip she stands on: in front of the mugs (their bases sit ~23-33px
// back) and clear of the counter's front edge line (~12px back). On the lip
// itself it read as hanging in front of the counter.
const GLASS_SET_BACK = 20;

// Both boxes are one sprite (tools/cut_boxes.py), sitting on the floor. They
// show their top faces a little from above, like the counter, so she stands
// halfway back across a top face rather than on the sprite's top edge (the
// far rim): the sprite is drawn only, and she lands on invisible ledges
// (LEDGES) at LOW_BOX_TOP / TALL_BOX_TOP, which is where the script scales
// those lines to. Sizes and offsets are what it prints; re-take them on a
// re-cut.
//
// Placed so each hop is mostly vertical: the short box (443..606) and the
// tall one (568..735) overlap, and the tall one overlaps the counter's left
// end (700). She can stand at the short box's right end with her body over
// the tall one, and on the tall one's right end with it over the counter,
// and hop straight up.
const BOXES_X = 589;
const LAYOUT = [
    { name: 'stepBoxes', role: 'background', sprite: 'stepBoxes', x: BOXES_X, w: 295, h: 176 }
];

// Arcade keeps her standing while any part of her body overlaps a ledge, and
// her body is 110 wide (Pusheen.js). A ledge as wide as its box let her stand
// with her centre ~55px past the box's drawn edge, on thin air. So each box's
// ledge is inset by her half-width, less a little grace: she stands while her
// centre is over the drawn top (to within EDGE_GRACE), and tips off where the
// box visibly ends. The counter isn't inset -- the painted counter runs on
// past both ends of its ledge, so there's no drawn edge to match.
const EDGE_GRACE = 10;
const BOX_EDGE_INSET = 55 - EDGE_GRACE;

// Invisible one-way ledges (top face only), so she walks freely past the boxes
// and jumps up through them, landing only on top. `top` is height above the
// floor. The backdrop draws the counter, so it's one too.
const LEDGE_THICKNESS = 24;
const LEDGES = [
    { x: BOXES_X - 64.7, w: 163 - 2 * BOX_EDGE_INSET, top: LOW_BOX_TOP },
    { x: BOXES_X + 62.2, w: 167 - 2 * BOX_EDGE_INSET, top: TALL_BOX_TOP },
    { x: COUNTER_X, w: COUNTER_W, top: COUNTER_TOP_FROM_GROUND }
];

function addLedge (scene, { x, w, top }, groundTop)
{
    const surface = groundTop - top;
    const ledge = scene.add.rectangle(x, surface + LEDGE_THICKNESS / 2, w, LEDGE_THICKNESS).setVisible(false);
    scene.physics.add.existing(ledge, true);
    ledge.body.checkCollision.down = false;
    ledge.body.checkCollision.left = false;
    ledge.body.checkCollision.right = false;
    return ledge;
}

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

        this.registry.get('audio')?.enterRoom(this, 'Kitchen');

        this.add.image(width / 2, height / 2, 'kitchenBg').setDisplaySize(width, height);

        buildLayout(this, LAYOUT, groundTop);

        // Both boxes and the counter top. She walks off either end of any of
        // them to drop back down (no climbing back down the steps needed).
        this.solids = LEDGES.map((ledge) => addLedge(this, ledge, groundTop));
        const counterTop = groundTop - COUNTER_TOP_FROM_GROUND;

        // The glass sits out on the counter -- only reachable once she's climbed
        // up beside it. Gone once taken (glass:taken) so it doesn't respawn.
        this.glass = new HeldPickup(this, COUNTER_X - 25, counterTop - GLASS_SET_BACK - 42, { sprite: 'glass', gives: 'glass', flag: 'glass:taken' });

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
        this.pusheen = new Pusheen(this, spawn.x, groundTop - SPAWN.heightAboveGround);
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
