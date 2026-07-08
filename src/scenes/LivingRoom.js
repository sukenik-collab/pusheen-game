import { Scene, Input } from 'phaser';
import { Pusheen } from '../entities/Pusheen.js';
import { Cushion, CUSHION_HEIGHT } from '../entities/Cushion.js';
import { Cabinet, CABINET_HEIGHT } from '../entities/Cabinet.js';

const GROUND_HEIGHT = 40;
const FLOOR_COLOR = 0xd7ccc0;
const GROUND_COLOR = 0x8d6e63;

const COUCH_COLOR = 0x8d6a53;
const COUCH_WIDTH = 200;
const COUCH_BASE_HEIGHT = 50;
// Jump apex is v^2/(2g) = 480^2/(2*1400) =~ 82px -- keep the cushion surface
// comfortably under that so a normal hop reaches it.
const CUSHION_SURFACE_HEIGHT = 65;

const WINDOW_COLOR = 0xdff1f7;
const WINDOW_WIDTH = 120;
const WINDOW_HEIGHT = 160;

const SUNBEAM_COLOR = 0xfff2b2;
const SUNBEAM_ALPHA = 0.55;
const SUNBEAM_WIDTH = 200;
const SUNBEAM_HEIGHT = 50;

export class LivingRoom extends Scene
{
    constructor ()
    {
        super('LivingRoom');
    }

    create ()
    {
        const { width, height } = this.scale;
        const groundTop = height - GROUND_HEIGHT;

        this.add.rectangle(width / 2, height / 2, width, height, FLOOR_COLOR);

        // Left -- cabinet with the sniff/peek radar
        this.cabinet = new Cabinet(this, 180, groundTop - CABINET_HEIGHT / 2);

        // Right -- window + sunbeam (placeholder; nap trigger lands in Phase 4)
        this.add.rectangle(1080, 150, WINDOW_WIDTH, WINDOW_HEIGHT, WINDOW_COLOR);
        this.add.rectangle(1080, groundTop - 10, SUNBEAM_WIDTH, SUNBEAM_HEIGHT, SUNBEAM_COLOR)
            .setAlpha(SUNBEAM_ALPHA);

        // Center -- couch base + the one squashable cushion, reachable with a hop
        const couchBaseY = groundTop - COUCH_BASE_HEIGHT / 2;
        this.add.rectangle(width / 2, couchBaseY, COUCH_WIDTH, COUCH_BASE_HEIGHT, COUCH_COLOR);
        const cushionY = groundTop - CUSHION_SURFACE_HEIGHT + CUSHION_HEIGHT / 2;
        this.cushion = new Cushion(this, width / 2, cushionY);

        this.ground = this.add.rectangle(width / 2, groundTop + GROUND_HEIGHT / 2, width, GROUND_HEIGHT, GROUND_COLOR);
        this.physics.add.existing(this.ground, true);

        this.pusheen = new Pusheen(this, 300, height - 200);
        this.physics.add.collider(this.pusheen, this.ground);
        this.physics.add.collider(this.pusheen, this.cushion, () => this.cushion.onCollide());

        this.cursors = this.input.keyboard.createCursorKeys();
        this.keys = this.input.keyboard.addKeys('W,A,S,D,SPACE,E');

        this.registry.set('cabinet:peekOpen', false);
        this.registry.set('cabinet:inInnerZone', false);
        this.registry.set('snack:collected', false);
        this.registry.set('snack:count', 0);
        this.registry.set('input:interactPressed', false);
    }

    update ()
    {
        this.cabinet.update(this.pusheen);
        this.registry.set('cabinet:inInnerZone', this.cabinet.inInnerZone);

        const interactPressed = Input.Keyboard.JustDown(this.keys.E) || this.registry.get('input:interactPressed');
        this.registry.set('input:interactPressed', false);

        const peekOpen = this.registry.get('cabinet:peekOpen');

        if (peekOpen) {
            this.pusheen.stopMoving();
        } else {
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

            if (interactPressed && this.cabinet.inInnerZone && !this.registry.get('snack:collected')) {
                this.registry.set('cabinet:peekOpen', true);
            }
        }

        this.pusheen.update();
        this.cushion.resolveContact();
    }
}
