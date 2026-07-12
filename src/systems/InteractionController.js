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

    isActionable (item)
    {
        return item.isActionable ? item.isActionable(this.scene) : true;
    }

    // Recompute every entity's zones/cues, then publish whether any actionable
    // interaction is currently in range. Guarded (only set on change).
    update (pusheen)
    {
        this.items.forEach((item) => item.update(pusheen));

        const available = this.items.some((item) => item.inInnerZone && this.isActionable(item));
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
