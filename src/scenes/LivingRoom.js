import { Scene, Input } from 'phaser';
import { NAP, JUMP } from '../config/feel.js';
import { Pusheen } from '../entities/Pusheen.js';
import { Cushion, CUSHION_HEIGHT } from '../entities/Cushion.js';
import { Cabinet, CABINET_HEIGHT } from '../entities/Cabinet.js';
import { Sunbeam } from '../entities/Sunbeam.js';

const GROUND_HEIGHT = 40;
const FLOOR_COLOR = 0xd7ccc0;
const GROUND_COLOR = 0x8d6e63;

const COUCH_COLOR = 0x8d6a53;
const COUCH_WIDTH = 200;
const COUCH_BASE_HEIGHT = 50;
// Derived from feel.js's own JUMP values (apex = v^2/2g) rather than a
// hand-copied comment, so retuning JUMP can't silently strand the cushion
// out of reach (or make it trivial to clear) without this moving too.
const JUMP_APEX_HEIGHT = (JUMP.velocity * JUMP.velocity) / (2 * JUMP.gravity);
const CUSHION_SURFACE_HEIGHT = Math.round(JUMP_APEX_HEIGHT * 0.8);

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

        // Right -- window + sunbeam with the nap trigger
        this.sunbeam = new Sunbeam(this, 1080, groundTop);

        // Center -- couch base + the one squashable cushion, reachable with a hop
        const couchBaseY = groundTop - COUCH_BASE_HEIGHT / 2;
        this.add.rectangle(width / 2, couchBaseY, COUCH_WIDTH, COUCH_BASE_HEIGHT, COUCH_COLOR);
        const cushionY = groundTop - CUSHION_SURFACE_HEIGHT + CUSHION_HEIGHT / 2;
        this.cushion = new Cushion(this, width / 2, cushionY);

        this.ground = this.add.rectangle(width / 2, groundTop + GROUND_HEIGHT / 2, width, GROUND_HEIGHT, GROUND_COLOR);
        this.physics.add.existing(this.ground, true);

        // Start near the sunbeam (right), not the cabinet -- playtest moved
        // the spawn; see the design doc's scene-layout note for why.
        this.pusheen = new Pusheen(this, 950, height - 200);
        this.physics.add.collider(this.pusheen, this.ground);
        this.physics.add.collider(this.pusheen, this.cushion, () => this.cushion.onCollide());

        this.cursors = this.input.keyboard.createCursorKeys();
        this.keys = this.input.keyboard.addKeys('W,A,S,D,SPACE,E');

        this.registry.set('cabinet:peekOpen', false);
        this.registry.set('cabinet:inInnerZone', false);
        this.registry.set('snack:collected', false);
        this.registry.set('snack:count', 0);
        this.registry.set('input:interactPressed', false);
        this.registry.set('nap:active', false);
        this.registry.set('nap:showCard', false);
        this.registry.set('nap:showPlayAgain', false);
        this.registry.set('game:restartRequested', false);

        // The registry's event emitter is global and outlives any one
        // LivingRoom instance, so a listener added on every create() (every
        // restart) would accumulate and pile up stale closures over stale
        // scene instances -- explicitly drop it on shutdown, unlike UI's
        // registry listeners, which only ever run through create() once
        // since UI itself is never restarted.
        const onSnackCollected = (parent, value) => {
            if (value) {
                this.sunbeam.illuminate();
            }
        };
        this.registry.events.on('changedata-snack:collected', onSnackCollected);
        this.events.once('shutdown', () => {
            this.registry.events.off('changedata-snack:collected', onSnackCollected);
        });
    }

    update ()
    {
        if (this.registry.get('game:restartRequested')) {
            this.registry.set('game:restartRequested', false);
            this.scene.restart();
            return;
        }

        this.cabinet.update(this.pusheen);

        // Phaser's registry fires changedata on every set(), even when the
        // value is unchanged -- guard so UI's listener only runs on the
        // real transitions, not every frame regardless of zone state.
        if (this.cabinet.inInnerZone !== this.registry.get('cabinet:inInnerZone')) {
            this.registry.set('cabinet:inInnerZone', this.cabinet.inInnerZone);
        }

        const interactPressed = Input.Keyboard.JustDown(this.keys.E) || this.registry.get('input:interactPressed');
        this.registry.set('input:interactPressed', false);

        const peekOpen = this.registry.get('cabinet:peekOpen');
        const napActive = this.registry.get('nap:active');

        if (peekOpen) {
            this.pusheen.stopMoving();

            if (interactPressed) {
                this.registry.set('cabinet:peekOpen', false);
            }
        } else if (napActive) {
            this.pusheen.stopMoving();

            if (this.registry.get('nap:showPlayAgain') && Input.Keyboard.JustDown(this.keys.SPACE)) {
                this.registry.set('game:restartRequested', true);
            }
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

            if (this.sunbeam.checkTrigger(this.pusheen, this.registry.get('snack:collected'))) {
                this.startNapSequence();
            }
        }

        this.pusheen.update();
        this.cushion.resolveContact();
    }

    startNapSequence ()
    {
        this.registry.set('nap:active', true);

        this.time.delayedCall(NAP.settleMs, () => {
            this.pusheen.playCurlUp(() => {
                this.sunbeam.startDustMotes();
                this.registry.set('nap:showCard', true);

                this.time.delayedCall(NAP.cardHoldMs, () => {
                    this.registry.set('nap:showPlayAgain', true);
                });
            });
        });
    }
}
