// Owns E-press interaction dispatch for one room. Every registered entity
// meets the Interactable contract (see entities/Interactable.js): concentric
// outer/inner sensor zones, an inInnerZone flag, update(pusheen), a verb, an
// optional isActionable(scene) semantic gate, and interact(pusheen, scene).
//
// This replaces the per-room hand-OR of every entity's inInnerZone (to publish
// interact:available) and the copy-pasted E-press if/else priority chain. The
// publish is guarded -- Phaser fires changedata on every set(), even when the
// value is unchanged, so UI's listener must only see real transitions.
//
// NOTE: walk-into triggers (doors, the sunbeam nap) are deliberately NOT
// registered here. They auto-fire on entry rather than on an E-press, have no
// lead cue, and carry bespoke gating (transition freeze; snack-collected +
// grounded). They stay wired directly in each scene's update(). If a future
// need appears they could be moved under a controller, but that's not this
// system's job today.
export class InteractionController
{
    constructor (scene)
    {
        this.scene = scene;
        this.items = [];
    }

    register (interactable)
    {
        this.items.push(interactable);
        return interactable;
    }

    // Drop an interactable that's removing itself from the room (the yarn and
    // the counter glass both destroy themselves once taken). Without this they
    // stay in `items` and get update()d as destroyed objects every frame --
    // inert today only because each one's own taken/collected guard returns
    // first.
    unregister (interactable)
    {
        const index = this.items.indexOf(interactable);
        if (index !== -1) {
            this.items.splice(index, 1);
        }
    }

    isActionable (item)
    {
        return item.isActionable ? item.isActionable(this.scene) : true;
    }

    // Recompute every entity's zones/cues, then publish whether any actionable
    // interaction is currently in range. Guarded (only set on change).
    //
    // `suppress` forces availability false regardless of zones -- for a scene
    // that owns the screen with a modal beat (e.g. LivingRoom during the nap)
    // and must not let the interact button reappear underneath it. Entities
    // still update every frame; only the publish is forced off.
    update (pusheen, { suppress = false } = {})
    {
        this.items.forEach((item) => item.update(pusheen));

        const available = !suppress && this.items.some((item) => item.inInnerZone && this.isActionable(item));
        if (available !== this.scene.registry.get('interact:available')) {
            this.scene.registry.set('interact:available', available);
        }
    }

    // Dispatch E to the nearest in-range actionable interaction (distance from
    // pusheen to the inner-zone center); ties fall to registration order. With
    // today's non-overlapping zones this reproduces the old positional
    // priority, but it degrades gracefully if zones ever cluster.
    pressInteract (pusheen)
    {
        let best = null;
        let bestDist = Infinity;

        this.items.forEach((item) => {
            if (!item.inInnerZone || !this.isActionable(item)) {
                return;
            }

            const dx = pusheen.x - item.innerZone.x;
            const dy = pusheen.y - item.innerZone.y;
            const dist = dx * dx + dy * dy;

            if (dist < bestDist) {
                bestDist = dist;
                best = item;
            }
        });

        best?.interact(pusheen, this.scene);
    }
}
