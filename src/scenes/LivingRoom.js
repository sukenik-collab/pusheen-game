import { Scene } from 'phaser';
import { Pusheen } from '../entities/Pusheen.js';

const GROUND_HEIGHT = 40;
const FLOOR_COLOR = 0xd7ccc0;
const GROUND_COLOR = 0x8d6e63;

export class LivingRoom extends Scene
{
    constructor ()
    {
        super('LivingRoom');
    }

    create ()
    {
        const { width, height } = this.scale;

        this.add.rectangle(width / 2, height / 2, width, height, FLOOR_COLOR);

        const groundY = height - GROUND_HEIGHT / 2;
        this.ground = this.add.rectangle(width / 2, groundY, width, GROUND_HEIGHT, GROUND_COLOR);
        this.physics.add.existing(this.ground, true);

        this.pusheen = new Pusheen(this, width / 2, height - 200);
        this.physics.add.collider(this.pusheen, this.ground);

        this.cursors = this.input.keyboard.createCursorKeys();
        this.keys = this.input.keyboard.addKeys('W,A,S,D,SPACE');
    }

    update ()
    {
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

        this.pusheen.update();
    }
}
