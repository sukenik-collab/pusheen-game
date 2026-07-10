import { Scene, Input } from 'phaser';
import { Pusheen } from '../entities/Pusheen.js';
import { Door } from '../entities/Door.js';
import { YarnBall } from '../entities/YarnBall.js';
import { fadeToRoom, fadeInRoom } from './roomTransition.js';

const GROUND_HEIGHT = 40;
const WALL_COLOR = 0x55486b;   // dusky lavender -- night-time contrast to the living room
const GROUND_COLOR = 0x46394f;

// Where she appears when walking in from the living room (just inside the
// right-wall door, clear of its trigger zone so it can't instantly re-fire).
const SPAWN_X_FROM_LIVING_ROOM = 1130;

// The room's furniture, declared as data and built by one small loop.
// Roles:
//   background -- drawn only, no physics body
//   solid      -- static body, blocks from all sides
//   standable  -- static body meant to be hopped onto (oneWay: top face only)
// Interactive things (doors, yarn, the costume box) are entities, not layout.
// `yFromGround` = center height above the floor top; omitted = sits on it.
const LAYOUT = [
    { name: 'rug', role: 'background', x: 400, w: 340, h: 14, yFromGround: 7, color: 0x8e6b7f },
    { name: 'moonWindow', role: 'background', x: 640, w: 110, h: 140, yFromGround: 510, color: 0x2f2a3d },
    { name: 'moon', role: 'background', shape: 'circle', x: 660, r: 24, yFromGround: 530, color: 0xf4eecb },
    { name: 'bed', role: 'standable', x: 400, w: 280, h: 64, color: 0x7986cb },
    { name: 'pillow', role: 'background', x: 300, w: 90, h: 26, yFromGround: 77, color: 0xe8eaf6 },
    // Low enough (< the ~82px jump apex) to hop over -- it sits mid-room and
    // must never wall off the left half.
    { name: 'dresser', role: 'solid', x: 780, w: 120, h: 70, color: 0x8d6e63 }
];

export class Bedroom extends Scene
{
    constructor ()
    {
        super('Bedroom');
    }

    create (data)
    {
        const { width, height } = this.scale;
        const groundTop = height - GROUND_HEIGHT;

        this.add.rectangle(width / 2, height / 2, width, height, WALL_COLOR);

        // Quest: yarn balls hide behind the furniture -- created before the
        // layout so they render tucked behind it, edges peeking out.
        this.yarnBalls = [];
        this.spawnYarn('bed', 262, groundTop - 14);
        // TODO(costume checkpoint): moves up onto the Pusheencorn-gated shelf.
        this.spawnYarn('shelf', 730, groundTop - 16);

        this.solids = [];
        LAYOUT.forEach((item) => this.buildLayoutItem(item, groundTop));

        this.doorToLivingRoom = new Door(this, 1240, groundTop, 'left');

        this.ground = this.add.rectangle(width / 2, groundTop + GROUND_HEIGHT / 2, width, GROUND_HEIGHT, GROUND_COLOR);
        this.physics.add.existing(this.ground, true);

        this.pusheen = new Pusheen(this, data?.spawnX ?? SPAWN_X_FROM_LIVING_ROOM, height - 200);
        this.physics.add.collider(this.pusheen, this.ground);
        this.solids.forEach((solid) => this.physics.add.collider(this.pusheen, solid));

        this.cursors = this.input.keyboard.createCursorKeys();
        this.keys = this.input.keyboard.addKeys('W,A,S,D,SPACE,E');
        this.registry.set('input:interactPressed', false);
        this.registry.set('interact:available', false);

        this.transitioning = false;
        fadeInRoom(this);
    }

    spawnYarn (id, x, y)
    {
        if (!this.registry.get(`yarn:collected:${id}`)) {
            this.yarnBalls.push(new YarnBall(this, x, y, id));
        }
    }

    buildLayoutItem (item, groundTop)
    {
        const y = groundTop - (item.yFromGround ?? item.h / 2);
        const obj = item.shape === 'circle'
            ? this.add.circle(item.x, y, item.r, item.color)
            : this.add.rectangle(item.x, y, item.w, item.h, item.color);

        if (item.role === 'solid' || item.role === 'standable') {
            this.physics.add.existing(obj, true);

            if (item.oneWay) {
                // Land on the top face only -- she can jump up through it
                // instead of bonking the underside.
                obj.body.checkCollision.down = false;
                obj.body.checkCollision.left = false;
                obj.body.checkCollision.right = false;
            }

            this.solids.push(obj);
        }
    }

    update ()
    {
        if (this.transitioning) {
            this.pusheen.stopMoving();
            this.pusheen.update();
            return;
        }

        this.yarnBalls.forEach((ball) => ball.update(this.pusheen));

        const interactAvailable = this.yarnBalls.some((ball) => ball.inInnerZone);
        if (interactAvailable !== this.registry.get('interact:available')) {
            this.registry.set('interact:available', interactAvailable);
        }

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
            this.yarnBalls.find((ball) => ball.inInnerZone)?.collect();
        }

        if (this.doorToLivingRoom.checkTrigger(this.pusheen)) {
            fadeToRoom(this, 'LivingRoom', { spawnX: 150, fadeIn: true });
        }

        this.pusheen.update();
    }
}
