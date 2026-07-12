import { Scene, Input } from 'phaser';
import { NAP, JUMP } from '../config/feel.js';
import { resetRunState } from '../config/gameState.js';
import { Pusheen } from '../entities/Pusheen.js';
import { Cushion, CUSHION_HEIGHT } from '../entities/Cushion.js';
import { Cabinet, CABINET_HEIGHT } from '../entities/Cabinet.js';
import { Sunbeam } from '../entities/Sunbeam.js';
import { Door } from '../entities/Door.js';
import { Stormy } from '../entities/Stormy.js';
import { YarnBall } from '../entities/YarnBall.js';
import { fadeToRoom, fadeInRoom } from './roomTransition.js';

const GROUND_HEIGHT = 40;
const FLOOR_COLOR = 0xd7ccc0;
const GROUND_COLOR = 0x8d6e63;

const COUCH_BASE_HEIGHT = 50;
// Fresh-lap spawn (near the sunbeam); walking in from the bedroom instead
// spawns just inside the left-wall door, clear of its trigger zone.
const SPAWN_X_DEFAULT = 950;
const SPAWN_X_FROM_BEDROOM = 150;
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

    create (data)
    {
        const { width, height } = this.scale;
        const groundTop = height - GROUND_HEIGHT;

        // Restart can happen mid-nap-swell (Play again) -- put the bed back to
        // its base volume before the fresh loop begins.
        this.audio = this.registry.get('audio');
        this.audio?.resetMusicVolume();

        this.add.rectangle(width / 2, height / 2, width, height, FLOOR_COLOR);

        // Left -- cabinet with the sniff/peek radar
        this.cabinet = new Cabinet(this, 180, groundTop - CABINET_HEIGHT / 2);

        // Right -- window + sunbeam with the nap trigger
        this.sunbeam = new Sunbeam(this, 1080, groundTop);

        // Far left -- doorway to the bedroom
        this.doorToBedroom = new Door(this, 40, groundTop, 'right');

        // Center -- couch base + the one squashable cushion, reachable with a hop.
        // The base gets its own solid static body (matching its real, wider
        // footprint) so the couch reads as one continuous solid piece -- without
        // it, only the narrower cushion above collided, and walking up to the
        // couch meant bonking into that floating box from the side instead of
        // being blocked by the couch itself.
        // Quest: one yarn ball hides behind the couch's left arm -- created
        // before the couch so it renders tucked behind it, edge peeking out.
        this.yarnBalls = [];
        this.spawnYarn('couch', 550, groundTop - 14);

        const couchBaseY = groundTop - COUCH_BASE_HEIGHT / 2;
        this.couchBase = this.add.image(width / 2, couchBaseY, 'couchBase');
        this.physics.add.existing(this.couchBase, true);
        const cushionY = groundTop - CUSHION_SURFACE_HEIGHT + CUSHION_HEIGHT / 2;
        this.cushion = new Cushion(this, width / 2, cushionY);

        this.ground = this.add.rectangle(width / 2, groundTop + GROUND_HEIGHT / 2, width, GROUND_HEIGHT, GROUND_COLOR);
        this.physics.add.existing(this.ground, true);

        // Stormy waits between the couch and the sunbeam, near the spawn,
        // so a fresh lap meets her (and hears about the yarn) right away.
        this.stormy = new Stormy(this, 820, groundTop);

        // Start near the sunbeam (right), not the cabinet -- playtest moved
        // the spawn; see the design doc's scene-layout note for why.
        this.pusheen = new Pusheen(this, data?.spawnX ?? SPAWN_X_DEFAULT, height - 200);
        this.physics.add.collider(this.pusheen, this.ground);
        this.physics.add.collider(this.pusheen, this.couchBase);
        this.physics.add.collider(this.pusheen, this.cushion, () => this.cushion.onCollide());

        this.cursors = this.input.keyboard.createCursorKeys();
        this.keys = this.input.keyboard.addKeys('W,A,S,D,SPACE,E');

        // Visit-scoped keys only -- run progress (snack, quest) lives in
        // gameState.js so a room transition back here can't wipe it.
        this.registry.set('cabinet:peekOpen', false);
        this.registry.set('interact:available', false);
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

        // Returning from the bedroom with the snack already found: re-light
        // the beam immediately so the room still points at the nap spot.
        if (this.registry.get('snack:collected')) {
            this.sunbeam.illuminate();
        }

        this.transitioning = false;

        if (data?.fadeIn) {
            fadeInRoom(this);
        }
    }

    update ()
    {
        if (this.registry.get('game:restartRequested')) {
            this.registry.set('game:restartRequested', false);
            resetRunState(this.registry);
            this.scene.restart({ spawnX: SPAWN_X_DEFAULT, fadeIn: false });
            return;
        }

        if (this.transitioning) {
            this.pusheen.stopMoving();
            this.pusheen.update();
            return;
        }

        this.cabinet.update(this.pusheen);
        this.stormy.update(this.pusheen);
        this.yarnBalls.forEach((ball) => ball.update(this.pusheen));

        // Phaser's registry fires changedata on every set(), even when the
        // value is unchanged -- guard so UI's listener only runs on the
        // real transitions, not every frame regardless of zone state.
        const interactAvailable = !this.registry.get('nap:active') && (
            (this.cabinet.inInnerZone && !this.registry.get('snack:collected')) ||
            this.stormy.inInnerZone ||
            this.yarnBalls.some((ball) => ball.inInnerZone)
        );
        if (interactAvailable !== this.registry.get('interact:available')) {
            this.registry.set('interact:available', interactAvailable);
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

            if (interactPressed) {
                if (this.cabinet.inInnerZone && !this.registry.get('snack:collected')) {
                    this.registry.set('cabinet:peekOpen', true);
                } else if (this.stormy.inInnerZone) {
                    this.stormy.interact();
                } else {
                    this.yarnBalls.find((ball) => ball.inInnerZone)?.collect();
                }
            }

            if (this.sunbeam.checkTrigger(this.pusheen, this.registry.get('snack:collected'))) {
                this.startNapSequence();
            }

            if (this.doorToBedroom.checkTrigger(this.pusheen)) {
                fadeToRoom(this, 'Bedroom', { fadeIn: true });
            }
        }

        this.pusheen.update();
        this.cushion.resolveContact();
    }

    spawnYarn (id, x, y)
    {
        if (!this.registry.get(`yarn:collected:${id}`)) {
            this.yarnBalls.push(new YarnBall(this, x, y, id));
        }
    }

    startNapSequence ()
    {
        this.registry.set('nap:active', true);
        this.audio?.duckForNap(this);

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
