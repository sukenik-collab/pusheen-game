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
        // into real art later. Each is sized to its intended footprint. The
        // room backdrops are full 1280x720 images that the real art replaces.

        // Backyard backdrop: afternoon sky, sun + cloud, and a large tree on
        // the left with a low thick branch Sloth hangs from.
        this.makeTexture('backyardBg', 1280, 720, (gfx) => {
            gfx.fillStyle(0xbfe0e8, 1);
            gfx.fillRect(0, 0, 1280, 720);                 // sky
            gfx.fillStyle(0xf7e26b, 1);
            gfx.fillCircle(1030, 150, 72);                 // sun
            gfx.fillStyle(0xffffff, 1);
            gfx.fillRoundedRect(620, 130, 230, 70, 35);    // cloud
            gfx.fillStyle(0x9ac96b, 1);
            gfx.fillRect(0, 640, 1280, 80);                // grass
            gfx.fillStyle(0x6b4a2b, 1);
            gfx.fillRect(120, 200, 74, 480);               // trunk
            gfx.fillRoundedRect(170, 430, 260, 42, 21);    // low thick branch
            gfx.fillStyle(0x4f8f43, 1);
            gfx.fillCircle(175, 190, 185);                 // canopy
        });
        // Kitchen backdrop: warm wall, a window onto the backyard (continuity
        // -- same sun + tree), and a countertop the glass/fridge sit on.
        this.makeTexture('kitchenBg', 1280, 720, (gfx) => {
            gfx.fillStyle(0xf2e4c9, 1);
            gfx.fillRect(0, 0, 1280, 720);                 // wall
            gfx.fillStyle(0x9fd0e0, 1);
            gfx.fillRect(470, 120, 340, 210);              // window sky
            gfx.fillStyle(0xf7e26b, 1);
            gfx.fillCircle(760, 175, 30);                  // sun through window
            gfx.fillStyle(0x4f8f43, 1);
            gfx.fillCircle(540, 300, 78);                  // tree through window
            gfx.lineStyle(12, 0xffffff, 1);
            gfx.strokeRect(470, 120, 340, 210);            // window frame
            gfx.lineBetween(640, 120, 640, 330);
            gfx.lineBetween(470, 225, 810, 225);
            gfx.fillStyle(0xc9a97a, 1);
            gfx.fillRect(0, 604, 1280, 40);                // countertop
            gfx.fillStyle(0xb08e5f, 1);
            gfx.fillRect(0, 644, 1280, 76);                // cabinets below
        });
        // Sloth: a sleepy lump. Asleep = eyes as closed lines; awake = open
        // dots. Drawn hanging in the backyard; same footprint for both states.
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
        // The closed fridge in the room. Sized like the LivingRoom cabinet (160
        // tall, on the floor) so its centre-anchored zone is reachable.
        this.makeTexture('fridge', 150, 160, (gfx) => {
            gfx.fillStyle(0xe8ecef, 1);
            gfx.fillRoundedRect(0, 0, 150, 160, 10);
            gfx.fillStyle(0xbfc7cc, 1);
            gfx.fillRect(0, 68, 150, 6);           // door split
            gfx.fillRoundedRect(122, 22, 12, 44, 6);   // handle
        });
        // The fridge interior -- the peek panel backdrop when the fridge opens
        // (wide enough for its four items). Shelves + a cool interior.
        this.makeTexture('fridgeInside', 640, 300, (gfx) => {
            gfx.fillStyle(0xdfeef2, 1);
            gfx.fillRoundedRect(0, 0, 640, 300, 14);
            gfx.fillStyle(0xffffff, 1);
            gfx.fillRoundedRect(16, 16, 608, 268, 10);   // lit interior
            gfx.fillStyle(0xcfe0e4, 1);
            gfx.fillRect(28, 150, 584, 8);               // a shelf
        });
        // An empty glass (sits on the counter), and the same glass filled with
        // juice (what she carries after filling it).
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
        // The OJ pitcher inside the fridge (fill the glass from it).
        this.makeTexture('juicePitcher', 96, 112, (gfx) => {
            gfx.fillStyle(0xff9d2e, 1);
            gfx.fillRoundedRect(14, 26, 60, 78, 12);   // body of juice
            gfx.fillStyle(0xffb861, 1);
            gfx.fillRoundedRect(14, 26, 60, 20, 10);   // lighter top
            gfx.fillStyle(0xff9d2e, 1);
            gfx.fillTriangle(74, 34, 92, 40, 74, 52);  // spout
            gfx.lineStyle(8, 0xff8a00, 1);
            gfx.strokeCircle(78, 70, 14);              // handle
        });
        // Cozy fridge decoys -- selecting any of these gives the gentle nope.
        this.makeTexture('itemMilk', 72, 96, (gfx) => {
            gfx.fillStyle(0xffffff, 1);
            gfx.fillRoundedRect(10, 22, 52, 68, 6);
            gfx.fillTriangle(10, 22, 62, 22, 36, 2);   // carton peak
            gfx.fillStyle(0x7db7e8, 1);
            gfx.fillRect(10, 62, 52, 16);              // label
        });
        this.makeTexture('itemCheese', 88, 66, (gfx) => {
            gfx.fillStyle(0xf6c945, 1);
            gfx.fillTriangle(6, 60, 82, 60, 82, 12);   // wedge
            gfx.fillStyle(0xe6b52f, 1);
            gfx.fillCircle(52, 44, 6);                 // holes
            gfx.fillCircle(68, 34, 5);
        });
        this.makeTexture('itemLeftovers', 86, 68, (gfx) => {
            gfx.fillStyle(0xbcdce6, 0.85);
            gfx.fillRoundedRect(6, 14, 74, 48, 10);    // tub
            gfx.fillStyle(0x9fc9d6, 1);
            gfx.fillRoundedRect(2, 8, 82, 14, 7);      // lid
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
