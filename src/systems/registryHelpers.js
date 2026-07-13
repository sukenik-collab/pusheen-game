// Subscribe to a registry key's changedata event and auto-remove the listener
// on the scene's shutdown.
//
// The registry's event emitter is global and outlives any one scene instance,
// so a listener added in create() -- which room transitions and Play-again
// both re-run -- would otherwise accumulate, piling up stale closures over
// dead scene instances. This generalizes the manual on/off cleanup LivingRoom
// did by hand for its one snack listener, so it's harder to reintroduce that
// leak as rooms multiply.
//
// `fn` receives Phaser's usual changedata args: (parent, value, previousValue).
export function subscribeRegistry (scene, key, fn)
{
    const event = `changedata-${key}`;
    scene.registry.events.on(event, fn);
    scene.events.once('shutdown', () => {
        scene.registry.events.off(event, fn);
    });
}
