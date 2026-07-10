import { Scene, Input } from 'phaser';
import { JUMP, COSTUME } from '../config/feel.js';
import { Pusheen } from '../entities/Pusheen.js';
import { Door } from '../entities/Door.js';
import { YarnBall } from '../entities/YarnBall.js';
import { CostumeBox } from '../entities/CostumeBox.js';
import { fadeToRoom, fadeInRoom } from './roomTransition.js';

const GROUND_HEIGHT = 40;
const WALL_COLOR = 0x55486b;   // dusky lavender -- night-time contrast to the living room
const GROUND_COLOR = 0x46394f;

// Where she appears when walking in from the living room (just inside the
// right-wall door, clear of its trigger zone so it can't instantly re-fire).
const SPAWN_X_FROM_LIVING_ROOM = 1130;

// The shelf is the one costume-gated spot: its surface sits above what a
// normal hop can reach even from the bed top (64 + ~82px apex = 146), but
// comfortably under the Pusheencorn jump's ~192px apex. Derived from the
// feel values, same as the living room's cushion height, so retuning
// either jump moves the shelf with it.
const NORMAL_APEX = (JUMP.velocity * JUMP.velocity) / (2 * JUMP.gravity);
const COSTUME_APEX = (COSTUME.jumpVelocity * COSTUME.jumpVelocity) / (2 * COSTUME.gravity);
const SHELF_SURFACE_HEIGHT = Math.round((NORMAL_APEX + 64 + COSTUME_APEX) / 2);
const SHELF_THICKNESS = 16;

// The room's furniture, declared as data and built by one small loop.
// Roles:
//   background -- drawn only, no physics body
//   solid      -- static body, blocks from all sides
//   standable  -- static body meant to be hopped onto (oneWay: top face only)
// Interactive things (doors, yarn, the costume box) are entities, not layout.
// `yFromGround` = center height above the floor top; omitted = sits on it.
// `sprite` art is sized to match w/h exactly, so the static body a sprite
// gets from its image bounds equals the declared footprint.
const LAYOUT = [
    { name: 'rug', role: 'background', sprite: 'rug', x: 400, w: 340, h: 14, yFromGround: 7 },
    { name: 'moonWindow', role: 'background', sprite: 'moonWindow', x: 640, w: 110, h: 140, yFromGround: 510 },
    { name: 'bed', role: 'standable', sprite: 'bed', x: 400, w: 280, h: 64 },
    { name: 'pillow', role: 'background', sprite: 'pillow', x: 300, w: 90, h: 26, yFromGround: 77 },
    // Low enough (< the ~82px jump apex) to hop over -- it sits mid-room and
    // must never wall off the left half.
    { name: 'dresser', role: 'solid', sprite: 'dresser', x: 780, w: 120, h: 70 },
    // The costume-gated high shelf, one-way so she floats up through it and
    // lands on top. Kept horizontally clear of anything standable.
    { name: 'shelf', role: 'standable', sprite: 'shelf', oneWay: true, x: 130, w: 180, h: SHELF_THICKNESS, yFromGround: SHELF_SURFACE_HEIGHT - SHELF_THICKNESS / 2 }
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

        // Quest: one yarn ball hides behind the bed (created before the
        // layout so it renders tucked behind it, edge peeking out); the
        // last one sits up on the costume-gated shelf, visible from below
        // but only reachable with the Pusheencorn jump.
        this.yarnBalls = [];
        this.spawnYarn('bed', 262, groundTop - 14);
        this.spawnYarn('shelf', 130, groundTop - SHELF_SURFACE_HEIGHT - 14);

        this.solids = [];
        LAYOUT.forEach((item) => this.buildLayoutItem(item, groundTop));

        this.doorToLivingRoom = new Door(this, 1240, groundTop, 'left');

        // The Pusheencorn box, between the dresser and the door.
        this.costumeBox = new CostumeBox(this, 970, groundTop);

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
        const obj = item.sprite
            ? this.add.image(item.x, y, item.sprite)
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

        // While the box beat runs, tweens own Pusheen (her body is off) --
        // no input, no zone updates, no land-squash detection.
        if (this.costumeBox.busy) {
            return;
        }

        this.yarnBalls.forEach((ball) => ball.update(this.pusheen));
        this.costumeBox.update(this.pusheen);

        const interactAvailable = this.yarnBalls.some((ball) => ball.inInnerZone) ||
            this.costumeBox.inInnerZone;
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
            const ball = this.yarnBalls.find((b) => b.inInnerZone);

            if (ball) {
                ball.collect();
            } else if (this.costumeBox.inInnerZone) {
                this.costumeBox.interact(this.pusheen);
            }
        }

        if (this.doorToLivingRoom.checkTrigger(this.pusheen)) {
            fadeToRoom(this, 'LivingRoom', { spawnX: 150, fadeIn: true });
        }

        this.pusheen.update();
    }
}
