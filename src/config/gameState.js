// Run-scoped game state: everything a "Play again!" wipes back to a fresh
// lap. Lives here (not in a scene's create()) because room transitions
// restart scenes too, and re-entering a room must NOT reset progress --
// only a fresh boot (Preloader) and Play again call this.

// One entry per hidden yarn ball; each room spawns the balls it hosts
// unless that ball is already collected this run.
export const YARN_IDS = ['couch', 'dryer', 'bed', 'shelf'];

export function resetRunState (registry)
{
    registry.set('snack:collected', false);
    registry.set('snack:count', 0);

    registry.set('yarn:count', 0);
    YARN_IDS.forEach((id) => registry.set(`yarn:collected:${id}`, false));
    registry.set('quest:complete', false);

    registry.set('costume:pusheencorn', false);

    // The Laundry Room's basket, once tipped, stays a heap by the dryer for
    // the rest of the run.
    registry.set('laundry:basketTipped', false);

    // v2 -- the juice quest (Room Pair #2).
    registry.set('sloth:met', false);
    registry.set('held:item', 'none');     // 'none' | 'glass' | 'juice'
    registry.set('glass:taken', false);    // the counter glass, gone once picked up
    registry.set('juice:delivered', false);
}
