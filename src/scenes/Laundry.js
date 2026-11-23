import { Scene, Input } from 'phaser';
import { LAUNDRY, SPAWN } from '../config/feel.js';
import { Pusheen } from '../entities/Pusheen.js';
import { Door } from '../entities/Door.js';
import { YarnBall } from '../entities/YarnBall.js';
import { LaundryBasket } from '../entities/LaundryBasket.js';
import { LaundryHeap, HEAP_WIDTH } from '../entities/LaundryHeap.js';
import { buildLayout } from '../systems/roomBuilder.js';
import { InteractionController } from '../systems/InteractionController.js';
import { fadeToRoom, fadeInRoom, resolveSpawn } from './roomTransition.js';

const GROUND_HEIGHT = 40;
const WALL_COLOR = 0x86aca6;    // soft sea-green, between the warm living room and the dusky bedroom
const GROUND_COLOR = 0x5d7f79;

// The Laundry Room sits between the LivingRoom (left door) and the Bedroom
// (right door), so the wing keeps running left to right. Never the boot
// room, so default == fromLivingRoom. Both spawns are just inside their
// door, clear of its trigger -- and fromLivingRoom is also clear of the
// dryer yarn's sniff zone, so the cue leads her in rather than firing on
// arrival.
const SPAWN_POINTS = {
    default: { x: 150 },
    fromLivingRoom: { x: 150 },
    fromBedroom: { x: 1130 }
};

// The puzzle, left to right: the dryer near the entrance (a bit too high to
// hop onto, with a yarn ball on top), the heap's landing spot butting up
// against its right side, then the low folding table with the basket at its
// left edge, facing the dryer. A decorative washer stands by the far door.
const DRYER_X = 330;
const DRYER_W = 110;
const HEAP_X = DRYER_X + DRYER_W / 2 + 5 + HEAP_WIDTH / 2;
const TABLE_X = 750;
const TABLE_W = 200;
const BASKET_X = TABLE_X - TABLE_W / 2 + 20;

// The room's passive furniture (see roomBuilder for the roles). The dryer
// and table are one-way, top-only platforms: she walks in front of them and
// only lands on them from above, so neither ever walls off the walk through
// (the yarn is optional) and a normal hop still falls short of the dryer.
const LAYOUT = [
    { name: 'roundWindow', role: 'background', sprite: 'roundWindow', x: 640, w: 96, h: 96, yFromGround: 460 },
    { name: 'washer', role: 'background', sprite: 'washer', x: 1080, w: 110, h: 110 },
    { name: 'dryer', role: 'standable', sprite: 'dryer', oneWay: true, x: DRYER_X, w: DRYER_W, h: LAUNDRY.dryerHeight },
    { name: 'foldingTable', role: 'standable', sprite: 'foldingTable', oneWay: true, x: TABLE_X, w: TABLE_W, h: LAUNDRY.tableHeight }
];

export class Laundry extends Scene
{
    constructor ()
    {
        super('Laundry');
    }

    create (data)
    {
        const { width, height } = this.scale;
        const groundTop = height - GROUND_HEIGHT;

        this.registry.get('audio')?.enterRoom(this, 'Laundry');

        this.add.rectangle(width / 2, height / 2, width, height, WALL_COLOR);

        this.solids = buildLayout(this, LAYOUT, groundTop);

        // The one-way bodies above are built from each sprite's bounds, so
        // their tops are the art's tops: the dryer's is the yarn's perch.
        const dryerTop = groundTop - LAUNDRY.dryerHeight;
        const tableTop = groundTop - LAUNDRY.tableHeight;

        this.interactions = new InteractionController(this);

        // Quest: the fourth yarn ball, up on the dryer. Pickup only once
        // she's standing on the dryer (standOnY), never from the floor or
        // the heap.
        this.yarnBalls = [];
        if (!this.registry.get('yarn:collected:dryer')) {
            const ball = new YarnBall(this, DRYER_X - 10, dryerTop - 14, 'dryer', { standOnY: dryerTop });
            this.yarnBalls.push(ball);
            this.interactions.register(ball);
        }

        // The heap's fixed spot beside the dryer. Built now, before Pusheen,
        // so it draws behind her: already lying there if the basket was
        // tipped earlier this run, otherwise hidden until the basket lands.
        const tipped = this.registry.get('laundry:basketTipped');
        this.heap = new LaundryHeap(this, HEAP_X, groundTop, { present: tipped });

        if (!tipped) {
            this.basket = new LaundryBasket(this, BASKET_X, tableTop, {
                landAt: { x: HEAP_X, y: groundTop - LAUNDRY.heapHeight / 2 },
                onLanded: () => this.heap.plopIn()
            });
            this.interactions.register(this.basket);
        }

        this.doorToLivingRoom = new Door(this, 40, groundTop, { side: 'right', to: 'LivingRoom', enterAt: 'fromLaundry' });
        this.doorToBedroom = new Door(this, 1240, groundTop, { side: 'left', to: 'Bedroom', enterAt: 'fromLaundry' });

        this.ground = this.add.rectangle(width / 2, groundTop + GROUND_HEIGHT / 2, width, GROUND_HEIGHT, GROUND_COLOR);
        this.physics.add.existing(this.ground, true);

        const spawn = resolveSpawn(SPAWN_POINTS, data);
        this.pusheen = new Pusheen(this, spawn.x, groundTop - SPAWN.heightAboveGround);
        this.physics.add.collider(this.pusheen, this.ground);
        this.solids.forEach((solid) => this.physics.add.collider(this.pusheen, solid));
        this.physics.add.collider(this.pusheen, this.heap, () => this.heap.onCollide());

        this.cursors = this.input.keyboard.createCursorKeys();
        this.keys = this.input.keyboard.addKeys('W,A,S,D,SPACE,E');
        this.registry.set('input:interactPressed', false);
        this.registry.set('interact:available', false);

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

        // Doors are walk-into triggers, outside the interaction controller.
        if (this.doorToLivingRoom.checkTrigger(this.pusheen)) {
            fadeToRoom(this, this.doorToLivingRoom.to, { spawn: this.doorToLivingRoom.enterAt, fadeIn: true });
        } else if (this.doorToBedroom.checkTrigger(this.pusheen)) {
            fadeToRoom(this, this.doorToBedroom.to, { spawn: this.doorToBedroom.enterAt, fadeIn: true });
        }

        this.pusheen.update();
        this.heap.resolveContact();
    }
}
