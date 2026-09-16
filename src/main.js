import { AUTO, Game, Scale } from 'phaser';
import { Preloader } from './scenes/Preloader';
import { Backyard } from './scenes/Backyard';
import { Kitchen } from './scenes/Kitchen';
import { LivingRoom } from './scenes/LivingRoom';
import { Bedroom } from './scenes/Bedroom';
import { UI } from './scenes/UI';

// Find out more information about the Game Config at:
// https://docs.phaser.io/api-documentation/typedef/types-core#gameconfig
const config = {
    type: AUTO,
    width: 1280,
    height: 720,
    parent: 'game-container',
    backgroundColor: '#028af8',
    scale: {
        mode: Scale.FIT,
        autoCenter: Scale.CENTER_BOTH
    },
    physics: {
        default: 'arcade',
        arcade: {
            debug: false
        }
    },
    input: {
        // Default is 1 tracked pointer -- not enough for holding a
        // movement button while tapping jump/interact with a second
        // finger, the exact tablet-play scenario the touch controls are
        // for. Reserve room for a held move + jump + interact at once.
        activePointers: 3
    },
    scene: [
        Preloader,
        Backyard,
        Kitchen,
        LivingRoom,
        Bedroom,
        UI
    ]
};

document.addEventListener('DOMContentLoaded', () => {
    // Exposed so playtests can poke feel values / registry state from the
    // browser console without a rebuild.
    window.__pusheen = new Game(config);
});
