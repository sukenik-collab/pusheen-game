import { subscribeRegistry } from './registryHelpers.js';

// Binds a reveal to a registry flag: when the flag flips true, run `onReveal`
// once (tween in a sprite, activate a hidden Door, etc.). If the flag is
// already true at bind time -- a room re-entered after the reveal already
// happened this run -- run immediately so the revealed state shows without
// needing a re-trigger. Auto-cleans its listener on scene shutdown via
// subscribeRegistry.
//
// `onReveal(alreadyRevealed)` is told which of those two it is, so a caller
// can save the ceremony (a fade, a one-time beat) for the moment the thing
// actually opens and just show the finished state on later visits.
//
// Net-new for v2 (Sloth's `juice:delivered` flag -> activate the backyard
// hidden-path Door + reveal its art). Ships unused in v1.5.
export function bindReveal (scene, flag, onReveal)
{
    let done = false;
    const run = (alreadyRevealed) => {
        if (done) {
            return;
        }
        done = true;
        onReveal(alreadyRevealed);
    };

    if (scene.registry.get(flag)) {
        run(true);
        return;
    }

    subscribeRegistry(scene, flag, (parent, value) => {
        if (value) {
            run(false);
        }
    });
}
