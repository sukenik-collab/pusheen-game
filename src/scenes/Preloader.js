import { Scene } from 'phaser';
import { TRACKS, SFX_SETS } from '../config/audioManifest.js';
import { resetRunState } from '../config/gameState.js';
import { AudioController } from '../audio/AudioController.js';

// The dark brown the real art outlines everything with. The generated item
// placeholders were flat fills with no outline at all, which is most of why
// they read as not-in-style next to the drawn sprites.
const ITEM_OUTLINE = 0x5a3a24;

// The Backyard's scenery palette, sampled from the tree art so the generated
// layers sit in the same world as it. Sky and grass are flat fills the scene
// draws itself (Backyard.js) rather than images; bushLine is where the horizon
// sits inside the bushes strip, so the scene can place it by that line.
export const BACKYARD = {
    sky: 0xbacbf4,
    grass: 0x80a56f,
    outline: 0x5a3018,
    sun: 0xf9bd56,
    cloud: 0xfbe8d5,
    bushHeight: 96,
    bushLine: 70
};

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

        // v2 real art (from docs/concept-art). The kitchen backdrop is 1376x768,
        // scaled to the 1280x720 canvas. All three Sloth poses are transparent
        // sprites pre-cropped to their display size.
        this.load.image('kitchenBg', 'assets/sprites/kitchen-bg.png');
        // The two cardboard boxes she climbs to the counter, one sprite cut by
        // tools/cut_boxes.py. Where she stands is inside the art, not its top
        // edge -- Kitchen.js gives each box an invisible ledge there.
        this.load.image('stepBoxes', 'assets/sprites/step-boxes.png');
        // The Backyard is layered rather than a single backdrop: sky, grass and
        // the bushes/sun/clouds are generated below, and only the tree is art.
        // That is what lets the branch be scaled and placed to the pixel where
        // Sloth grips it, instead of the sloth being posed to fit a painting.
        this.load.image('tree', 'assets/sprites/backyard-tree.png');
        // Hanging, he's two layers the tree draws between (see Sloth.js).
        this.load.image('slothHangingFront', 'assets/sprites/sloth-hanging-front.png');
        this.load.image('slothHangingBack', 'assets/sprites/sloth-hanging-back.png');
        // His awake poses, cut from the same concept set: standing mid-stretch,
        // then settled on his belly.
        this.load.image('slothAwake', 'assets/sprites/sloth-awake.png');
        this.load.image('slothSitting', 'assets/sprites/sloth-sitting.png');

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

        // Dedicated door art (placeholders): a screen door for the room-to-room
        // screen doorways, and a garden gate for the backyard's revealed path.
        this.makeTexture('screenDoor', 76, 150, (gfx) => {
            gfx.fillStyle(0x8a6d4f, 1);
            gfx.fillRoundedRect(0, 0, 76, 150, 8);          // frame
            gfx.fillStyle(0xcfe3d8, 1);
            gfx.fillRect(8, 8, 60, 134);                    // mesh panel
            gfx.lineStyle(1, 0x9fb8ad, 1);
            for (let mx = 14; mx < 68; mx += 8) gfx.lineBetween(mx, 8, mx, 142);
            for (let my = 14; my < 142; my += 8) gfx.lineBetween(8, my, 68, my);
        });
        this.makeTexture('gardenGate', 76, 150, (gfx) => {
            gfx.fillStyle(0xb98c5a, 1);
            for (let px = 6; px < 70; px += 20) gfx.fillRoundedRect(px, 20, 12, 128, 4);  // pickets
            gfx.fillRoundedRect(2, 46, 72, 12, 4);          // rails
            gfx.fillRoundedRect(2, 104, 72, 12, 4);
        });
        // The Backyard's scenery, in the same flat style as the tree art it sits
        // with: thick dark outline, flat fill, no shading. Sky and grass are
        // rectangles in the scene, so only these three need textures.
        this.makeTexture('sun', 190, 190, (gfx) => {
            const c = 95;
            gfx.fillStyle(BACKYARD.outline, 1);
            for (let i = 0; i < 8; i++) {                  // chunky rounded rays
                const a = (i * Math.PI) / 4;
                gfx.fillCircle(c + Math.cos(a) * 78, c + Math.sin(a) * 78, 11);
            }
            gfx.fillCircle(c, c, 58);
            gfx.fillStyle(BACKYARD.sun, 1);
            for (let i = 0; i < 8; i++) {
                const a = (i * Math.PI) / 4;
                gfx.fillCircle(c + Math.cos(a) * 78, c + Math.sin(a) * 78, 7);
            }
            gfx.fillCircle(c, c, 52);
        });
        // Drawn as an outline blob with the fill laid back over it, so the
        // lumps merge into one silhouette instead of showing their own seams.
        this.makeTexture('cloud', 210, 116, (gfx) => {
            const puff = [[62, 58, 46], [118, 50, 38], [162, 66, 32]];
            for (const [color, grow] of [[BACKYARD.outline, 5], [BACKYARD.cloud, 0]]) {
                gfx.fillStyle(color, 1);
                puff.forEach(([x, y, r]) => gfx.fillCircle(x, y, r + grow));
                gfx.fillRoundedRect(16 - grow, 58 - grow, 178 + grow * 2, 46 + grow * 2, 22);
            }
        });
        // The scalloped hedge along the horizon. The strip carries the horizon
        // line itself at `bushLine`, with the lumps drawn over it so they
        // interrupt it the way they do in the tree art.
        this.makeTexture('bushes', 1280, BACKYARD.bushHeight, (gfx) => {
            const line = BACKYARD.bushLine;
            gfx.fillStyle(BACKYARD.grass, 1);
            gfx.fillRect(0, line, 1280, BACKYARD.bushHeight - line);
            gfx.fillStyle(BACKYARD.outline, 1);
            gfx.fillRect(0, line, 1280, 5);
            const radii = [26, 17, 30, 21, 15, 28, 19, 24];
            const lumps = [];
            for (let i = 0, x = 10; x < 1290; i++) {
                const r = radii[i % radii.length];
                lumps.push({ x, r });
                x += r + 14;
            }
            for (const [color, grow] of [[BACKYARD.outline, 5], [BACKYARD.grass, 0]]) {
                gfx.fillStyle(color, 1);
                lumps.forEach(({ x, r }) => gfx.fillCircle(x, line + 12, r + grow));
            }
            gfx.fillStyle(BACKYARD.grass, 1);        // keep the line's underside clean
            gfx.fillRect(0, line + 5, 1280, BACKYARD.bushHeight - line - 5);
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
        // The OJ pitcher inside the fridge (fill the glass from it). Handle on
        // the LEFT, spout on the RIGHT -- they were both on the right, stacked
        // on top of each other, which is not a shape a jug can be.
        this.makeTexture('juicePitcher', 112, 112, (gfx) => {
            // Handle first so the body covers its inner half and it reads as
            // attached rather than as a ring parked beside the jug.
            gfx.lineStyle(11, 0xffb861, 1);
            gfx.strokeCircle(32, 66, 20);
            gfx.lineStyle(4, ITEM_OUTLINE, 1);
            gfx.strokeCircle(32, 66, 26);
            gfx.strokeCircle(32, 66, 15);

            gfx.fillStyle(0xff9d2e, 1);
            gfx.fillRoundedRect(34, 24, 58, 80, 13);   // body of juice
            gfx.fillStyle(0xffb861, 1);
            gfx.fillRoundedRect(34, 24, 58, 20, 11);   // lighter juice line
            gfx.lineStyle(4, ITEM_OUTLINE, 1);
            gfx.strokeRoundedRect(34, 24, 58, 80, 13);

            // Spout last, so it sits over the body outline it grows out of.
            gfx.fillStyle(0xffb861, 1);
            gfx.fillTriangle(86, 34, 108, 44, 86, 58);
            gfx.lineStyle(4, ITEM_OUTLINE, 1);
            gfx.beginPath();
            gfx.moveTo(86, 34);
            gfx.lineTo(108, 44);
            gfx.lineTo(86, 58);
            gfx.strokePath();                          // outer edges only
        });
        // Cozy fridge decoys -- selecting any of these gives the gentle nope.
        // Warm off-white, NOT #ffffff: the fridge interior behind it is pure
        // white, so the old carton was invisible apart from its label band.
        this.makeTexture('itemMilk', 72, 100, (gfx) => {
            gfx.fillStyle(0xf6efe2, 1);
            gfx.fillRoundedRect(10, 32, 52, 60, 7);
            gfx.fillStyle(0x7db7e8, 1);
            gfx.fillTriangle(10, 34, 62, 34, 36, 8);   // gable roof
            gfx.fillRoundedRect(16, 58, 40, 18, 4);    // label band
            gfx.lineStyle(4, ITEM_OUTLINE, 1);
            gfx.strokeRoundedRect(10, 32, 52, 60, 7);
            gfx.strokeTriangle(10, 34, 62, 34, 36, 8);
        });
        // A blunt-nosed wedge rather than a bare right triangle, with the
        // outline and real outlined holes -- the flat sharp triangle with two
        // darker dots read as a smudge, not as cheese.
        this.makeTexture('itemCheese', 96, 76, (gfx) => {
            const wedge = [
                { x: 22, y: 60 }, { x: 68, y: 60 }, { x: 82, y: 48 },
                { x: 82, y: 28 }, { x: 70, y: 22 }, { x: 20, y: 52 }
            ];
            gfx.fillStyle(0xf6c945, 1);
            gfx.fillPoints(wedge, true);
            gfx.lineStyle(4, ITEM_OUTLINE, 1);
            gfx.strokePoints(wedge, true);

            gfx.fillStyle(0xe0a91f, 1);
            gfx.lineStyle(3, ITEM_OUTLINE, 1);
            [[54, 44, 7], [70, 38, 5], [42, 50, 4]].forEach(([hx, hy, r]) => {
                gfx.fillCircle(hx, hy, r);
                gfx.strokeCircle(hx, hy, r);
            });
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
