import { Scene } from 'phaser';
import { TRACKS, SFX_SETS } from '../config/audioManifest.js';
import { resetRunState } from '../config/gameState.js';
import { AudioController } from '../audio/AudioController.js';

export class Preloader extends Scene
{
    constructor ()
    {
        super('Preloader');
    }

    preload ()
    {
        this.load.image('pusheen', 'assets/sprites/pusheen.png');
        this.load.image('cabinet', 'assets/sprites/cabinet.png');
        this.load.image('window', 'assets/sprites/window.png');
        this.load.image('couchBase', 'assets/sprites/couch-base.png');
        this.load.image('cushion', 'assets/sprites/cushion.png');
        this.load.image('drawer', 'assets/sprites/drawer.png');
        this.load.image('itemSocks', 'assets/sprites/item-socks.png');
        this.load.image('itemShirt', 'assets/sprites/item-shirt.png');
        this.load.image('itemPopcorn', 'assets/sprites/item-popcorn.png');

        // Bedroom + quest + costume art (sized to match their physics
        // footprints exactly, same convention as the furniture above).
        this.load.image('door', 'assets/sprites/door.png');
        this.load.image('bed', 'assets/sprites/bed.png');
        this.load.image('pillow', 'assets/sprites/pillow.png');
        this.load.image('dresser', 'assets/sprites/dresser.png');
        this.load.image('shelf', 'assets/sprites/shelf.png');
        this.load.image('rug', 'assets/sprites/rug.png');
        this.load.image('moonWindow', 'assets/sprites/moon-window.png');
        // Stormy has two faces: sad while her yarn is lost, happy once it's back.
        this.load.image('stormySad', 'assets/sprites/stormy-sad.png');
        this.load.image('stormyHappy', 'assets/sprites/stormy-happy.png');
        this.load.image('yarnBall', 'assets/sprites/yarn-ball.png');
        this.load.image('costumeBox', 'assets/sprites/costume-box.png');
        // The costumed Pusheen: horn, mane and rainbow tail are baked into this
        // sprite, which swaps in for 'pusheen' when she wears the costume.
        this.load.image('pusheencorn', 'assets/sprites/pusheencorn.png');

        // A tiny soft dot, reused as the sunbeam's dust-mote particle texture.
        const g = this.add.graphics();
        g.fillStyle(0xffffff, 1);
        g.fillCircle(4, 4, 4);
        g.generateTexture('dustMote', 8, 8);
        g.destroy();

        // v2 (Room Pair #2) placeholder art. Generated as flat shapes rather
        // than PNGs -- golden rule 5: placeholder only, shapes that can grow
        // into real art later. Each is sized to its intended footprint.
        this.makeTexture('tree', 130, 230, (gfx) => {
            gfx.fillStyle(0x6b4a2b, 1);
            gfx.fillRect(50, 120, 30, 110);        // trunk
            gfx.fillStyle(0x4f8f43, 1);
            gfx.fillCircle(65, 68, 65);            // canopy
        });
        this.makeTexture('hammock', 280, 70, (gfx) => {
            gfx.fillStyle(0xe0a06a, 1);
            gfx.fillRoundedRect(0, 14, 280, 42, 20);
        });
        // Sloth: a sleepy lump. Asleep = eyes as closed lines; awake = open dots.
        this.makeTexture('sloth', 130, 110, (gfx) => {
            gfx.fillStyle(0x9b8b76, 1);
            gfx.fillEllipse(65, 62, 122, 88);
            gfx.lineStyle(3, 0x5c5347, 1);
            gfx.lineBetween(44, 58, 58, 58);       // closed eyes
            gfx.lineBetween(72, 58, 86, 58);
        });
        this.makeTexture('slothAwake', 130, 110, (gfx) => {
            gfx.fillStyle(0xb0a086, 1);
            gfx.fillEllipse(65, 62, 122, 88);
            gfx.fillStyle(0x3e2c23, 1);
            gfx.fillCircle(51, 56, 5);             // open eyes
            gfx.fillCircle(79, 56, 5);
        });
        // Sized like the LivingRoom cabinet (160 tall, stands on the floor) so
        // its centre-anchored interaction zone stays reachable from the ground.
        this.makeTexture('fridge', 150, 160, (gfx) => {
            gfx.fillStyle(0xe8ecef, 1);
            gfx.fillRoundedRect(0, 0, 150, 160, 10);
            gfx.fillStyle(0xbfc7cc, 1);
            gfx.fillRect(0, 68, 150, 6);           // door split
            gfx.fillRoundedRect(122, 22, 12, 44, 6);   // handle
        });
        this.makeTexture('cupboard', 130, 130, (gfx) => {
            gfx.fillStyle(0x9c6b3f, 1);
            gfx.fillRoundedRect(0, 0, 130, 130, 8);
            gfx.lineStyle(3, 0x7a5230, 1);
            gfx.lineBetween(65, 6, 65, 124);       // twin doors
            gfx.fillStyle(0x5c3d22, 1);
            gfx.fillCircle(56, 65, 5);             // knobs
            gfx.fillCircle(74, 65, 5);
        });
        // An empty glass, and the same glass filled with juice.
        this.makeTexture('glass', 66, 84, (gfx) => {
            gfx.fillStyle(0xbfe0ef, 0.9);
            gfx.fillRoundedRect(12, 6, 42, 74, 8);
        });
        this.makeTexture('orangeJuice', 66, 84, (gfx) => {
            gfx.fillStyle(0xff9d2e, 1);
            gfx.fillRoundedRect(15, 28, 36, 50, 6);   // juice
            gfx.fillStyle(0xbfe0ef, 0.55);
            gfx.fillRoundedRect(12, 6, 42, 74, 8);    // glass over it
        });
        // A cozy filler mug for the glass cupboard (a gentle "nope" pick).
        this.makeTexture('mug', 66, 74, (gfx) => {
            gfx.fillStyle(0xd66b5a, 1);
            gfx.fillRoundedRect(8, 12, 42, 56, 8);
            gfx.lineStyle(6, 0xd66b5a, 1);
            gfx.strokeCircle(56, 40, 12);          // handle
        });

        // Audio: every selectable track + every SFX set's clips. The file path
        // doubles as the load key, so the manifest is the only place paths live.
        TRACKS.forEach((track) => this.load.audio(track.file, track.file));
        SFX_SETS.forEach((set) => {
            Object.values(set.clips).forEach((path) => this.load.audio(path, path));
        });
    }

    create ()
    {
        // Created once and kept in the registry so it (and the current track/
        // set choice) survives every LivingRoom restart -- Play again keeps the
        // same audio playing without a beat skip.
        const audio = new AudioController(this.game);
        this.registry.set('audio', audio);
        audio.startMusic();

        resetRunState(this.registry);

        // The connected house boots in the garden -- the LivingRoom/Bedroom
        // pair is reached later, once waking Sloth reveals the hidden path.
        this.scene.start('Backyard');
        this.scene.launch('UI');
    }

    // Draw a flat placeholder texture with a graphics callback, then free the
    // graphics object. Keeps all the v2 shape-art generation in one small form.
    makeTexture (key, w, h, draw)
    {
        const gfx = this.add.graphics();
        draw(gfx);
        gfx.generateTexture(key, w, h);
        gfx.destroy();
    }
}
