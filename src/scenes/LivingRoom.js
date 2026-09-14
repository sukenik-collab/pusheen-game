import { Scene, Input } from 'phaser';
import { NAP, JUMP } from '../config/feel.js';
import { resetRunState } from '../config/gameState.js';
import { Pusheen } from '../entities/Pusheen.js';
import { Cushion, CUSHION_HEIGHT } from '../entities/Cushion.js';
import { Container } from '../entities/Container.js';
import { Sunbeam } from '../entities/Sunbeam.js';
import { Door } from '../entities/Door.js';
import { Stormy } from '../entities/Stormy.js';
import { YarnBall } from '../entities/YarnBall.js';
import { buildLayout } from '../systems/roomBuilder.js';
import { InteractionController } from '../systems/InteractionController.js';
import { subscribeRegistry } from '../systems/registryHelpers.js';
import { fadeToRoom, fadeInRoom, resolveSpawn } from './roomTransition.js';

const GROUND_HEIGHT = 40;
const FLOOR_COLOR = 0xd7ccc0;
const GROUND_COLOR = 0x8d6e63;

const COUCH_BASE_HEIGHT = 50;
// The cabinet's placement height (was exported from the now-deleted Cabinet.js).
const CABINET_HEIGHT = 160;

// The cabinet's contents, previously hardcoded in the UI scene. Order is
// preserved (socks, t-shirt, popcorn) so number keys 1/2/3 map identically.
// `effect` drives what selecting an item does: 'takeSnack' collects it, 'nope'
// gives the little decoy shake. Lives with the container now, not in the UI.
const CABINET_CONTENTS = [
    { key: 'socks', label: 'Socks', sprite: 'itemSocks', effect: 'nope' },
    { key: 'tshirt', label: 'T-Shirt', sprite: 'itemShirt', effect: 'nope' },
    { key: 'popcorn', label: 'Popcorn', sprite: 'itemPopcorn', effect: 'takeSnack' }
];
// Named entry points. default = a fresh lap near the sunbeam (now reached only
// via a door -- a fresh boot/Play again starts in the Backyard); fromBedroom =
// through the left-wall door; fromBackyard = through the right-wall hidden path,
// just inside it and clear of its trigger.
const SPAWN_POINTS = {
    default: { x: 950 },
    fromBedroom: { x: 150 },
    fromBackyard: { x: 1130 }
};
// Derived from feel.js's own JUMP values (apex = v^2/2g) rather than a
// hand-copied comment, so retuning JUMP can't silently strand the cushion
// out of reach (or make it trivial to clear) without this moving too.
const JUMP_APEX_HEIGHT = (JUMP.velocity * JUMP.velocity) / (2 * JUMP.gravity);
const CUSHION_SURFACE_HEIGHT = Math.round(JUMP_APEX_HEIGHT * 0.8);

// The room's one piece of solid furniture, as data built by the shared
// roomBuilder (same construction path as the Bedroom). Its own solid body,
// wider than the cushion above, makes the couch read as one continuous piece
// -- without it, only the narrower cushion collided and walking up meant
// bonking a floating box from the side. The cabinet, cushion, yarn, sunbeam,
// and door are entities, not layout. The couch yarn is spawned in create()
// *before* this runs so it renders tucked behind the couch's left arm -- that
// render-order nuance stays in create() (see roomBuilder's note).
const LAYOUT = [
    { name: 'couchBase', role: 'solid', sprite: 'couchBase', x: 640, yFromGround: COUCH_BASE_HEIGHT / 2 }
];

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

        // Re-entering through a door after a nap (the swell leaves the bed
        // above its base volume) -- put it back before this visit begins.
        this.audio = this.registry.get('audio');
        this.audio?.resetMusicVolume();

        this.add.rectangle(width / 2, height / 2, width, height, FLOOR_COLOR);

        // Left -- cabinet with the sniff/peek radar. A generic Container; its
        // snack-gate (goes quiet once the snack is found) is the isActionable
        // predicate, and its contents drive the UI peek panel.
        this.cabinet = new Container(this, 180, groundTop - CABINET_HEIGHT / 2, {
            sprite: 'cabinet',
            contents: CABINET_CONTENTS,
            isActionable: (scene) => !scene.registry.get('snack:collected')
        });

        // Right -- window + sunbeam with the nap trigger
        this.sunbeam = new Sunbeam(this, 1080, groundTop);

        // Far left -- doorway to the bedroom
        this.doorToBedroom = new Door(this, 40, groundTop, { side: 'right', to: 'Bedroom', enterAt: 'fromLivingRoom' });

        // Far right -- the revealed hidden path back to the Backyard. Always
        // active here: the LivingRoom is only reachable at all once Sloth's been
        // woken (the backyard side is reveal-gated), so arriving here already
        // implies the path is open.
        this.doorToBackyard = new Door(this, 1240, groundTop, { side: 'left', to: 'Backyard', enterAt: 'fromLivingRoom' });

        // Center -- couch base (built from LAYOUT below) + the one squashable
        // cushion, reachable with a hop. Quest: one yarn ball hides behind the
        // couch's left arm -- spawned before the couch is built so it renders
        // tucked behind it, edge peeking out (render-order nuance kept here).
        this.yarnBalls = [];
        this.spawnYarn('couch', 550, groundTop - 14);

        this.solids = buildLayout(this, LAYOUT, groundTop);

        const cushionY = groundTop - CUSHION_SURFACE_HEIGHT + CUSHION_HEIGHT / 2;
        this.cushion = new Cushion(this, width / 2, cushionY);

        this.ground = this.add.rectangle(width / 2, groundTop + GROUND_HEIGHT / 2, width, GROUND_HEIGHT, GROUND_COLOR);
        this.physics.add.existing(this.ground, true);

        // Stormy waits between the couch and the sunbeam, near the spawn,
        // so a fresh lap meets her (and hears about the yarn) right away.
        this.stormy = new Stormy(this, 820, groundTop);

        // One dispatcher for every E-press interaction here, registered in the
        // old positional priority order (cabinet > Stormy > yarn) as the
        // tie-break. Today the zones don't overlap, so nearest-dispatch already
        // reproduces that priority. The door + sunbeam are walk-into triggers
        // and stay out of the controller (see its note on triggers).
        this.interactions = new InteractionController(this);
        [this.cabinet, this.stormy, ...this.yarnBalls].forEach((item) => this.interactions.register(item));

        // Start near the sunbeam (right), not the cabinet -- playtest moved
        // the spawn; see the design doc's scene-layout note for why.
        const spawn = resolveSpawn(SPAWN_POINTS, data);
        this.pusheen = new Pusheen(this, spawn.x, height - 200);
        this.physics.add.collider(this.pusheen, this.ground);
        this.solids.forEach((solid) => this.physics.add.collider(this.pusheen, solid));
        this.physics.add.collider(this.pusheen, this.cushion, () => this.cushion.onCollide());

        this.cursors = this.input.keyboard.createCursorKeys();
        this.keys = this.input.keyboard.addKeys('W,A,S,D,SPACE,E');

        // Visit-scoped keys only -- run progress (snack, quest) lives in
        // gameState.js so a room transition back here can't wipe it.
        this.registry.set('peek:open', false);
        this.registry.set('interact:available', false);
        this.registry.set('input:interactPressed', false);
        this.registry.set('nap:active', false);
        this.registry.set('nap:showCard', false);
        this.registry.set('nap:showPlayAgain', false);
        this.registry.set('game:restartRequested', false);

        // Light the beam the moment the snack is found. subscribeRegistry
        // drops the listener on shutdown -- the registry emitter outlives any
        // one LivingRoom instance, so a listener re-added on every create()
        // (every restart) would otherwise pile up stale closures over dead
        // scenes. (UI's registry listeners don't need this: UI is never
        // restarted, so its create() runs exactly once.)
        subscribeRegistry(this, 'snack:collected', (parent, value) => {
            if (value) {
                this.sunbeam.illuminate();
            }
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

            // The nap swell leaves the music above its base volume, and a fresh
            // lap now leaves for the Backyard instead of restarting this room
            // -- so reset it here, on the path out, rather than relying on this
            // room's create() (which a new lap may not reach again for a while).
            this.audio?.resetMusicVolume();

            // A fresh lap now begins in the garden, not here -- so Play again
            // transitions to the Backyard rather than restarting in place.
            // Clear the nap card/button first (they live on the persistent UI
            // scene, which this transition doesn't restart) so they don't hang
            // over the fade into the yard.
            this.registry.set('nap:active', false);
            this.registry.set('nap:showCard', false);
            this.registry.set('nap:showPlayAgain', false);

            fadeToRoom(this, 'Backyard', { fadeIn: true });
            return;
        }

        if (this.transitioning) {
            this.pusheen.stopMoving();
            this.pusheen.update();
            return;
        }

        // Updates every registered interactable's zones/cues and publishes
        // interact:available (guarded). Suppressed during the nap so the
        // button can't reappear mid-payoff -- the old !nap:active guard.
        this.interactions.update(this.pusheen, { suppress: this.registry.get('nap:active') });

        const interactPressed = Input.Keyboard.JustDown(this.keys.E) || this.registry.get('input:interactPressed');
        this.registry.set('input:interactPressed', false);

        const peekOpen = this.registry.get('peek:open');
        const napActive = this.registry.get('nap:active');

        if (peekOpen) {
            this.pusheen.stopMoving();

            if (interactPressed) {
                this.registry.set('peek:open', false);
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
                this.interactions.pressInteract(this.pusheen);
            }

            if (this.sunbeam.checkTrigger(this.pusheen, this.registry.get('snack:collected'))) {
                this.startNapSequence();
            }

            if (this.doorToBedroom.checkTrigger(this.pusheen)) {
                fadeToRoom(this, this.doorToBedroom.to, { spawn: this.doorToBedroom.enterAt, fadeIn: true });
            } else if (this.doorToBackyard.checkTrigger(this.pusheen)) {
                fadeToRoom(this, this.doorToBackyard.to, { spawn: this.doorToBackyard.enterAt, fadeIn: true });
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
