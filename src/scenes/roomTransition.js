import { DOOR } from '../config/feel.js';

// Fade through a warm dark tone, not harsh black -- a door in a cozy house,
// not a level gate.
const FADE_RGB = [46, 36, 31];

// Shared by every room scene (two callers already: LivingRoom and Bedroom).
// The scene must expose `transitioning` (checked in its update to freeze
// input) and `pusheen`.
export function fadeToRoom (scene, sceneKey, data)
{
    scene.transitioning = true;
    scene.pusheen.stopMoving();
    scene.cameras.main.fadeOut(DOOR.fadeMs, ...FADE_RGB);
    scene.cameras.main.once('camerafadeoutcomplete', () => {
        scene.scene.start(sceneKey, data);
    });
}

export function fadeInRoom (scene)
{
    scene.cameras.main.fadeIn(DOOR.fadeMs, ...FADE_RGB);
}
