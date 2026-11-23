import { Scene } from 'phaser';
import { TRACKS, SFX_SETS } from '../config/audioManifest.js';
import { resetRunState } from '../config/gameState.js';
import { AudioController } from '../audio/AudioController.js';
import { initAnalytics } from '../analytics.js';
import { showSplash } from '../splash.js';
import { LAUNDRY } from '../config/feel.js';

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

        // The two doorways, the fridge's insides, and its contents -- all cut
        // by tools/cut_prop.py or tools/cut_items.py from docs/concept-art.
        // The garden gate is wider than its door frame: two decorative posts
        // (ivy on the left, the latch on the right) flank the picket panel
        // that actually swings, which is what Door.js's zoneWidth is sized to
        // (see Backyard.js) rather than the sprite's own full width.
        this.load.image('screenDoor', 'assets/sprites/screen-door.png');
        this.load.image('gardenGate', 'assets/sprites/garden-gate.png');
        this.load.image('fridgeInside', 'assets/sprites/fridge-inside.png');
        this.load.image('glass', 'assets/sprites/glass.png');
        this.load.image('orangeJuice', 'assets/sprites/orange-juice.png');
        this.load.image('juicePitcher', 'assets/sprites/juice-pitcher.png');
        this.load.image('itemMilk', 'assets/sprites/item-milk.png');
        this.load.image('itemCheese', 'assets/sprites/item-cheese.png');
        this.load.image('itemLeftovers', 'assets/sprites/item-leftovers.png');

        // The backyard butterfly's five-piece rig (tools/cut_butterfly.py):
        // body+antennae plus four wing quadrants, each flapped independently
        // in Butterfly.js rather than one flat sprite.
        this.load.image('butterflyBody', 'assets/sprites/butterfly-body.png');
        this.load.image('butterflyWingUL', 'assets/sprites/butterfly-wing-ul.png');
        this.load.image('butterflyWingUR', 'assets/sprites/butterfly-wing-ur.png');
        this.load.image('butterflyWingLL', 'assets/sprites/butterfly-wing-ll.png');
        this.load.image('butterflyWingLR', 'assets/sprites/butterfly-wing-lr.png');

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
        // Laundry Room placeholders (no real art yet; prompts to come in
        // docs/art-prompts.md). Heights come from LAUNDRY in feel.js, which
        // derives them from the jump, so the art and the bodies stay matched.
        this.makeLaundryTextures();

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
        // same audio playing without a beat skip. The music itself waits for
        // her first move (Pusheen.startMusicOnFirstMove).
        const audio = new AudioController(this.game);
        this.registry.set('audio', audio);

        resetRunState(this.registry);
        initAnalytics(this.game);

        // The connected house boots in the garden -- the LivingRoom/Bedroom
        // pair is reached later, once waking Sloth reveals the hidden path.
        this.scene.start('Backyard');
        this.scene.launch('UI');
        showSplash(this.game);
    }

    // Flat placeholder shapes for the Laundry Room, in the same chunky
    // outlined style as the backyard's generated scenery.
    makeLaundryTextures ()
    {
        const OUTLINE = 0x4a3b33;
        const drumMachine = (key, body, trim, drum) => {
            const h = LAUNDRY.dryerHeight;
            this.makeTexture(key, 110, h, (gfx) => {
                gfx.fillStyle(OUTLINE, 1);
                gfx.fillRoundedRect(0, 0, 110, h, 10);
                gfx.fillStyle(body, 1);
                gfx.fillRoundedRect(4, 4, 102, h - 8, 8);
                gfx.fillStyle(trim, 1);
                gfx.fillRect(4, 18, 102, 4);                   // control panel line
                gfx.fillStyle(OUTLINE, 1);
                gfx.fillCircle(20, 11, 4);                     // dial
                gfx.fillCircle(55, 22 + (h - 22) / 2, 32);     // door rim
                gfx.fillStyle(drum, 1);
                gfx.fillCircle(55, 22 + (h - 22) / 2, 26);     // door glass
            });
        };
        drumMachine('dryer', 0xfbf7ef, 0xe2d6c4, 0xd7a86e);   // warm: the dryer
        drumMachine('washer', 0xf1f4f6, 0xc9d3da, 0x9ec6dd);  // cool: the washer

        // The sink unit, the same height as the machines so the three make
        // one counter run: a flat worktop with the basin set into it, on a
        // wooden cupboard. Its tap is a separate wall sprite above it, so
        // nothing sticks up from the counter she can walk along.
        this.makeTexture('sink', 110, LAUNDRY.dryerHeight, (gfx) => {
            const h = LAUNDRY.dryerHeight;
            gfx.fillStyle(OUTLINE, 1);
            gfx.fillRoundedRect(0, 0, 110, 18, 5);             // worktop
            gfx.fillRoundedRect(4, 14, 102, h - 14, 6);        // cupboard
            gfx.fillStyle(0xdfe6e9, 1);
            gfx.fillRoundedRect(3, 3, 104, 12, 4);
            gfx.fillStyle(0xb9c6cc, 1);
            gfx.fillRoundedRect(22, 5, 66, 6, 3);              // the basin's rim
            gfx.fillStyle(0xe1a578, 1);
            gfx.fillRect(8, 19, 46, h - 24);                   // two doors
            gfx.fillRect(58, 19, 44, h - 24);
            gfx.fillStyle(OUTLINE, 1);
            gfx.fillCircle(48, 19 + (h - 24) / 2, 3);          // knobs
            gfx.fillCircle(64, 19 + (h - 24) / 2, 3);
        });
        this.makeTexture('sinkTap', 44, 34, (gfx) => {
            gfx.fillStyle(OUTLINE, 1);
            gfx.fillRoundedRect(4, 0, 36, 12, 5);              // wall plate + handles
            gfx.fillRoundedRect(17, 6, 10, 28, 4);             // spout, curving down
            gfx.fillStyle(0xc9d3da, 1);
            gfx.fillRoundedRect(7, 3, 30, 6, 3);
            gfx.fillRoundedRect(20, 8, 4, 23, 2);
        });

        this.makeTexture('foldingTable', 200, LAUNDRY.tableHeight, (gfx) => {
            const h = LAUNDRY.tableHeight;
            gfx.fillStyle(OUTLINE, 1);
            gfx.fillRoundedRect(0, 0, 200, 14, 5);             // top
            gfx.fillRect(22, 10, 10, h - 10);                  // legs
            gfx.fillRect(168, 10, 10, h - 10);
            gfx.fillStyle(0xc89b6d, 1);
            gfx.fillRoundedRect(3, 3, 194, 8, 4);
            gfx.fillRect(25, 12, 4, h - 14);
            gfx.fillRect(171, 12, 4, h - 14);
        });

        this.makeTexture('laundryBasket', 70, 46, (gfx) => {
            gfx.fillStyle(0xf6a6c1, 1);                        // a sock poking out
            gfx.fillRoundedRect(12, 0, 16, 16, 6);
            gfx.fillStyle(0x9fd0e8, 1);                        // and a shirt
            gfx.fillCircle(44, 12, 11);
            gfx.fillStyle(OUTLINE, 1);
            gfx.fillRoundedRect(2, 12, 66, 34, 8);
            gfx.fillStyle(0xe7c48e, 1);
            gfx.fillRoundedRect(6, 16, 58, 26, 6);
            gfx.fillStyle(0xc99d5f, 1);                        // weave
            [24, 32].forEach((y) => gfx.fillRect(8, y, 54, 3));
        });

        this.makeTexture('laundryHeap', 100, LAUNDRY.heapHeight, (gfx) => {
            const h = LAUNDRY.heapHeight;
            const lumps = [
                [22, h - 18, 18, 0xf6a6c1],
                [50, h - 25, 20, 0x9fd0e8],
                [78, h - 18, 18, 0xfff1a8],
                [38, h - 32, 13, 0xc7e8b5],
                [64, h - 31, 12, 0xf9d1a6]
            ];
            for (const [color, grow] of [[OUTLINE, 4], [null, 0]]) {
                lumps.forEach(([x, y, r, fill]) => {
                    gfx.fillStyle(color ?? fill, 1);
                    gfx.fillCircle(x, y, r + grow);
                });
            }
            gfx.fillStyle(OUTLINE, 1);
            gfx.fillRoundedRect(4, h - 14, 92, 14, 6);
            gfx.fillStyle(0xe8d7f1, 1);
            gfx.fillRoundedRect(8, h - 11, 84, 8, 4);
        });

        this.makeTexture('roundWindow', 96, 96, (gfx) => {
            gfx.fillStyle(OUTLINE, 1);
            gfx.fillCircle(48, 48, 48);
            gfx.fillStyle(0xfff6d8, 1);
            gfx.fillCircle(48, 48, 40);
            gfx.fillStyle(OUTLINE, 1);
            gfx.fillRect(44, 8, 8, 80);                        // cross frame
            gfx.fillRect(8, 44, 80, 8);
        });
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
