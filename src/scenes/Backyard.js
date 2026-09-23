import { Scene, Input } from 'phaser';
import { SLOTH, SPAWN } from '../config/feel.js';
import { Pusheen } from '../entities/Pusheen.js';
import { Sloth } from '../entities/Sloth.js';
import { Door } from '../entities/Door.js';
import { InteractionController } from '../systems/InteractionController.js';
import { bindReveal } from '../systems/Reveal.js';
import { fadeToRoom, fadeInRoom, resolveSpawn } from './roomTransition.js';
import { BACKYARD } from './Preloader.js';

const GROUND_HEIGHT = 40;

// The horizon. Pusheen walks at groundTop, well below it, so the band between
// the two reads as ground running back to the hedge.
const GRASS_TOP = 596;

// The tree is its own layer, scaled and placed so its branch lands where Sloth
// wraps it: between his far arms and the rest of him (SLOTH.restHeight is
// derived from the same numbers -- see the note there). Its trunk base sits on
// groundTop, 2px of transparent padding included.
const TREE_X = 560;
const TREE_SCALE = 0.8;

// The boot room. Named entry points: default = fresh boot / Play again (out in
// the yard, to Sloth's right so approaching her fires the lead cue); fromKitchen
// = just inside the right screen door; fromLivingRoom = just inside the hidden
// path once it's revealed. Arriving inside a doorway can't re-fire it: a Door
// arms only once she's clear of its zone.
const SPAWN_POINTS = {
    default: { x: 980 },
    fromKitchen: { x: 1130 },
    fromLivingRoom: { x: 880 }
};

// Sloth hangs from the tree's low branch, out along its level stretch and clear
// of the leaf sprigs at the tip; the gate is revealed directly behind that spot.
const SLOTH_X = 700;

export class Backyard extends Scene
{
    constructor ()
    {
        super('Backyard');
    }

    create (data)
    {
        const { width, height } = this.scale;
        const groundTop = height - GROUND_HEIGHT;

        // Scenery, back to front -- creation order is depth order here as it is
        // everywhere else in this codebase.
        this.add.rectangle(width / 2, height / 2, width, height, BACKYARD.sky);
        this.add.image(210, 140, 'cloud').setScale(0.85);
        this.add.image(1105, 205, 'cloud').setScale(0.6);
        this.add.image(940, 125, 'sun');
        this.add.rectangle(width / 2, (GRASS_TOP + height) / 2, width, height - GRASS_TOP, BACKYARD.grass);
        this.add.image(width / 2, GRASS_TOP, 'bushes').setOrigin(0.5, BACKYARD.bushLine / BACKYARD.bushHeight);
        const tree = this.add.image(TREE_X, groundTop + 2, 'tree').setOrigin(0.5, 1).setScale(TREE_SCALE);

        this.solids = [];

        // Hidden garden gate to the LivingRoom -- built BEFORE Sloth so he draws
        // over it, hanging in front of it. Placed behind where he hangs, and
        // revealed as he ambles clear on waking. Inert until then (bindReveal).
        this.doorToLivingRoom = new Door(this, SLOTH_X, groundTop, { texture: 'gardenGate', side: 'right', to: 'LivingRoom', enterAt: 'fromBackyard', initiallyActive: false });

        // The sleepy friend, dozing on the low tree branch -- wrapped around it:
        // his far arms draw under the tree, the rest of him over it.
        this.sloth = new Sloth(this, SLOTH_X, groundTop, { behind: tree });

        // Right-wall screen door to the Kitchen.
        this.doorToKitchen = new Door(this, 1240, groundTop, { texture: 'screenDoor', side: 'left', to: 'Kitchen', enterAt: 'fromBackyard' });

        // One dispatcher for E-press interactions here (just Sloth today). The
        // doors are walk-into triggers and stay out (see the controller's note).
        this.interactions = new InteractionController(this);
        this.interactions.register(this.sloth);

        // Invisible physics floor -- the backdrop already draws the grass.
        this.ground = this.add.rectangle(width / 2, groundTop + GROUND_HEIGHT / 2, width, GROUND_HEIGHT)
            .setVisible(false);
        this.physics.add.existing(this.ground, true);

        const spawn = resolveSpawn(SPAWN_POINTS, data);
        this.pusheen = new Pusheen(this, spawn.x, groundTop - SPAWN.heightAboveGround);
        this.physics.add.collider(this.pusheen, this.ground);
        this.solids.forEach((solid) => this.physics.add.collider(this.pusheen, solid));

        this.cursors = this.input.keyboard.createCursorKeys();
        this.keys = this.input.keyboard.addKeys('W,A,S,D,SPACE,E');
        this.registry.set('input:interactPressed', false);
        this.registry.set('interact:available', false);

        // Waking Sloth opens the house: reveal the hidden path (activate + fade
        // its art in) and run her wake beat. Runs once when juice:delivered
        // flips true, or immediately on re-entry if it already happened.
        bindReveal(this, 'juice:delivered', (alreadyRevealed) => {
            this.doorToLivingRoom.activate();

            // Coming back to a yard where he's already up: the gate is just
            // part of the room now. The fade and the wake beat belong to the
            // moment it opens, not to every visit afterwards. (Play again
            // clears juice:delivered, so a fresh lap earns the reveal again.)
            if (alreadyRevealed) {
                return;
            }

            // Fade the gate in as he actually clears it. Starting the fade now
            // would finish it while he's still yawning on top of the thing it
            // reveals, so hold until the amble begins and then run it over most
            // of the plod -- the gate arrives with the move that uncovers it.
            this.doorToLivingRoom.alpha = 0;
            this.tweens.add({
                targets: this.doorToLivingRoom,
                alpha: 1,
                delay: SLOTH.yawnMs * 2 + SLOTH.dropMs,     // the yawn yoyos
                duration: SLOTH.ambleMs * 0.6,
                ease: 'Sine.easeOut'
            });
            // As he lets go of the branch he nudges Pusheen aside, so the gate
            // he reveals isn't right under her -- she has to walk over to it.
            this.sloth.playWakeBeat(() => this.shovePusheenAside());
        });

        this.transitioning = false;
        fadeInRoom(this);
    }

    // Sloth bumps Pusheen a little to the right as he drops, so the gate he
    // uncovers isn't under her feet (which would auto-trigger the transition).
    // A scripted slide: body off, tween across, hand back to physics -- the
    // same off-then-reset pattern the costume box uses.
    shovePusheenAside ()
    {
        const p = this.pusheen;
        const toX = Math.min(Math.max(p.x, 760) + 160, 1150);
        p.stopMoving();
        p.body.enable = false;
        this.tweens.add({
            targets: p,
            x: toX,
            duration: 520,
            ease: 'Quad.easeOut',
            onComplete: () => {
                p.body.enable = true;
                p.body.reset(p.x, p.y);
            }
        });
    }

    update ()
    {
        if (this.transitioning) {
            this.pusheen.stopMoving();
            this.pusheen.update();
            return;
        }

        // Consume any queued interact press before the wake-beat gate below,
        // so a tap made *during* the beat can't survive it and fire the moment
        // it ends.
        const interactPressed = Input.Keyboard.JustDown(this.keys.E) || this.registry.get('input:interactPressed');
        this.registry.set('input:interactPressed', false);

        // Sloth's wake beat owns the screen -- freeze input while it plays.
        // Must clear her acceleration every frame, not just skip the input
        // read: a held move button stays applied otherwise (unlike the costume
        // box, the wake beat doesn't take her body off physics) and she walks
        // out from under the beat.
        if (this.sloth.busy) {
            this.pusheen.stopMoving();
            this.pusheen.update();
            return;
        }

        this.interactions.update(this.pusheen);

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

        // Walk-into door triggers (the hidden one only fires once activated).
        if (this.doorToKitchen.checkTrigger(this.pusheen)) {
            fadeToRoom(this, this.doorToKitchen.to, { spawn: this.doorToKitchen.enterAt, fadeIn: true });
        } else if (this.doorToLivingRoom.checkTrigger(this.pusheen)) {
            fadeToRoom(this, this.doorToLivingRoom.to, { spawn: this.doorToLivingRoom.enterAt, fadeIn: true });
        }

        this.pusheen.update();
    }
}
