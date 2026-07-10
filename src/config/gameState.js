// Run-scoped game state: everything a "Play again!" wipes back to a fresh
// lap. Lives here (not in a scene's create()) because room transitions
// restart scenes too, and re-entering a room must NOT reset progress --
// only a fresh boot (Preloader) and Play again call this.
export function resetRunState (registry)
{
    registry.set('snack:collected', false);
    registry.set('snack:count', 0);
}
