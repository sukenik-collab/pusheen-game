import { Scene, Input } from 'phaser';
import { JUMP, COSTUME } from '../config/feel.js';
import { Pusheen } from '../entities/Pusheen.js';
import { Door } from '../entities/Door.js';
import { YarnBall } from '../entities/YarnBall.js';
import { Pillow, PILLOW_HEIGHT } from '../entities/Pillow.js';
import { CostumeBox } from '../entities/CostumeBox.js';
import { buildLayout } from '../systems/roomBuilder.js';
import { InteractionController } from '../systems/InteractionController.js';
import { fadeToRoom, fadeInRoom } from './roomTransition.js';

const GROUND_HEIGHT = 40;
const WALL_COLOR = 0x55486b;   // dusky lavender -- night-time contrast to the living room
const GROUND_COLOR = 0x46394f;

// Where she appears when walking in from the living room (just inside the
// right-wall door, clear of its trigger zone so it can't instantly re-fire).
const SPAWN_X_FROM_LIVING_ROOM = 1130;

// The bed's *mattress* surface -- where she actually stands -- is not the top
// of the bed sprite. The sprite is 64 tall but its mattress top sits at the
// art's y=20 inset (the headboard/foot posts stick up above it), so the
// standable surface is 44px above the floor. Colliding at the sprite top
// instead would leave her floating a post-height above the sheets.
const BED_SURFACE_HEIGHT = 44;
// The pillow is a small step resting on the mattress that she hops onto; its
// top is the highest launch point a normal hop can start from.
const PILLOW_SURFACE_HEIGHT = BED_SURFACE_HEIGHT + PILLOW_HEIGHT;

// The shelf is the one costume-gated spot: above what a normal hop can reach
// even launching from the pillow (the tallest step), but comfortably under the
// Pusheencorn apex from the floor. Sit it 70% of the way up that gap -- a
// little higher than dead-center so a normal hop lands definitively short.
// Derived from the feel values so retuning either jump moves it.
const NORMAL_APEX = (JUMP.velocity * JUMP.velocity) / (2 * JUMP.gravity);
const COSTUME_APEX = (COSTUME.jumpVelocity * COSTUME.jumpVelocity) / (2 * COSTUME.gravity);
const NORMAL_REACH = PILLOW_SURFACE_HEIGHT + NORMAL_APEX;
const SHELF_SURFACE_HEIGHT = Math.round(NORMAL_REACH + (COSTUME_APEX - NORMAL_REACH) * 0.7);
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
    // Bed is drawn only; its real standable surface (the mattress, inset below
    // the sprite top) is a separate solid body built in create(), and the
    // pillow is the squishy Pillow entity -- both live in create(), not here.
    { name: 'bed', role: 'background', sprite: 'bed', x: 400, w: 280, h: 64 },
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
        // Tucked toward the left end of the shelf, clear of the bed below.
        this.spawnYarn('shelf', 70, groundTop - SHELF_SURFACE_HEIGHT - 14);

        this.solids = buildLayout(this, LAYOUT, groundTop);

        // The bed's standable surface: a solid body whose top is the mattress
        // (not the sprite top), so she stands on the sheets instead of floating
        // at the headboard-post height. Inset and only mattress-high on purpose;
        // the raised end frame is handled by the posts below. Invisible (the
        // bed sprite draws the bed).
        const mattressTop = groundTop - BED_SURFACE_HEIGHT;
        this.bedBody = this.add.rectangle(400, (mattressTop + groundTop) / 2, 240, BED_SURFACE_HEIGHT)
            .setVisible(false);
        this.physics.add.existing(this.bedBody, true);
        this.solids.push(this.bedBody);

        // Headboard + footboard: the frame's end posts rise above the mattress,
        // so they should stop her -- both walking in at floor level and walking
        // off the ends while up on the sheets. The mattress body is inset and
        // only mattress-high, so without these she clips into the drawn frame
        // and walks straight through the posts. Full sprite height; she still
        // mounts the bed by hopping onto the mattress (apex clears the posts).
        const BED_FRAME_HEIGHT = 64;   // matches the bed sprite's height
        const POST_W = 20;             // frame inset: (spriteW 280 - mattress 240) / 2
        const frameTop = groundTop - BED_FRAME_HEIGHT;
        [270, 530].forEach((postX) => {   // sprite ends at 260 / 540
            const post = this.add.rectangle(postX, (frameTop + groundTop) / 2, POST_W, BED_FRAME_HEIGHT)
                .setVisible(false);
            this.physics.add.existing(post, true);
            this.solids.push(post);
        });

        // Squishy pillow -- a small raised step on the left of the mattress she
        // hops onto. Built after the layout so it renders over the bed's art.
        this.pillow = new Pillow(this, 330, groundTop - PILLOW_SURFACE_HEIGHT + PILLOW_HEIGHT / 2);

        this.doorToLivingRoom = new Door(this, 1240, groundTop, 'left');

        // The Pusheencorn box, between the dresser and the door.
        this.costumeBox = new CostumeBox(this, 970, groundTop);

        // One dispatcher for every E-press interaction in this room. Register
        // yarn before the box to preserve the old yarn-first tie-break (moot
        // today -- their zones don't overlap -- but explicit). The door is a
        // walk-into trigger and stays out (see InteractionController's note).
        this.interactions = new InteractionController(this);
        this.yarnBalls.forEach((ball) => this.interactions.register(ball));
        this.interactions.register(this.costumeBox);

        this.ground = this.add.rectangle(width / 2, groundTop + GROUND_HEIGHT / 2, width, GROUND_HEIGHT, GROUND_COLOR);
        this.physics.add.existing(this.ground, true);

        this.pusheen = new Pusheen(this, data?.spawnX ?? SPAWN_X_FROM_LIVING_ROOM, height - 200);
        this.physics.add.collider(this.pusheen, this.ground);
        this.solids.forEach((solid) => this.physics.add.collider(this.pusheen, solid));
        this.physics.add.collider(this.pusheen, this.pillow, () => this.pillow.onCollide());

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

        // Updates every registered interactable's zones/cues and publishes
        // interact:available (guarded).
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

        // The door is a walk-into trigger, handled here rather than through the
        // interaction controller (see the controller's note on triggers).
        if (this.doorToLivingRoom.checkTrigger(this.pusheen)) {
            fadeToRoom(this, 'LivingRoom', { spawnX: 150, fadeIn: true });
        }

        this.pusheen.update();
        this.pillow.resolveContact();
    }
}
