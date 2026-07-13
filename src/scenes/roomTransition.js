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

// Resolve a room's entry position from transition data: the named spawn the
// incoming door asked for, falling back to the room's default (a fresh boot or
// Play again passes no spawn). spawnPoints: { default: { x }, <name>: { x } }.
export function resolveSpawn (spawnPoints, data)
{
    return spawnPoints[data?.spawn] ?? spawnPoints.default;
}
