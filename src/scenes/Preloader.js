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
        this.load.image('stormy', 'assets/sprites/stormy.png');
        this.load.image('yarnBall', 'assets/sprites/yarn-ball.png');
        this.load.image('costumeBox', 'assets/sprites/costume-box.png');
        this.load.image('horn', 'assets/sprites/horn.png');

        // A tiny soft dot, reused as the sunbeam's dust-mote particle texture.
        const g = this.add.graphics();
        g.fillStyle(0xffffff, 1);
        g.fillCircle(4, 4, 4);
        g.generateTexture('dustMote', 8, 8);
        g.destroy();

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

        this.scene.start('LivingRoom');
        this.scene.launch('UI');
    }
}
